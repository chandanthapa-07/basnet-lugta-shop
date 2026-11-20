import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const VALID_STATUSES = ["New", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
const VALID_PAYMENT_STATUSES = ["Unpaid", "Paid", "Refunded"];

const OrderActionSchema = z.object({
  action: z.enum(["confirm", "cancel", "ship", "deliver", "return"]),
  reason: z.string().optional(),
});

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
    const rawSecret = process.env.PAYLOAD_SECRET || "dev-secret-change-me";
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

function verifyCustomerToken(token: string): { sub: string; email: string; role: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payloadB64, signature] = parts;
    const base64url = (input: Buffer | string): string => Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const expectedSig = createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-secret-change-me").update(`${header}.${payloadB64}`).digest();
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

// ============================================
// SELLER ORDERS - List with search/filter
// ============================================
export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100);

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    let where = "1=1";
    const params: any[] = [];

    if (search) {
      where += ` AND (o.order_number LIKE ? OR s.name LIKE ? OR s.email LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
      }
      where += ` AND o.status = ?`;
      params.push(status);
    }

    const countRow = db
      .prepare(`SELECT COUNT(*) as c FROM orders o JOIN customers s ON o.customer_id = s.id WHERE ${where}`)
      .get(params) as { c: number };
    const total = countRow.c;
    const offset = (page - 1) * limit;

    const orders = db
      .prepare(`
        SELECT o.id, o.order_number, o.customer_id, o.subtotal, o.status, o.payment_status,
               o.payment_method, o.shipping_name, o.shipping_phone, o.shipping_district,
               o.shipping_email, o.shipping_address, o.shipping_landmark, o.shipping_note,
               o.created_at, o.updated_at,
               s.name as customer_name, s.email as customer_email
        FROM orders o
        JOIN customers s ON o.customer_id = s.id
        WHERE ${where}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all([...params, limit, offset]) as Array<{
        id: number;
        order_number: string;
        customer_id: number;
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
        customer_name: string;
        customer_email: string;
      }>;

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = db
          .prepare(`SELECT id, product_id, name, price, quantity, image FROM orders_items WHERE _order = ?`)
          .all(order.id);
        return { ...order, items };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  } finally {
    db.close();
  }
}

// ============================================
// SELLER ORDERS - Actions (confirm, cancel, ship, deliver, return)
// ============================================
export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = OrderActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, reason } = parsed.data;
  const orderId = req.headers.get("x-order-id");
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required in X-Order-Id header" }, { status: 400 });
  }

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const transaction = db.transaction(() => {
      const order = db
        .prepare(`SELECT * FROM orders WHERE id = ?`)
        .get(orderId) as { id: number; status: string; payment_status: string } | undefined;

      if (!order) {
        throw new Error("Order not found");
      }

      let newStatus: string;
      let restoreStock = false;

      switch (action) {
        case "confirm":
          if (order.status !== "New") throw new Error("Only New orders can be confirmed");
          newStatus = "Confirmed";
          break;
        case "cancel":
          if (!["New", "Confirmed", "Processing"].includes(order.status)) {
            throw new Error("Order cannot be cancelled at this stage");
          }
          newStatus = "Cancelled";
          restoreStock = true;
          break;
        case "ship":
          if (order.status !== "Confirmed" && order.status !== "Processing") {
            throw new Error("Only Confirmed/Processing orders can be shipped");
          }
          newStatus = "Shipped";
          break;
        case "deliver":
          if (order.status !== "Shipped") throw new Error("Only Shipped orders can be delivered");
          newStatus = "Delivered";
          break;
        case "return":
          if (order.status !== "Delivered") throw new Error("Only Delivered orders can be returned");
          newStatus = "Returned";
          restoreStock = true;
          break;
      }

      if (restoreStock) {
        const items = db
          .prepare(`SELECT product_id, quantity FROM orders_items WHERE _order = ?`)
          .all(orderId) as Array<{ product_id: number; quantity: number }>;
        for (const item of items) {
          db.prepare(`UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`).run(
            item.quantity,
            new Date().toISOString(),
            item.product_id
          );
        }
      }

      db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(
        newStatus,
        new Date().toISOString(),
        orderId
      );

      return { orderId, newStatus, restoreStock };
    });

    const result = transaction();

    return NextResponse.json({
      ok: true,
      message: "Order " + action + "ed successfully",
      orderId: Number(orderId),
      newStatus: result.newStatus,
      stockRestored: result.restoreStock,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Order action failed" }, { status: 400 });
  } finally {
    db.close();
  }
}
