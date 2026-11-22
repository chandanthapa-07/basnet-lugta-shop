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

const AddressUpdateSchema = z.object({
  label: z.enum(["Home", "Office", "Other"]).optional(),
  recipient_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  municipality: z.string().min(1).optional(),
  ward_number: z.string().min(1).optional(),
  street_tole: z.string().min(1).optional(),
  house_landmark: z.string().optional().nullable(),
  delivery_instructions: z.string().optional().nullable(),
  is_default: z.boolean().optional(),
});

function getCustomerIdFromToken(req: NextRequest): string | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") return null;
  return payload.sub;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerId = getCustomerIdFromToken(req);
  if (!customerId) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = AddressUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const existing = db.prepare(`SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?`).get(id, customerId) as { id: number } | undefined;
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    const transaction = db.transaction(() => {
      if (parsed.data.is_default === true) {
        db.prepare(`UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?`).run(customerId);
      }
      const fields: string[] = [];
      const values: any[] = [];
      if (parsed.data.label !== undefined) { fields.push("label = ?"); values.push(parsed.data.label); }
      if (parsed.data.recipient_name !== undefined) { fields.push("recipient_name = ?"); values.push(parsed.data.recipient_name); }
      if (parsed.data.phone !== undefined) { fields.push("phone = ?"); values.push(parsed.data.phone); }
      if (parsed.data.province !== undefined) { fields.push("province = ?"); values.push(parsed.data.province); }
      if (parsed.data.district !== undefined) { fields.push("district = ?"); values.push(parsed.data.district); }
      if (parsed.data.municipality !== undefined) { fields.push("municipality = ?"); values.push(parsed.data.municipality); }
      if (parsed.data.ward_number !== undefined) { fields.push("ward_number = ?"); values.push(parsed.data.ward_number); }
      if (parsed.data.street_tole !== undefined) { fields.push("street_tole = ?"); values.push(parsed.data.street_tole); }
      if (parsed.data.house_landmark !== undefined) { fields.push("house_landmark = ?"); values.push(parsed.data.house_landmark); }
      if (parsed.data.delivery_instructions !== undefined) { fields.push("delivery_instructions = ?"); values.push(parsed.data.delivery_instructions); }
      if (parsed.data.is_default !== undefined) { fields.push("is_default = ?"); values.push(parsed.data.is_default ? 1 : 0); }
      fields.push("updated_at = ?");
      values.push(new Date().toISOString(), id);
      db.prepare(`UPDATE customer_addresses SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    });
    transaction();
    return NextResponse.json({ ok: true, message: "Address updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update address" }, { status: 500 });
  } finally { db.close(); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerId = getCustomerIdFromToken(req);
  if (!customerId) {
    return NextResponse.json({ error: "Customer authentication required" }, { status: 401 });
  }
  const { id } = await params;
  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");
  try {
    const existing = db.prepare(`SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?`).get(id, customerId) as { id: number } | undefined;
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });
    db.prepare(`DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?`).run(id, customerId);
    return NextResponse.json({ ok: true, message: "Address deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete address" }, { status: 500 });
  } finally { db.close(); }
}