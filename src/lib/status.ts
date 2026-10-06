import type { InvoiceStatus } from "@/db/schema";

export type DisplayStatus = InvoiceStatus | "overdue";

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function displayStatus(status: InvoiceStatus, dueDate: string): DisplayStatus {
  return status === "sent" && dueDate < today() ? "overdue" : status;
}

export function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
