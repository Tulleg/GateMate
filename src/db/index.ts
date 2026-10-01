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

declare global {
  // eslint-disable-next-line no-var
  var postgresClient: ReturnType<typeof postgres> | undefined;
}

const maxConnections = process.env.DB_MAX_CONNECTIONS
  ? parseInt(process.env.DB_MAX_CONNECTIONS, 10)
  : 10;

export const client =
  globalThis.postgresClient ||
  postgres(connectionString, {
    max: maxConnections,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: process.env.DB_PREPARE === "false" ? false : true,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.postgresClient = client;
}

export const db = drizzle(client, { schema });

