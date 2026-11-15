import { sqliteAdapter } from "@payloadcms/db-sqlite";

export default sqliteAdapter({
  client: { url: process.env.DATABASE_URL || "file:./dev.db" },
  migrationDir: "./migrations",
});