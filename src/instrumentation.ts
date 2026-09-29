export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.DATABASE_URL) {
      try {
        console.log("[Instrumentation] Running automatic Drizzle migrations...");
        const { migrate } = await import("drizzle-orm/postgres-js/migrator");
        const { db } = await import("@/db");
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("[Instrumentation] Drizzle migrations completed successfully.");
      } catch (error) {
        console.error("[Instrumentation] Database migration failed on startup:", error);
      }
    }
  }
}
