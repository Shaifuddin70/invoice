import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, requireUser } from "@/lib/dal";
import { getInvoice } from "@/lib/invoices";
import { displayStatus, formatDate } from "@/lib/status";
import { deleteInvoice, setInvoiceStatus } from "@/app/actions/invoices";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";
import { SubmitButton } from "@/components/submit-button";
import { InvoicePreview } from "@/components/invoice-preview";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;
  const user = await requireUser();
  const [invoice, profile] = await Promise.all([getInvoice(user.id, id), getProfile(user.id)]);
  if (!invoice) notFound();

  const status = displayStatus(invoice.status, invoice.dueDate);

  return (
    <>
      <div className="mb-4">
        <Link href="/invoices" className="text-sm text-slate-500 hover:text-slate-900">← All invoices</Link>
      </div>
      <PageHeader
        title={invoice.number}
        description={`${invoice.client.name} · Issued ${formatDate(invoice.issueDate)}`}
        actions={
          <>
            <a href={`/api/invoices/${invoice.id}/pdf`} className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download PDF
            </a>
            <Link href={`/invoices/${invoice.id}/edit`} className="btn-secondary">Edit</Link>
            <Link href={`/invoices/new?from=${invoice.id}`} className="btn-secondary">Duplicate</Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <InvoicePreview invoice={invoice} profile={profile} signatoryName={user.name} />

        <aside className="space-y-4">
          <div className="card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Status</span>
              <StatusBadge status={status} />
            </div>
            {invoice.paidAt && (
              <p className="text-xs text-slate-500">
                Paid on {invoice.paidAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
              </p>
            )}
            <div className="space-y-2">
              {invoice.status === "draft" && (
                <form action={setInvoiceStatus.bind(null, invoice.id, "sent")}>
                  <SubmitButton className="btn-secondary w-full" pendingText="Updating…">Mark as sent</SubmitButton>
                </form>
              )}
              {(invoice.status === "draft" || invoice.status === "sent") && (
                <form action={setInvoiceStatus.bind(null, invoice.id, "paid")}>
                  <SubmitButton className="btn w-full bg-emerald-600 text-white hover:bg-emerald-500" pendingText="Updating…">
                    Mark as paid
                  </SubmitButton>
                </form>
              )}
              {invoice.status === "paid" && (
                <form action={setInvoiceStatus.bind(null, invoice.id, "sent")}>
                  <SubmitButton className="btn-secondary w-full" pendingText="Updating…">Mark as unpaid</SubmitButton>
                </form>
              )}
              {invoice.status !== "cancelled" ? (
                <form action={setInvoiceStatus.bind(null, invoice.id, "cancelled")}>
                  <SubmitButton className="btn-ghost w-full" pendingText="Updating…">Cancel invoice</SubmitButton>
                </form>
              ) : (
                <form action={setInvoiceStatus.bind(null, invoice.id, "draft")}>
                  <SubmitButton className="btn-secondary w-full" pendingText="Updating…">Restore as draft</SubmitButton>
                </form>
              )}
            </div>
          </div>
          <div className="card flex items-center justify-between p-5">
            <span className="text-sm text-slate-500">Danger zone</span>
            <DeleteButton
              action={deleteInvoice.bind(null, invoice.id)}
              confirmText={`Delete invoice ${invoice.number}? This cannot be undone.`}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
