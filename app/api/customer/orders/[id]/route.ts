import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { createHmac } from "crypto";
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
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function verifyCustomerToken(token: string): { sub: string; email: string; role: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payloadB64, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payloadB64}`).digest();
    if (base64url(expectedSig) !== signature) return null;
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64").toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    if (decoded.role !== "customer") return null;
    return { sub: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}

async function authenticateCustomer(req: NextRequest) {
  const cookieToken = req.cookies.get("basnet-auth-token")?.value;
  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customer = await authenticateCustomer(req);
  if (!customer) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  const { id } = await params;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const customerRow = db
      .prepare(`SELECT id FROM customers WHERE email = ?`)
      .get(customer.email) as { id: number } | undefined;

    if (!customerRow) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const order = db
      .prepare(`
        SELECT id, order_number, subtotal, status, payment_status, payment_method,
               shipping_name, shipping_phone, shipping_district, shipping_email,
               shipping_address, shipping_landmark, shipping_note, created_at, updated_at
        FROM orders
        WHERE id = ? AND customer_id = ?
      `)
      .get(id, customerRow.id) as {
        id: number;
        order_number: string;
        subtotal: number;
        status: string;
        payment_status: string;
        payment_method: string;
        shipping_name: string;
        shipping_phone: string;
        shipping_district: string;
        shipping_email: string;
        shipping_address: string;
        shipping_landmark: string;
        shipping_note: string;
        created_at: string;
        updated_at: string;
      } | undefined;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = db
      .prepare(`SELECT id, product_id, name, price, quantity, image FROM orders_items WHERE _order = ?`)
      .all(id);

    return NextResponse.json({
      id: order.id,
      orderNumber: order.order_number,
      subtotal: order.subtotal,
      shipping: 150,
      total: order.subtotal + 150,
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
      items: items.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order" }, { status: 500 });
  } finally {
    db.close();
  }
}
