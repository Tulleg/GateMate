import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://gatemate:gatemate_secret@localhost:5432/gatemate_db",
  },
  verbose: true,
  strict: true,
});
