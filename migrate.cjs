const { drizzle } = require("drizzle-orm/postgres-js");
const { migrate } = require("drizzle-orm/postgres-js/migrator");
const postgres = require("postgres");
const path = require("path");

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("[Migrator] No DATABASE_URL provided. Skipping migration step.");
    process.exit(0);
  }

  console.log("[Migrator] Running database migrations...");
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    await migrate(db, { migrationsFolder });
    console.log("[Migrator] All database migrations applied successfully!");
  } catch (error) {
    console.error("[Migrator] Failed to run database migrations:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
