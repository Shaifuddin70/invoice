import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, requireUser } from "@/lib/dal";
import { getInvoice, suggestedNumber } from "@/lib/invoices";
import { addDays, today } from "@/lib/status";
import { EmptyState, PageHeader } from "@/components/ui";
import { InvoiceForm, type InvoiceFormInitial } from "../invoice-form";
import { getFormOptions } from "../form-options";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage(props: PageProps<"/invoices/new">) {
  const { from, clientId } = await props.searchParams;
  const user = await requireUser();
  const [profile, options] = await Promise.all([getProfile(user.id), getFormOptions(user.id)]);

  if (options.clients.length === 0) {
    return (
      <>
        <PageHeader title="New invoice" />
        <EmptyState
          title="Add a client first"
          description="Invoices are addressed to a client. Create one and you'll come right back here."
          action={<Link href="/clients/new?returnTo=/invoices/new" className="btn-primary">Add client</Link>}
        />
      </>
    );
  }

  const issueDate = today();
  const source = typeof from === "string" ? await getInvoice(user.id, from) : null;
  const preselected = typeof clientId === "string" && options.clients.some((c) => c.id === clientId) ? clientId : "";

  const initial: InvoiceFormInitial = source
    ? {
        clientId: source.clientId,
        number: suggestedNumber(profile),
        currency: source.currency,
        issueDate,
        dueDate: addDays(issueDate, profile.defaultDueDays),
        taxRate: source.taxRate,
        discountType: source.discountType,
        discountValue: source.discountValue,
        notes: source.notes,
        terms: source.terms,
        items: source.items.map((i) => ({
          serviceId: i.serviceId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      }
    : {
        clientId: preselected,
        number: suggestedNumber(profile),
        currency: profile.defaultCurrency,
        issueDate,
        dueDate: addDays(issueDate, profile.defaultDueDays),
        taxRate: profile.defaultTaxRate,
        discountType: "percent",
        discountValue: 0,
        notes: profile.defaultNotes,
        terms: profile.defaultTerms,
        items: [],
      };

  return (
    <>
      <PageHeader title={source ? `Duplicate ${source.number}` : "New invoice"} />
      <InvoiceForm invoiceId={null} initial={initial} {...options} />
    </>
  );
}
