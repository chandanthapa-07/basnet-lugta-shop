import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import { createHmac } from "crypto";
import { readFileSync } from "fs";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";
const SHIPPING_FEE = 150; // Flat shipping fee in NPR

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

// In-memory idempotency store (use Redis in production)
const idempotencyStore = new Map<string, { response: any; status: number; createdAt: number }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanIdempotencyStore(): void {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.createdAt > IDEMPOTENCY_TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}
setInterval(cleanIdempotencyStore, 60 * 60 * 1000);

// In-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function verifyToken(token: string): { sub: string; email: string; role: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest();
    if (base64url(expectedSig) !== signature) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}

const CheckoutSchema = z.object({
  items: z.array(
    z.object({
      product: z.string().min(1, "Product ID is required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Quantity cannot exceed 10"),
    })
  ),
  shipping: z.object({
    name: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone is required"),
    district: z.string().optional(),
    email: z.string().email("Valid email is required").optional(),
    address: z.string().min(1, "Address is required"),
    landmark: z.string().optional(),
    note: z.string().optional(),
  }),
  paymentMethod: z.enum(["cash_on_delivery"]).default("cash_on_delivery"),
});

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.cookies.get("basnet-auth-token")?.value;
  if (cookie) return cookie;
  return null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(`checkout:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) {
    const existing = idempotencyStore.get(idempotencyKey);
    if (existing && Date.now() - existing.createdAt < IDEMPOTENCY_TTL_MS) {
      return NextResponse.json(existing.response, { status: existing.status });
    }
  }

  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") {
    return NextResponse.json({ error: "Invalid or customer token required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { items, shipping, paymentMethod } = parsed.data;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    // Find or create customer
    let customerRow = db
      .prepare(`SELECT id, name, email FROM customers WHERE email = ?`)
      .get(payload.email) as { id: number; name: string; email: string } | undefined;

    let customerId: number;
    if (customerRow) {
      customerId = customerRow.id;
    } else {
      const created = db
        .prepare(`INSERT INTO customers (name, email, password_hash, created_at, updated_at) VALUES (?, ?, '', ?, ?)`)
        .run(payload.name || payload.email, payload.email, new Date().toISOString(), new Date().toISOString());
      customerId = Number(created.lastInsertRowid);
    }

    // Generate unique order number with collision check
    let orderNumber: string;
    let attempts = 0;
    do {
      orderNumber = "ORD-" + randomBytes(4).toString("hex").toUpperCase();
      attempts++;
      if (attempts > 10) {
        return NextResponse.json({ error: "Failed to generate unique order number" }, { status: 500 });
      }
    } while (db.prepare(`SELECT id FROM orders WHERE order_number = ?`).get(orderNumber));

    // BEGIN IMMEDIATE transaction for atomic inventory + order creation
    const transaction = db.transaction(() => {
      // Verify products, prices, and stock atomically
      const validatedItems: Array<{
        productId: number;
        name: string;
        price: number;
        quantity: number;
        image: string | null;
        subtotal: number;
      }> = [];

      let subtotal = 0;

      for (const item of items) {
        const product = db
          .prepare(`SELECT id, name, price, stock, image_id FROM products WHERE id = ?`)
          .get(item.product) as {
            id: number;
            name: string;
            price: number;
            stock: number;
            image_id: number | null;
          } | undefined;

        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Never trust client-submitted price; use database value
        const dbPrice = Number(product.price);
        const itemSubtotal = dbPrice * item.quantity;
        subtotal += itemSubtotal;

        // Verify stock availability (no overselling)
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}" (available: ${product.stock}, requested: ${item.quantity})`);
        }

        // Get image URL
        let imageUrl: string | null = null;
        if (product.image_id) {
          const media = db
            .prepare(`SELECT url FROM media WHERE id = ?`)
            .get(product.image_id) as { url: string | null } | undefined;
          imageUrl = media?.url || null;
        }

        validatedItems.push({
          productId: product.id,
          name: product.name,
          price: dbPrice,
          quantity: item.quantity,
          image: imageUrl,
          subtotal: itemSubtotal,
        });

        // Deduct stock atomically (no overselling)
        db.prepare(`UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?`).run(
          item.quantity,
          new Date().toISOString(),
          product.id,
          item.quantity
        );
      }

      const total = subtotal + SHIPPING_FEE;

      // Create order
      const orderResult = db
        .prepare(`
          INSERT INTO orders (order_number, customer_id, subtotal, status, payment_status, payment_method,
            shipping_name, shipping_phone, shipping_district, shipping_email, shipping_address,
            shipping_landmark, shipping_note, created_at, updated_at)
          VALUES (?, ?, ?, 'New', 'Unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          orderNumber,
          customerId,
          total,
          paymentMethod,
          shipping.name,
          shipping.phone,
          shipping.district || "",
          shipping.email || payload.email || "",
          shipping.address,
          shipping.landmark || "",
          shipping.note || "",
          new Date().toISOString(),
          new Date().toISOString()
        );

      const orderId = Number(orderResult.lastInsertRowid);

      // Create order items
      for (const item of validatedItems) {
        db.prepare(`
          INSERT INTO orders_items (_order, _parent_id, id, product_id, name, price, quantity, image)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          orderId,
          orderId,
          randomBytes(16).toString("hex"),
          item.productId,
          item.name,
          item.price,
          item.quantity,
          item.image
        );
      }

      return { orderId, orderNumber, customerId, subtotal, total, items: validatedItems };
    });

    const result = transaction();

    const response = {
      ok: true,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      subtotal: result.subtotal,
      shipping: SHIPPING_FEE,
      total: result.total,
      paymentMethod,
      paymentStatus: "Unpaid",
      status: "New",
      message: "Order placed successfully. We will confirm by phone shortly.",
    };

    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        response,
        status: 200,
        createdAt: Date.now(),
      });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 400 });
  } finally {
    db.close();
  }
}
