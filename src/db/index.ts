import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
