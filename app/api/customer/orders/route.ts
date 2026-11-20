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

export async function GET(req: NextRequest) {
  const customer = await authenticateCustomer(req);
  if (!customer) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 100);

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    // Find customer by email
    const customerRow = db
      .prepare(`SELECT id FROM customers WHERE email = ?`)
      .get(customer.email) as { id: number } | undefined;

    if (!customerRow) {
      return NextResponse.json({ orders: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const customerId = customerRow.id;
    const offset = (page - 1) * limit;

    const countRow = db
      .prepare(`SELECT COUNT(*) as c FROM orders WHERE customer_id = ?`)
      .get(customerId) as { c: number };
    const total = countRow.c;

    const orders = db
      .prepare(`
        SELECT id, order_number, subtotal, status, payment_status, payment_method,
               shipping_name, shipping_phone, shipping_address, created_at, updated_at
        FROM orders
        WHERE customer_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all([customerId, limit, offset]) as Array<{
        id: number;
        order_number: string;
        subtotal: number;
        status: string;
        payment_status: string;
        payment_method: string;
        shipping_name: string;
        shipping_phone: string;
        shipping_address: string;
        created_at: string;
        updated_at: string;
      }>;

    const ordersWithItems = orders.map((order) => {
      const items = db
        .prepare(`SELECT id, product_id, name, price, quantity, image FROM orders_items WHERE _order = ?`)
        .all(order.id);
      return {
        ...order,
        shipping: 150,
        total: order.subtotal + 150,
        items,
      };
    });

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
