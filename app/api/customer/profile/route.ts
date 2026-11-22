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

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
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
    const customer = db
      .prepare(`SELECT id, name, email, phone FROM customers WHERE id = ?`)
      .get(customerId) as { id: number; name: string; email: string; phone: string | null } | undefined;

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone || "" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  } finally {
    db.close();
  }
}

export async function PUT(req: NextRequest) {
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

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, phone } = parsed.data;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    // If email is being changed, check for uniqueness
    if (email) {
      const existing = db
        .prepare(`SELECT id FROM customers WHERE email = ? AND id != ?`)
        .get(email, customerId) as { id: number } | undefined;
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const fields: string[] = [];
    const values: any[] = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (email !== undefined) { fields.push("email = ?"); values.push(email); }
    if (phone !== undefined) { fields.push("phone = ?"); values.push(phone); }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push("updated_at = ?");
    values.push(new Date().toISOString(), customerId);

    db.prepare(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    const updated = db
      .prepare(`SELECT id, name, email, phone FROM customers WHERE id = ?`)
      .get(customerId) as { id: number; name: string; email: string; phone: string | null };

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      customer: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone || "" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  } finally {
    db.close();
  }
}