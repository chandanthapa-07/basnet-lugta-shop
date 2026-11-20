#!/usr/bin/env node
/**
 * Product seeding script for Basnet Lugta Shop.
 * Creates demonstration products using Payload's Local API.
 *
 * This script is idempotent: it checks for existing products by SKU and skips
 * creation if a product with the same SKU already exists.
 *
 * All seeded data is clearly marked as demonstration data.
 *
 * Usage:
 *   npm run seed-products
 *
 * Inspect seeded products:
 *   npm run inspect-products
 */

import { getPayload } from "payload";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import sharp from "sharp";

async function loadEnvFile(filePath: string): Promise<void> {
  try {
    const fs = await import("fs");
    const envFile = fs.readFileSync(filePath, "utf-8");
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
    // .env.local may not exist; rely on process.env already set.
  }
}

await loadEnvFile(".env.local");

const DEMO_PREFIX = "[DEMO] ";
const UPLOADS_DIR = join(process.cwd(), "public", "uploads", "seed");

function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function createPlaceholderImage(filePath: string, color: string, text: string): void {
  const svg = `
    <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${text}</text>
    </svg>
  `;
  writeFileSync(filePath, Buffer.from(svg));
}

const DEMO_PRODUCTS = [
  {
    name: `${DEMO_PREFIX}Traditional Buddhist Robe`,
    slug: "demo-traditional-buddhist-robe",
    sku: "DEMO-ROBE-001",
    description:
      "Authentic traditional Buddhist ceremonial robe crafted in Kathmandu. Made from premium cotton blend with traditional stitching patterns.",
    price: 8500,
    discountPrice: 6900,
    category: "Robes",
    sizes: [{ size: "S" }, { size: "M" }, { size: "L" }, { size: "XL" }],
    colors: [{ color: "Maroon" }, { color: "Saffron" }, { color: "Natural" }],
    stock: 25,
    lowStockThreshold: 5,
    badge: "Bestseller",
    featured: true,
    visible: true,
    imageColor: "#7b2c2c",
    imageText: "Traditional Robe",
  },
  {
    name: `${DEMO_PREFIX}Maroon Zen Robe`,
    slug: "demo-maroon-zen-robe",
    sku: "DEMO-ROBE-002",
    description:
      "Deep maroon Zen meditation robe for daily practice. Soft, breathable fabric designed for comfort during extended sitting.",
    price: 7200,
    discountPrice: null,
    category: "Robes",
    sizes: [{ size: "M" }, { size: "L" }],
    colors: [{ color: "Maroon" }],
    stock: 12,
    lowStockThreshold: 3,
    badge: null,
    featured: true,
    visible: true,
    imageColor: "#8e1b1b",
    imageText: "Maroon Zen Robe",
  },
  {
    name: `${DEMO_PREFIX}Himalayan Wool Wrap`,
    slug: "demo-himalayan-wool-wrap",
    sku: "DEMO-WRAP-001",
    description:
      "Hand-woven Himalayan wool wrap sourced from high-altitude pastoral communities. Warm, durable, and ideal for meditation in cool climates.",
    price: 12500,
    discountPrice: 10500,
    category: "Shawls & Wraps",
    sizes: [{ size: "One Size" }],
    colors: [{ color: "Natural" }, { color: "Charcoal" }, { color: "Cream" }],
    stock: 18,
    lowStockThreshold: 4,
    badge: "Handmade",
    featured: false,
    visible: true,
    imageColor: "#6b5b4b",
    imageText: "Himalayan Wool Wrap",
  },
  {
    name: `${DEMO_PREFIX}Saffron Practice Clothing`,
    slug: "demo-saffron-practice-clothing",
    sku: "DEMO-PRACTICE-001",
    description:
      "Traditional saffron-dyed practice clothing for monks and practitioners. Lightweight cotton for daily wear and meditation.",
    price: 5400,
    discountPrice: 4200,
    category: "Meditation Wear",
    sizes: [{ size: "S" }, { size: "M" }, { size: "L" }, { size: "XL" }, { size: "XXL" }],
    colors: [{ color: "Saffron" }],
    stock: 30,
    lowStockThreshold: 8,
    badge: "New Arrival",
    featured: true,
    visible: true,
    imageColor: "#f39c12",
    imageText: "Saffron Practice Wear",
  },
  {
    name: `${DEMO_PREFIX}Meditation Shawl`,
    slug: "demo-meditation-shawl",
    sku: "DEMO-SHAWL-001",
    description:
      "Soft meditation shawl for draping over shoulders during practice. Generous size for full coverage and comfort.",
    price: 4800,
    discountPrice: null,
    category: "Shawls & Wraps",
    sizes: [{ size: "One Size" }],
    colors: [{ color: "Cream" }, { color: "White" }, { color: "Grey" }],
    stock: 22,
    lowStockThreshold: 6,
    badge: null,
    featured: false,
    visible: true,
    imageColor: "#f5f5f0",
    imageText: "Meditation Shawl",
  },
  {
    name: `${DEMO_PREFIX}Buddhist Accessories Set`,
    slug: "demo-buddhist-accessories",
    sku: "DEMO-ACCESS-001",
    description:
      "Essential Buddhist accessories set including mala beads, incense holder, and practice cushion cover. Curated for daily practice.",
    price: 3200,
    discountPrice: 2500,
    category: "Accessories",
    sizes: [{ size: "One Size" }],
    colors: [{ color: "Wood" }, { color: "Sand" }],
    stock: 40,
    lowStockThreshold: 10,
    badge: "Set",
    featured: false,
    visible: true,
    imageColor: "#8d6e4a",
    imageText: "Accessories Set",
  },
];

async function main() {
  const configModule = await import("../payload.config.ts");
  const config = await configModule.default;

  const payload = await getPayload({ config });

  ensureUploadsDir();

  let created = 0;
  let skipped = 0;

  for (const product of DEMO_PRODUCTS) {
    // Idempotent: check if product with this SKU already exists
    const existing = await payload.find({
      collection: "products",
      where: { sku: { equals: product.sku } },
      limit: 1,
      pagination: false,
    });

    if (existing.docs.length > 0) {
      console.log(`⏭️  Skipping (already exists): ${product.sku}`);
      skipped++;
      continue;
    }

    // Create placeholder image file
    const imageFileName = `${product.sku}.png`;
    const imagePath = join(UPLOADS_DIR, imageFileName);
    createPlaceholderImage(imagePath, product.imageColor, product.imageText);

    // Create media record via Payload's Local API
    const media = await payload.create({
      collection: "media",
      data: {
        alt: `${product.name} - demonstration image`,
      },
      filePath: imagePath,
    });

    // Create product record
    await payload.create({
      collection: "products",
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        badge: product.badge,
        featured: product.featured,
        visible: product.visible,
        image: media.id,
      },
    });

    console.log(`✅ Created: ${product.sku} - ${product.name}`);
    created++;
  }

  console.log(`\n📊 Seed complete: ${created} created, ${skipped} skipped, ${DEMO_PRODUCTS.length} total`);
  console.log("\nAll seeded products are prefixed with '[DEMO]' and labeled as demonstration data.");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
