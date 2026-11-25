import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { createHmac, createHash } from "crypto";

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
const JWT_SECRET = process.env.PAYLOAD_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

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
    const secretKey = derivePayloadSecret(JWT_SECRET);
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

const MarkReadSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
});

export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    let where = "1=1";
    const params: unknown[] = [];

    if (unreadOnly) {
      where += ` AND is_read = 0`;
    }

    const alerts = db
      .prepare(`
        SELECT sa.id, sa.product_id, sa.alert_type, sa.message, sa.is_read, sa.created_at,
               p.name as product_name, p.sku as product_sku, p.stock as current_stock
        FROM stock_alerts sa
        JOIN products p ON sa.product_id = p.id
        WHERE ${where}
        ORDER BY sa.created_at DESC
        LIMIT ?
      `)
      .all([limit]) as Array<{
        id: string;
        product_id: number;
        alert_type: string;
        message: string;
        is_read: number;
        created_at: string;
        product_name: string;
        product_sku: string | null;
        current_stock: number;
      }>;

    const unreadCount = db
      .prepare(`SELECT COUNT(*) as c FROM stock_alerts WHERE is_read = 0`)
      .get() as { c: number };

    return NextResponse.json({
      alerts: alerts.map((a) => ({
        ...a,
        isRead: Boolean(a.is_read),
      })),
      unreadCount: unreadCount.c,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch alerts" }, { status: 500 });
  } finally {
    db.close();
  }
}

export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const action = req.headers.get("x-alert-action") || "mark_read";

  if (action === "mark_read") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = MarkReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = new Database(DB_PATH);

    try {
      db.prepare(`UPDATE stock_alerts SET is_read = 1 WHERE id = ?`).run(parsed.data.alertId);
      return NextResponse.json({ ok: true, message: "Alert marked as read" });
    } finally {
      db.close();
    }
  }

  if (action === "mark_all_read") {
    const db = new Database(DB_PATH);
    try {
      db.prepare(`UPDATE stock_alerts SET is_read = 1`).run();
      return NextResponse.json({ ok: true, message: "All alerts marked as read" });
    } finally {
      db.close();
    }
  }

  if (action === "generate") {
    // Generate alerts for low-stock and out-of-stock products
    const db = new Database(DB_PATH);
    db.pragma("busy_timeout = 5000");

    try {
      const transaction = db.transaction(() => {
        // Clear existing unread alerts first (regenerate fresh)
        db.prepare(`DELETE FROM stock_alerts WHERE is_read = 0`).run();

        const lowStockProducts = db
          .prepare(`
            SELECT id, name, sku, stock, low_stock_threshold FROM products
            WHERE stock > 0 AND stock <= low_stock_threshold
          `)
          .all() as Array<{ id: number; name: string; sku: string | null; stock: number; low_stock_threshold: number }>;

        const outOfStockProducts = db
          .prepare(`SELECT id, name, sku, stock FROM products WHERE stock <= 0`)
          .all() as Array<{ id: number; name: string; sku: string | null; stock: number }>;

        const now = new Date().toISOString();

        for (const p of lowStockProducts) {
          db.prepare(`
            INSERT INTO stock_alerts (id, product_id, alert_type, message, is_read, created_at)
            VALUES (?, ?, 'low_stock', ?, 0, ?)
          `).run(
            crypto.randomUUID(),
            p.id,
            `Low stock: "${p.name}" has ${p.stock} units remaining (threshold: ${p.low_stock_threshold})`,
            now
          );
        }

        for (const p of outOfStockProducts) {
          db.prepare(`
            INSERT INTO stock_alerts (id, product_id, alert_type, message, is_read, created_at)
            VALUES (?, ?, 'out_of_stock', ?, 0, ?)
          `).run(
            crypto.randomUUID(),
            p.id,
            `Out of stock: "${p.name}" is no longer available`,
            now
          );
        }

        return { lowStockCount: lowStockProducts.length, outOfStockCount: outOfStockProducts.length };
      });

      const result = transaction();
      return NextResponse.json({
        ok: true,
        message: "Stock alerts generated",
        ...result,
      });
    } finally {
      db.close();
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
