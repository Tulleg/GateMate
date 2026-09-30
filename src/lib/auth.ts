import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "attendee",
        required: true,
      },
    },
  },
});

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("gatemate_user_id")?.value;
    if (!userId) return null;

    const userRecords = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    return userRecords[0] || null;
  } catch (e) {
    return null;
  }
}

