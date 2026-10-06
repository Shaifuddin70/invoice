"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { services } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import type { FormState } from "@/lib/form";

const ServiceSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }).max(200),
  description: z.string().trim().max(2000).default(""),
  unit: z.string().trim().min(1).max(30).default("item"),
  unitPrice: z.coerce.number({ error: "Enter a price." }).min(0, { error: "Price can't be negative." }),
  active: z.preprocess((v) => v === "on", z.boolean()),
});

export async function saveService(serviceId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ServiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  if (serviceId) {
    const updated = await db
      .update(services)
      .set(parsed.data)
      .where(and(eq(services.id, serviceId), eq(services.userId, user.id)))
      .returning({ id: services.id });
    if (!updated.length) return { message: "Service not found." };
  } else {
    await db.insert(services).values({ ...parsed.data, userId: user.id });
  }

  revalidatePath("/services");
  redirect("/services");
}

export async function deleteService(serviceId: string): Promise<FormState> {
  const user = await requireUser();
  await db.delete(services).where(and(eq(services.id, serviceId), eq(services.userId, user.id)));
  revalidatePath("/services");
  redirect("/services");
}
