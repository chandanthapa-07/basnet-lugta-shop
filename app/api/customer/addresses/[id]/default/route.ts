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
  } catch {}
}

loadEnvFile(".env.local");

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

function getCustomerIdFromToken(req: NextRequest): string | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") return null;
  return payload.sub;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const transaction = db.transaction(() => {
      db.prepare(`UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?`).run(customerId);
      db.prepare(`UPDATE customer_addresses SET is_default = 1, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
    });
    transaction();

    return NextResponse.json({ ok: true, message: "Default address updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to set default address" }, { status: 500 });
  } finally { db.close(); }
}