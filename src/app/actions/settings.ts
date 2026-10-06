"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";
import { getProfile, requireUser } from "@/lib/dal";
import { CURRENCY_CODES } from "@/lib/money";
import type { FormState } from "@/lib/form";

const MAX_IMAGE_BYTES = 500 * 1024;

const ProfileSchema = z.object({
  businessName: z.string().trim().min(1, { error: "Business name is required." }).max(200),
  tagline: z.string().trim().max(100),
  email: z.union([z.literal(""), z.email({ error: "Enter a valid email." })]),
  phone: z.string().trim().max(50),
  website: z.string().trim().max(200),
  address: z.string().trim().max(1000),
  taxId: z.string().trim().max(100),
  paymentDetails: z.string().trim().max(2000),
  defaultCurrency: z.enum(CURRENCY_CODES),
  defaultTaxRate: z.coerce.number().min(0).max(100),
  defaultDueDays: z.coerce.number().int().min(0).max(365),
  defaultNotes: z.string().trim().max(2000),
  defaultTerms: z.string().trim().max(2000),
  invoicePrefix: z.string().trim().max(20),
  nextInvoiceNumber: z.coerce.number().int().min(1),
});

export async function saveProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  await getProfile(user.id);

  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const update: Partial<typeof businessProfiles.$inferInsert> = {
    ...parsed.data,
    showSignature: formData.get("showSignature") === "on",
  };

  const images = [
    { field: "logo", label: "Logo", key: "logoDataUrl" },
    { field: "signature", label: "Signature", key: "signatureDataUrl" },
  ] as const;

  for (const { field, label, key } of images) {
    const file = formData.get(field);
    if (formData.get(`remove_${field}`) === "on") {
      update[key] = null;
    } else if (file instanceof File && file.size > 0) {
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        return { errors: { [field]: [`${label} must be a PNG or JPEG image.`] } };
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return { errors: { [field]: [`${label} must be smaller than 500 KB.`] } };
      }
      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      update[key] = `data:${file.type};base64,${base64}`;
    }
  }

  await db.update(businessProfiles).set(update).where(eq(businessProfiles.userId, user.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
