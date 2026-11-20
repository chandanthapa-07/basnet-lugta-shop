#!/usr/bin/env node
/**
 * Inspect seeded products in Basnet Lugta Shop.
 *
 * Usage:
 *   npm run inspect-products
 */

import { getPayload } from "payload";

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

async function main() {
  const configModule = await import("../payload.config.ts");
  const config = await configModule.default;

  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: { name: { contains: "[DEMO]" } },
    sort: "-createdAt",
    limit: 100,
    pagination: false,
  });

  console.log(`\n📦 Found ${products.docs.length} demonstration product(s):\n`);

  for (const p of products.docs) {
    console.log(`  • ${p.name}`);
    console.log(`    SKU: ${p.sku} | Slug: ${p.slug}`);
    console.log(`    Category: ${p.category} | Price: रु ${p.price} ${p.discountPrice ? `(discount: रु ${p.discountPrice})` : ""}`);
    console.log(`    Stock: ${p.stock} (low threshold: ${p.lowStockThreshold}) | Published: ${p.visible} | Featured: ${p.featured}`);
    console.log(`    Sizes: ${(p.sizes || []).map((s: any) => s.size).join(", ")}`);
    console.log(`    Colors: ${(p.colors || []).map((c: any) => c.color).join(", ")}`);
    console.log("");
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Inspect failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
