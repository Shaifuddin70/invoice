"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import type { FormState } from "@/lib/form";

const ClientSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(200),
  company: z.string().trim().max(200).default(""),
  email: z.union([z.literal(""), z.email({ error: "Enter a valid email." })]).default(""),
  phone: z.string().trim().max(50).default(""),
  address: z.string().trim().max(1000).default(""),
  taxId: z.string().trim().max(100).default(""),
});

export async function saveClient(clientId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (clientId) {
    const updated = await db
      .update(clients)
      .set(parsed.data)
      .where(and(eq(clients.id, clientId), eq(clients.userId, user.id)))
      .returning({ id: clients.id });
    if (!updated.length) return { message: "Client not found." };
  } else {
    await db.insert(clients).values({ ...parsed.data, userId: user.id });
  }

  revalidatePath("/clients");
  const returnTo = formData.get("returnTo");
  redirect(typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/clients");
}

export async function deleteClient(clientId: string): Promise<FormState> {
  const user = await requireUser();
  const [used] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.clientId, clientId), eq(invoices.userId, user.id)))
    .limit(1);
  if (used) return { message: "This client has invoices and can't be deleted." };

  await db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.userId, user.id)));
  revalidatePath("/clients");
  redirect("/clients");
}
