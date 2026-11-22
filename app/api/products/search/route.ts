import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Database from "better-sqlite3";
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

const SearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "featured"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = SearchSchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { q, category, minPrice, maxPrice, inStock, featured, sort, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const db = new Database(DB_PATH);
  db.pragma("busy_timeout = 5000");

  try {
    let where = "visible = 1";
    const params: any[] = [];

    if (q) {
      where += ` AND (name LIKE ? OR description LIKE ? OR category LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like);
    }

    if (category) {
      where += ` AND category = ?`;
      params.push(category);
    }

    if (minPrice !== undefined) {
      where += ` AND price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      where += ` AND price <= ?`;
      params.push(maxPrice);
    }

    if (inStock === "true") {
      where += ` AND stock > 0`;
    } else if (inStock === "false") {
      where += ` AND stock <= 0`;
    }

    if (featured === "true") {
      where += ` AND featured = 1`;
    } else if (featured === "false") {
      where += ` AND featured = 0`;
    }

    let orderBy = "created_at DESC";
    if (sort === "price_asc") orderBy = "price ASC";
    else if (sort === "price_desc") orderBy = "price DESC";
    else if (sort === "featured") orderBy = "featured DESC, created_at DESC";

    const countRow = db
      .prepare(`SELECT COUNT(*) as c FROM products WHERE ${where}`)
      .get(params) as { c: number };
    const total = countRow.c;

    const products = db
      .prepare(`
        SELECT id, name, slug, sku, price, discountPrice, stock, lowStockThreshold,
               category, sizes, colors, badge, description, visible, featured, created_at
        FROM products
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `)
      .all([...params, limit, offset]) as Array<{
        id: number;
        name: string;
        slug: string | null;
        sku: string | null;
        price: number;
        discountPrice: number | null;
        stock: number;
        lowStockThreshold: number;
        category: string;
        sizes: string;
        colors: string;
        badge: string | null;
        description: string | null;
        visible: number;
        featured: number;
        created_at: string;
      }>;

    // Parse array fields
    const formatted = products.map((p) => ({
      ...p,
      sizes: p.sizes ? JSON.parse(p.sizes) : [],
      colors: p.colors ? JSON.parse(p.colors) : [],
      discountPrice: p.discountPrice ?? undefined,
      badge: p.badge ?? undefined,
      description: p.description ?? undefined,
      slug: p.slug ?? undefined,
      sku: p.sku ?? undefined,
    }));

    return NextResponse.json({
      products: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      filters: {
        q,
        category,
        minPrice,
        maxPrice,
        inStock,
        featured,
        sort,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  } finally {
    db.close();
  }
}
