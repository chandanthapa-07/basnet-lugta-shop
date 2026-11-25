import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { createHmac, createHash } from "crypto";
import { readFileSync } from "fs";

function loadEnvFile(filePath: string): void {
  try {
    const envFile = readFileSync(filePath, "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (key && process.env[key] === undefined) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch {
    // .env.local may not exist
  }
}

loadEnvFile(".env.local");

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function derivePayloadSecret(rawSecret: string): Buffer {
  return createHash("sha256").update(rawSecret).digest().subarray(0, 16);
}

function verifyAdminToken(token: string): { id: number; email: string; name: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;
    const rawSecret: string = (() => {
      const secret = process.env.PAYLOAD_SECRET;
      if (secret) return secret;
      if (process.env.NODE_ENV === "production") {
        throw new Error("PAYLOAD_SECRET is required in production");
      }
      return "dev-secret-do-not-use-in-production";
    })();
    const secretKey = derivePayloadSecret(rawSecret);
    const expectedSig = createHmac("sha256", secretKey).update(`${headerB64}.${payloadB64}`).digest();
    if (base64url(expectedSig) !== signature) return null;
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64").toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    if (decoded.collection !== "admin-users") return null;
    return { id: Number(decoded.i || decoded.sub || decoded.id), email: decoded.email || "", name: decoded.name || "", role: decoded.role || "owner" };
  } catch {
    return null;
  }
}

async function authenticateAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("payload-token")?.value;
    if (!token) return null;

    const admin = verifyAdminToken(token);
    if (!admin) return null;

    // Verify admin still exists in SQLite
    const db = new Database(DB_PATH);
    try {
      const user = db
        .prepare(`SELECT id, email, name, role FROM admin_users WHERE id = ?`)
        .get(admin.id) as { id: number; email: string; name: string; role: string } | undefined;
      if (!user) return null;
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const invoice = searchParams.get("invoice") === "true";
  const { id } = await params;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const order = db
      .prepare(`
        SELECT o.*, s.name as customer_name, s.email as customer_email
        FROM orders o
        JOIN customers s ON o.customer_id = s.id
        WHERE o.id = ?
      `)
      .get(id) as { id: number; order_number: string; customer_id: number; subtotal: number; status: string; payment_status: string; payment_method: string; shipping_name: string; shipping_phone: string; shipping_district: string; shipping_email: string; shipping_address: string; shipping_landmark: string; shipping_note: string; created_at: string; updated_at: string; customer_name: string; customer_email: string } | undefined;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = db
      .prepare(`SELECT * FROM orders_items WHERE _order = ?`)
      .all(id) as Array<{
        id: string;
        product_id: number;
        name: string;
        price: number;
        quantity: number;
        image: string | null;
      }>;

    const shipping = 150;
    const total = order.subtotal + shipping;

    if (invoice) {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${order.order_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .shop-name { font-size: 24px; font-weight: bold; color: #7b2c2c; }
    .invoice-title { font-size: 18px; font-weight: bold; margin-top: 10px; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .detail-block { flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; background: #f9f9f9; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    .demo-label { background: #fff3cd; color: #856404; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">Basnet Lugta Shop</div>
    <div>Buddhist Clothing & Meditation Wear</div>
    <div>Kathmandu, Nepal</div>
    <div class="invoice-title">INVOICE</div>
    <span class="demo-label">DEMONSTRATION DATA</span>
  </div>

  <div class="details">
    <div class="detail-block">
      <strong>Invoice No:</strong> ${order.order_number}<br>
      <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
      <strong>Order Status:</strong> ${order.status}<br>
      <strong>Payment Status:</strong> ${order.payment_status}<br>
      <strong>Payment Method:</strong> ${order.payment_method}
    </div>
    <div class="detail-block">
      <strong>Bill To:</strong><br>
      ${order.shipping_name}<br>
      ${order.shipping_address}<br>
      ${order.shipping_district || ""}<br>
      Phone: ${order.shipping_phone}<br>
      Email: ${order.shipping_email || order.customer_email}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th><th>Qty</th><th>Price (NPR)</th><th>Total (NPR)</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.price}</td>
          <td>${item.price * item.quantity}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <table>
    <tr><td><strong>Subtotal:</strong></td><td><strong>रु ${order.subtotal}</strong></td></tr>
    <tr><td>Shipping:</td><td>रु ${shipping}</td></tr>
    <tr class="total-row"><td>Total:</td><td>रु ${total}</td></tr>
  </table>

  <div class="footer">
    Thank you for shopping with Basnet Lugta Shop!<br>
    This is a demonstration invoice.
  </div>
</body>
</html>
      `;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="invoice-${order.order_number}.html"`,
        },
      });
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      subtotal: order.subtotal,
      shipping,
      total,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingName: order.shipping_name,
      shippingPhone: order.shipping_phone,
      shippingDistrict: order.shipping_district,
      shippingEmail: order.shipping_email,
      shippingAddress: order.shipping_address,
      shippingLandmark: order.shipping_landmark,
      shippingNote: order.shipping_note,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch order" }, { status: 500 });
  } finally {
    db.close();
  }
}
