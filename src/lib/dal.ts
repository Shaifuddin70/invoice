import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, users } from "@/db/schema";
import { SESSION_COOKIE, decrypt } from "./session";

/** Verifies the session against the database. Every data access must go through this. */
export const requireUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);
  if (!session) redirect("/login");

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) redirect("/login");
  return user;
});

export const getProfile = cache(async (userId: string) => {
  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);
  if (profile) return profile;
  const [created] = await db
    .insert(businessProfiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  return created ?? (await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)))[0];
});
