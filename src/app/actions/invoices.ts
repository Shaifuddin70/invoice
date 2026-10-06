"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/db";
import { businessProfiles, clients, invoiceItems, invoices, type InvoiceStatus } from "@/db/schema";
import { getProfile, requireUser } from "@/lib/dal";
import { calcTotals, CURRENCY_CODES, round2 } from "@/lib/money";
import { getInvoice, suggestedNumber } from "@/lib/invoices";
import { isUuid, type FormState } from "@/lib/form";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Pick a date." });

const InvoiceSchema = z
  .object({
    clientId: z.string().refine(isUuid, { error: "Choose a client." }),
    number: z.string().trim().min(1, { error: "Invoice number is required." }).max(50),
    currency: z.enum(CURRENCY_CODES),
    issueDate: isoDate,
    dueDate: isoDate,
    taxRate: z.coerce.number().min(0).max(100),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().min(0),
    notes: z.string().max(2000),
    terms: z.string().max(2000),
    items: z
      .array(
        z.object({
          serviceId: z.string().nullable(),
          description: z.string().trim().min(1, { error: "Every line needs a description." }).max(1000),
          quantity: z.coerce.number().positive({ error: "Quantity must be greater than 0." }),
          unitPrice: z.coerce.number().min(0, { error: "Price can't be negative." }),
        }),
      )
      .min(1, { error: "Add at least one line item." }),
  })
  .refine((v) => v.dueDate >= v.issueDate, { path: ["dueDate"], error: "Due date can't be before the issue date." })
  .refine((v) => v.discountType !== "percent" || v.discountValue <= 100, {
    path: ["discountValue"],
    error: "Percentage discount can't exceed 100.",
  });

export type InvoicePayload = z.input<typeof InvoiceSchema>;

export async function saveInvoice(invoiceId: string | null, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { message: "Invalid form data." };
  }
  const parsed = InvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    const itemError = parsed.error.issues.find((i) => i.path[0] === "items")?.message;
    return {
      errors: { ...flat.fieldErrors, ...(itemError ? { items: [itemError] } : {}) },
      message: "Please fix the highlighted fields.",
    };
  }
  const data = parsed.data;

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.userId, user.id)))
    .limit(1);
  if (!client) return { errors: { clientId: ["Choose a client."] } };

  const totals = calcTotals(data.items, data);
  const lines = data.items.map((item, position) => ({
    serviceId: item.serviceId && isUuid(item.serviceId) ? item.serviceId : null,
    description: item.description,
    quantity: item.quantity,
    unitPrice: round2(item.unitPrice),
    amount: round2(item.quantity * item.unitPrice),
    position,
  }));
  const values = {
    clientId: data.clientId,
    number: data.number,
    currency: data.currency,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    taxRate: data.taxRate,
    discountType: data.discountType,
    discountValue: data.discountValue,
    notes: data.notes,
    terms: data.terms,
    ...totals,
  };

  const [duplicate] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.userId, user.id), eq(invoices.number, data.number)))
    .limit(1);
  if (duplicate && duplicate.id !== invoiceId) {
    return { errors: { number: ["This invoice number is already used."] } };
  }

  let savedId: string;
  if (invoiceId) {
    const existing = await getInvoice(user.id, invoiceId);
    if (!existing) return { message: "Invoice not found." };
    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)));
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
      await tx.insert(invoiceItems).values(lines.map((l) => ({ ...l, invoiceId })));
    });
    savedId = invoiceId;
  } else {
    const profile = await getProfile(user.id);
    savedId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(invoices)
        .values({ ...values, userId: user.id })
        .returning({ id: invoices.id });
      await tx.insert(invoiceItems).values(lines.map((l) => ({ ...l, invoiceId: created.id })));
      if (data.number === suggestedNumber(profile)) {
        await tx
          .update(businessProfiles)
          .set({ nextInvoiceNumber: sql`${businessProfiles.nextInvoiceNumber} + 1` })
          .where(eq(businessProfiles.userId, user.id));
      }
      return created.id;
    });
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${savedId}`);
}

export async function setInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const user = await requireUser();
  if (!isUuid(invoiceId)) return;
  await db
    .update(invoices)
    .set({ status, paidAt: status === "paid" ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)));
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
}

export async function deleteInvoice(invoiceId: string): Promise<FormState> {
  const user = await requireUser();
  if (!isUuid(invoiceId)) return { message: "Invoice not found." };
  await db.delete(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)));
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}
