import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seedAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL || "admin@gatemate.io").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD || "SuperAdmin123!";
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("[ADMIN SEED ERROR] DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  console.log(`Connecting to database to seed Superadmin (${adminEmail})...`);
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    const existingUser = await db.select().from(users).where(eq(users.email, adminEmail));

    if (existingUser.length > 0) {
      await db
        .update(users)
        .set({
          role: "superadmin",
          passwordHash: hashPassword(adminPassword),
        })
        .where(eq(users.email, adminEmail));
      console.log(`[ADMIN SEED SUCCESS] Updated user ${adminEmail} to superadmin with configured password.`);
    } else {
      await db.insert(users).values({
        id: `user_superadmin_${Date.now()}`,
        email: adminEmail,
        name: "Platform SuperAdmin",
        passwordHash: hashPassword(adminPassword),
        role: "superadmin",
        emailVerified: true,
      });
      console.log(`[ADMIN SEED SUCCESS] Created Superadmin account: ${adminEmail}`);
    }
  } catch (error) {
    console.error("[ADMIN SEED ERROR] Failed to create superadmin:", error);
  } finally {
    await client.end();
  }
}

seedAdmin();
