#!/usr/bin/env node
/**
 * Initialize the SQLite database for Basnet Lugta Shop.
 * Creates all required tables directly via better-sqlite3,
 * bypassing the Payload CLI (incompatible with Node 24 / tsx).
 *
 * Usage:
 *   npx tsx scripts/init-db.ts
 */

import Database from "better-sqlite3";
import { readFileSync } from "fs";

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

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

const db = new Database(DB_PATH);
db.pragma("busy_timeout = 5000");

try {
  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  // ============================================================
  // Core Payload tables
  // ============================================================

  // media table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      filename TEXT NOT NULL,
      filesize INTEGER NOT NULL,
      filepath TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      focal_x REAL,
      focal_y REAL,
      alt TEXT,
      thumbnail_url TEXT,
      thumbnail_width INTEGER,
      thumbnail_height INTEGER,
      card_url TEXT,
      card_width INTEGER,
      card_height INTEGER,
      hero_url TEXT,
      hero_width INTEGER,
      hero_height INTEGER,
      updated_by INTEGER,
      created_by INTEGER
    );
  `).run();

  // products table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      name TEXT NOT NULL,
      slug TEXT,
      sku TEXT,
      price REAL NOT NULL DEFAULT 0,
      discount_price REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      category TEXT NOT NULL DEFAULT 'Accessories',
      sizes TEXT NOT NULL DEFAULT '[]',
      colors TEXT NOT NULL DEFAULT '[]',
      badge TEXT,
      description TEXT,
      image INTEGER,
      visible INTEGER NOT NULL DEFAULT 1,
      featured INTEGER NOT NULL DEFAULT 0,
      updated_by INTEGER,
      created_by INTEGER,
      FOREIGN KEY (image) REFERENCES media(id)
    );
  `).run();

  // customers table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      password_reset_token TEXT,
      password_reset_expires TEXT,
      updated_by INTEGER,
      created_by INTEGER
    );
  `).run();

  // admin_users table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      login_attempts INTEGER NOT NULL DEFAULT 0,
      updated_by INTEGER,
      created_by INTEGER
    );
  `).run();

  // orders table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      order_number TEXT NOT NULL,
      customer INTEGER NOT NULL,
      items TEXT NOT NULL DEFAULT '[]',
      subtotal REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'New',
      payment_status TEXT NOT NULL DEFAULT 'Unpaid',
      payment_method TEXT NOT NULL DEFAULT 'Cash on delivery',
      shipping_name TEXT NOT NULL DEFAULT '',
      shipping_phone TEXT NOT NULL DEFAULT '',
      shipping_district TEXT NOT NULL DEFAULT '',
      shipping_email TEXT NOT NULL DEFAULT '',
      shipping_address TEXT NOT NULL DEFAULT '',
      shipping_landmark TEXT NOT NULL DEFAULT '',
      shipping_note TEXT NOT NULL DEFAULT '',
      updated_by INTEGER,
      created_by INTEGER,
      FOREIGN KEY (customer) REFERENCES customers(id)
    );
  `).run();

  // orders_items table (join table for order items)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS orders_items (
      id TEXT PRIMARY KEY,
      _order INTEGER NOT NULL,
      _parent_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      image TEXT,
      FOREIGN KEY (_order) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `).run();

  // ============================================================
  // Inventory tables
  // ============================================================

  // stock_movements table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      adjustment_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reason TEXT NOT NULL,
      admin_id INTEGER,
      admin_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `).run();

  // stock_alerts table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS stock_alerts (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `).run();

  // ============================================================
  // Product reviews table
  // ============================================================

  db.prepare(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      product_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      verified_purchase INTEGER NOT NULL DEFAULT 0,
      helpful_count INTEGER NOT NULL DEFAULT 0,
      updated_by INTEGER,
      created_by INTEGER,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `).run();

  // Index for faster review lookups by product
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
  `).run();
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
  `).run();

  // ============================================================
  // Payload migrations tracking table
  // ============================================================

  db.prepare(`
    CREATE TABLE IF NOT EXISTS payload_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      batch INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `).run();

  // Insert a migration record for product_reviews
  const existingMigration = db
    .prepare(`SELECT id FROM payload_migrations WHERE name = ?`)
    .get("add_product_reviews_table");
  if (!existingMigration) {
    db.prepare(`INSERT INTO payload_migrations (name, batch, created_at) VALUES (?, 1, datetime('now'))`)
      .run("add_product_reviews_table");
  }

  console.log("Database initialized successfully!");
  console.log("Tables created: media, products, customers, admin_users, orders, orders_items, stock_movements, stock_alerts, product_reviews, payload_migrations");
} catch (error: any) {
  console.error("Failed to initialize database:", error?.message || error);
  process.exit(1);
} finally {
  db.close();
}
