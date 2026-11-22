import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { verifyToken, getTokenFromRequest, COOKIE_NAME } from "@/app/lib/auth";

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
  } catch {}
}

loadEnvFile(".env.local");

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

export async function GET(req: Request) {
  const token = getTokenFromRequest(req as any);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const customer = db
      .prepare(`SELECT id, name, email, phone, created_at, updated_at FROM customers WHERE email = ?`)
      .get(payload.email) as { id: number; name: string; email: string; phone: string | null; created_at: string; updated_at: string } | undefined;

    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const addresses = db
      .prepare(`
        SELECT id, label, recipient_name, phone, province, district, municipality,
               ward_number, street_tole, house_landmark, delivery_instructions,
               is_default, created_at, updated_at
        FROM customer_addresses
        WHERE customer_id = ?
        ORDER BY is_default DESC, created_at DESC
      `)
      .all(customer.id);

    // Fetch orders via Payload for consistency
    const { getCustomerOrders } = await import("@/app/lib/payload");
    const orders = await getCustomerOrders(String(customer.id));

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        addresses: addresses.map((a: any) => ({
          id: a.id,
          label: a.label,
          recipientName: a.recipient_name,
          phone: a.phone,
          province: a.province,
          district: a.district,
          municipality: a.municipality,
          wardNumber: a.ward_number,
          streetTole: a.street_tole,
          houseLandmark: a.house_landmark,
          deliveryInstructions: a.delivery_instructions,
          isDefault: Boolean(a.is_default),
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        })),
      },
      orders,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } finally {
    db.close();
  }
}
