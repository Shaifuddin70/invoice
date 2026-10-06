import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoiceItems, invoices, type BusinessProfile } from "@/db/schema";
import { isUuid } from "./form";

export function formatInvoiceNumber(prefix: string, n: number) {
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export function suggestedNumber(profile: BusinessProfile) {
  return formatInvoiceNumber(profile.invoicePrefix, profile.nextInvoiceNumber);
}

export async function getInvoice(userId: string, invoiceId: string) {
  if (!isUuid(invoiceId)) return null;
  const [row] = await db
    .select({ invoice: invoices, client: clients })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1);
  if (!row) return null;
  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceItems.position));
  return { ...row.invoice, client: row.client, items };
}

export type FullInvoice = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;
