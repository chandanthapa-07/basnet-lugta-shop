import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  } catch {}
}

loadEnvFile(".env.local");

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

const AddressSchema = z.object({
  label: z.enum(["Home", "Office", "Other"]).default("Home"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(1, "Phone number is required"),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  municipality: z.string().min(1, "Municipality is required"),
  ward_number: z.string().min(1, "Ward number is required"),
  street_tole: z.string().min(1, "Street/Tole is required"),
  house_landmark: z.string().optional(),
  delivery_instructions: z.string().optional(),
  is_default: z.boolean().optional(),
});

function getCustomerIdFromToken(req: NextRequest): string | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") return null;
  return payload.sub;
}

export async function GET(req: NextRequest) {
  const customerId = getCustomerIdFromToken(req);
  if (!customerId) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const addresses = db
      .prepare(`
        SELECT id, label, recipient_name, phone, province, district, municipality,
               ward_number, street_tole, house_landmark, delivery_instructions,
               is_default, created_at, updated_at
        FROM customer_addresses
        WHERE customer_id = ?
        ORDER BY is_default DESC, created_at DESC
      `)
      .all(customerId) as Array<{
        id: number;
        label: string;
        recipient_name: string;
        phone: string;
        province: string;
        district: string;
        municipality: string;
        ward_number: string;
        street_tole: string;
        house_landmark: string | null;
        delivery_instructions: string | null;
        is_default: number;
        created_at: string;
        updated_at: string;
      }>;

    return NextResponse.json({ addresses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch addresses" }, { status: 500 });
  } finally {
    db.close();
  }
}

export async function POST(req: NextRequest) {
  const customerId = getCustomerIdFromToken(req);
  if (!customerId) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { label, recipient_name, phone, province, district, municipality, ward_number, street_tole, house_landmark, delivery_instructions, is_default } = parsed.data;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const transaction = db.transaction(() => {
      // If setting as default, unset other defaults for this customer
      if (is_default) {
        db.prepare(`UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?`).run(customerId);
      }

      const result = db.prepare(`
        INSERT INTO customer_addresses (customer_id, label, recipient_name, phone, province, district, municipality, ward_number, street_tole, house_landmark, delivery_instructions, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customerId,
        label,
        recipient_name,
        phone,
        province,
        district,
        municipality,
        ward_number,
        street_tole,
        house_landmark || null,
        delivery_instructions || null,
        is_default ? 1 : 0
      );

      return Number(result.lastInsertRowid);
    });

    const addressId = transaction();

    return NextResponse.json({
      ok: true,
      message: "Address saved successfully",
      addressId,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save address" }, { status: 500 });
  } finally {
    db.close();
  }
}