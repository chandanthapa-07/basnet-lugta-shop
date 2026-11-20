#!/usr/bin/env node
/**
 * Owner initialization script for Basnet Lugta Shop.
 * Creates the initial shop owner account directly in the SQLite database
 * using Payload-compatible password hashing (PBKDF2-SHA256).
 *
 * This avoids importing the Payload runtime in standalone scripts, which
 * is incompatible with tsx on Node.js 24 due to @next/env CJS interop.
 *
 * Usage:
 *   INIT_OWNER_EMAIL=owner@example.com INIT_OWNER_PASSWORD=securepassword INIT_OWNER_NAME="Shop Owner" npm run create-owner
 *
 * Or interactively:
 *   npm run create-owner
 *   (then follow prompts)
 *
 * Security notes:
 *   - Passwords are never logged to stdout/stderr.
 *   - The script is idempotent: if an owner already exists, it exits without changes.
 *   - Uses Payload CMS built-in administrator authentication (admin_users table).
 *   - Customer accounts use a separate JWT-based system (customers table).
 */

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { randomBytes, pbkdf2Sync } from "crypto";
import readline from "readline";

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";

const PASSWORD_HASH_ITERATIONS = 600_000;
const PASSWORD_HASH_KEY_LENGTH = 32;
const PASSWORD_HASH_PREFIX = "pbkdf2-sha256-v1:";

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
    // .env.local may not exist; rely on process.env already set.
  }
}

loadEnvFile(".env.local");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function generatePasswordHash(password: string): { hash: string; salt: string } {
  const saltBuffer = randomBytes(32);
  const salt = saltBuffer.toString("hex");
  const hashRaw = pbkdf2Sync(password, salt, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_KEY_LENGTH, "sha256");
  return {
    hash: `${PASSWORD_HASH_PREFIX}${hashRaw.toString("hex")}`,
    salt,
  };
}

async function main() {
  const email = process.env.INIT_OWNER_EMAIL || (await question("Owner email: "));
  const password = process.env.INIT_OWNER_PASSWORD || (await question("Owner password: "));
  const name = (process.env.INIT_OWNER_NAME || (await question("Owner name [Shop Owner]: ")) || "Shop Owner");

  rl.close();

  if (!email || !password) {
    console.error("\n Missing required information:");
    console.error("   INIT_OWNER_EMAIL - Email for the owner account");
    console.error("   INIT_OWNER_PASSWORD - Password for the owner account (min 8 chars)");
    console.error("   INIT_OWNER_NAME (optional) - Display name for the owner");
    process.exit(1);
  }

  if (typeof password !== "string" || password.length < 8) {
    console.error("\n Password must be at least 8 characters");
    process.exit(1);
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("\n Invalid email format");
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    // Idempotent: if an owner already exists, skip creation.
    const existingOwner = db
      .prepare(`SELECT id, email FROM admin_users WHERE role = 'owner' LIMIT 1`)
      .get() as { id?: number; email?: string } | undefined;

    if (existingOwner) {
      console.log("\n Owner account already exists:");
      console.log(`   Email: ${existingOwner.email}`);
      console.log("   Skipping initialization.");
      process.exit(0);
    }

    // Check if email already taken by any admin user.
    const existingEmail = db
      .prepare(`SELECT id FROM admin_users WHERE email = ? LIMIT 1`)
      .get(email) as { id?: number } | undefined;

    if (existingEmail) {
      console.error("\n An admin user with this email already exists");
      process.exit(1);
    }

    const { hash, salt } = generatePasswordHash(password);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO admin_users (name, email, role, hash, salt, created_at, updated_at, login_attempts)
      VALUES (?, ?, 'owner', ?, ?, ?, ?, 0)
    `).run(name, email, hash, salt, now, now);

    console.log("\n Owner account created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log("   Role: owner");
    console.log("");
    console.log("You can now log in to the admin panel at /admin");
    process.exit(0);
  } catch (error) {
    console.error("\n Failed to create owner account:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
