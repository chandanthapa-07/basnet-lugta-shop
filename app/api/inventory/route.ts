import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Database from "better-sqlite3";
import { createHmac, createHash, randomUUID } from "crypto";
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

const AdjustmentSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  adjustmentType: z.enum(["add", "reduce", "restock"]),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
});

const ThresholdSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  lowStockThreshold: z.number().int().min(0, "Threshold must be at least 0"),
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

async function authenticateAdmin(req: NextRequest): Promise<{ id: number; email: string; name: string; role: string } | null> {
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

export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view");
  const productId = searchParams.get("productId");
  const limit = parseInt(searchParams.get("limit") || "50");

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    if (view === "out-of-stock") {
      const products = db
        .prepare(
          `SELECT id, name, sku, stock, low_stock_threshold, category FROM products WHERE stock <= 0 ORDER BY name`
        )
        .all() as Array<{
          id: number;
          name: string;
          sku: string;
          stock: number;
          low_stock_threshold: number;
          category: string;
        }>;

      return NextResponse.json({ products, count: products.length });
    }

    if (view === "low-stock") {
      const products = db
        .prepare(
          `SELECT id, name, sku, stock, low_stock_threshold, category FROM products WHERE stock > 0 AND stock <= low_stock_threshold ORDER BY stock ASC`
        )
        .all() as Array<{
          id: number;
          name: string;
          sku: string;
          stock: number;
          low_stock_threshold: number;
          category: string;
        }>;

      return NextResponse.json({ products, count: products.length });
    }

    let query = `
      SELECT sm.id, sm.product_id, sm.adjustment_type, sm.quantity, sm.previous_stock,
             sm.new_stock, sm.reason, sm.admin_id, sm.admin_name, sm.created_at,
             p.name as product_name, p.sku as product_sku
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
    `;
    const params: any[] = [];

    if (productId) {
      query += ` WHERE sm.product_id = ?`;
      params.push(productId);
    }

    query += ` ORDER BY sm.created_at DESC LIMIT ?`;
    params.push(limit);

    const movements = db.prepare(query).all(params) as Array<{
      id: string;
      product_id: number;
      adjustment_type: string;
      quantity: number;
      previous_stock: number;
      new_stock: number;
      reason: string;
      admin_id: number | null;
      admin_name: string | null;
      created_at: string;
      product_name: string;
      product_sku: string;
    }>;

    return NextResponse.json({ movements, count: movements.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch inventory" }, { status: 500 });
  } finally {
    db.close();
  }
}

export async function POST(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const action = (req.headers.get("x-inventory-action") || "adjust").toLowerCase();

  if (action === "threshold") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = ThresholdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, lowStockThreshold } = parsed.data;
    const db = new Database(DB_PATH);

    try {
      const product = db
        .prepare(`SELECT id, name FROM products WHERE id = ?`)
        .get(productId) as { id: number; name: string } | undefined;

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      db.prepare(`UPDATE products SET low_stock_threshold = ?, updated_at = ? WHERE id = ?`).run(
        lowStockThreshold,
        new Date().toISOString(),
        productId
      );

      return NextResponse.json({
        ok: true,
        message: `Low stock threshold updated for ${product.name}`,
        productId,
        lowStockThreshold,
      });
    } finally {
      db.close();
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = AdjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { productId, adjustmentType, quantity, reason } = parsed.data;
  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const transaction = db.transaction(() => {
      const product = db
        .prepare(`SELECT id, name, stock FROM products WHERE id = ?`)
        .get(productId) as { id: number; name: string; stock: number } | undefined;

      if (!product) {
        throw new Error("Product not found");
      }

      const previousStock = product.stock;
      let newStock: number;

      if (adjustmentType === "reduce") {
        newStock = previousStock - quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock: ${product.name} has ${previousStock} units, cannot reduce by ${quantity}`);
        }
      } else if (adjustmentType === "restock") {
        newStock = quantity;
      } else {
        newStock = previousStock + quantity;
      }

      db.prepare(`UPDATE products SET stock = ?, updated_at = ? WHERE id = ?`).run(
        newStock,
        new Date().toISOString(),
        productId
      );

      db.prepare(`
        INSERT INTO stock_movements (id, product_id, adjustment_type, quantity, previous_stock, new_stock, reason, admin_id, admin_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        randomUUID(),
        productId,
        adjustmentType,
        quantity,
        previousStock,
        newStock,
        reason,
        admin.id,
        admin.name,
        new Date().toISOString()
      );

      return { productId, productName: product.name, previousStock, newStock, adjustmentType, quantity };
    });

    const result = transaction();

    return NextResponse.json({
      ok: true,
      message: "Stock " + adjustmentType + "ed successfully",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Inventory adjustment failed" }, { status: 400 });
  } finally {
    db.close();
  }
}
