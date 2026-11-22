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
  } catch {
    // .env.local may not exist
  }
}

loadEnvFile(".env.local");

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

const ReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  title: z.string().max(100, "Title must be at most 100 characters").optional(),
  comment: z.string().max(2000, "Comment must be at most 2000 characters").optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    const reviews = db
      .prepare(`
        SELECT id, rating, title, comment, customer_name, customer_email,
               verified_purchase, helpful_count, created_at
        FROM product_reviews
        WHERE product_id = ? AND status = 'published'
        ORDER BY created_at DESC
      `)
      .all(id) as Array<{
        id: number;
        rating: number;
        title: string | null;
        comment: string | null;
        customer_name: string;
        customer_email: string;
        verified_purchase: number;
        helpful_count: number;
        created_at: string;
      }>;

    const summary = db
      .prepare(`
        SELECT COUNT(*) as count, AVG(rating) as avg_rating
        FROM product_reviews
        WHERE product_id = ? AND status = 'published'
      `)
      .get(id) as { count: number; avg_rating: number | null };

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        ...r,
        verifiedPurchase: Boolean(r.verified_purchase),
      })),
      summary: {
        count: summary.count,
        averageRating: summary.avg_rating ? Math.round(summary.avg_rating * 10) / 10 : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch reviews" }, { status: 500 });
  } finally {
    db.close();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== "customer") {
    return NextResponse.json({ error: "Invalid or customer token required" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { rating, title, comment } = parsed.data;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    // Verify product exists
    const product = db
      .prepare(`SELECT id FROM products WHERE id = ?`)
      .get(id) as { id: number } | undefined;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if customer already reviewed this product
    const existing = db
      .prepare(`SELECT id FROM product_reviews WHERE product_id = ? AND customer_id = ?`)
      .get(id, payload.sub) as { id: number } | undefined;

    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // Get customer info
    const customer = db
      .prepare(`SELECT name, email FROM customers WHERE id = ?`)
      .get(payload.sub) as { name: string; email: string } | undefined;

    const now = new Date().toISOString();

    const result = db
      .prepare(`
        INSERT INTO product_reviews (
          product_id, customer_id, customer_name, customer_email,
          rating, title, comment, status, verified_purchase, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?)
      `)
      .run(
        id,
        payload.sub,
        customer?.name || payload.name,
        customer?.email || payload.email,
        rating,
        title || null,
        comment || null,
        now,
        now
      );

    return NextResponse.json({
      ok: true,
      reviewId: Number(result.lastInsertRowid),
      message: "Review submitted successfully",
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit review" }, { status: 500 });
  } finally {
    db.close();
  }
}
