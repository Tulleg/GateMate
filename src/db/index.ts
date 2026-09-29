import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/dummy_build_db";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.warn(
    "[Warning] DATABASE_URL is missing during build/evaluation. Using fallback for build phase."
  );
}

const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });

// Auto-run Drizzle migrations on container startup when DATABASE_URL is available
if (process.env.DATABASE_URL) {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  migrate(db, { migrationsFolder })
    .then(() => {
      console.log("[Database] Drizzle migrations applied successfully.");
    })
    .catch((err) => {
      console.error("[Database] Migration error during startup:", err);
    });
}
