import type { FullInvoice } from "@/lib/invoices";

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function slashDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function paymentTerms(issueDate: string, dueDate: string) {
  const days = Math.round((Date.parse(dueDate) - Date.parse(issueDate)) / 86_400_000);
  return days <= 0 ? "Due On Receipt" : `Net ${days}`;
}

/** First line (or the part before " — " added when picking a service) is the item title. */
export function splitDescription(raw: string) {
  const text = raw.replace(/\r/g, "");
  const nl = text.indexOf("\n");
  if (nl !== -1) return { title: text.slice(0, nl).trim(), detail: text.slice(nl + 1).trim() };
  const dash = text.indexOf(" — ");
  if (dash !== -1) return { title: text.slice(0, dash).trim(), detail: text.slice(dash + 3).trim() };
  return { title: text, detail: "" };
}

export function invoiceSummary(invoice: FullInvoice) {
  const paid = invoice.status === "paid" ? invoice.total : 0;
  return { paid, balanceDue: invoice.status === "cancelled" ? 0 : invoice.total - paid };
}
