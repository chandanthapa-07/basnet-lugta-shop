#!/usr/bin/env node --input-type=module
/**
 * Owner initialization script for Basnet Lugta Shop - Direct DB approach.
 * 
 * Usage:
 *   INIT_OWNER_EMAIL=owner@example.com INIT_OWNER_PASSWORD=securepassword INIT_OWNER_NAME="Owner Name" npx tsx scripts/init-owner.ts
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || "./dev.db";

const email = process.env.INIT_OWNER_EMAIL;
const password = process.env.INIT_OWNER_PASSWORD;
const name = process.env.INIT_OWNER_NAME || "Shop Owner";

if (!email || !password) {
  console.error("❌ Missing required environment variables:");
  console.error("   INIT_OWNER_EMAIL - Email for the owner account");
  console.error("   INIT_OWNER_PASSWORD - Password for the owner account (min 8 chars)");
  console.error("   INIT_OWNER_NAME (optional) - Display name for the owner");
  process.exit(1);
}

if (password.length < 8) {
  console.error("❌ Password must be at least 8 characters");
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("❌ Invalid email format");
  process.exit(1);
}

async function main() {
  try {
    const db = new Database(DB_PATH);

    const existingOwner = db.prepare(`SELECT * FROM admin_users WHERE role = 'owner' LIMIT 1`).get();
    if (existingOwner) {
      console.log("✅ Owner account already exists:", existingOwner.email);
      console.log("   Skipping initialization. To create additional admins, use the admin panel.");
      process.exit(0);
    }

    const existingEmail = db.prepare(`SELECT * FROM admin_users WHERE email = ? LIMIT 1`).get(email);
    if (existingEmail) {
      console.error("❌ An admin user with this email already exists");
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 12);
    const salt = randomBytes(16).toString("hex");

    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO admin_users (name, email, role, hash, salt, created_at, updated_at)
      VALUES (?, ?, 'owner', ?, ?, ?, ?)
    `).run(name, email, hash, salt, now, now);

    console.log("✅ Owner account created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: owner`);
    console.log("");
    console.log("You can now log in to the admin panel at /admin");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Failed to create owner account:", error?.message || error);
    process.exit(1);
  }
}

main();
