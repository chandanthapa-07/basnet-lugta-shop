import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

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

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") {
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
      .get(payload.email) as { id: number } | undefined;

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
