#!/usr/bin/env node
/**
 * Fix the existing owner account password using Payload-compatible hashing.
 *
 * This avoids importing the Payload runtime in standalone scripts, which
 * is incompatible with tsx on Node.js 24 due to @next/env CJS interop.
 *
 * Usage:
 *   INIT_OWNER_EMAIL=owner@basnetlugta.com INIT_OWNER_PASSWORD=securepassword npx tsx scripts/fix-owner.ts
 *
 * Security notes:
 *   - Passwords are never logged to stdout/stderr.
 *   - Only updates the password; does not create accounts.
 */

import Database from "better-sqlite3";
import { randomBytes, pbkdf2Sync } from "crypto";
import { readFileSync } from "fs";

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

async function main() {
  const email = process.env.INIT_OWNER_EMAIL || "owner@basnetlugta.com";
  const password = process.env.INIT_OWNER_PASSWORD;

  if (!password) {
    console.error("❌ Missing INIT_OWNER_PASSWORD environment variable");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters");
    process.exit(1);
  }

  const db = new Database(DB_PATH);

  try {
    const existing = db
      .prepare(`SELECT id, email FROM admin_users WHERE email = ? LIMIT 1`)
      .get(email) as { id?: number; email?: string } | undefined;

    if (!existing) {
      console.error(`❌ No admin user found with email: ${email}`);
      console.log("   Create one first with: npm run create-owner");
      process.exit(1);
    }

    const saltBuffer = randomBytes(32);
    const salt = saltBuffer.toString("hex");
    const hashRaw = pbkdf2Sync(password, salt, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_KEY_LENGTH, "sha256");
    const hash = `${PASSWORD_HASH_PREFIX}${hashRaw.toString("hex")}`;
    const now = new Date().toISOString();

    db.prepare(`UPDATE admin_users SET hash = ?, salt = ?, updated_at = ? WHERE id = ?`).run(
      hash,
      salt,
      now,
      existing.id,
    );

    console.log("\n✅ Owner password updated successfully!");
    console.log(`   Email: ${existing.email}`);
    console.log("   You can now log in to the admin panel at /admin");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Failed to update password:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
