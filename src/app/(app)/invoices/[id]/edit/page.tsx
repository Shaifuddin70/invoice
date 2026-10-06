import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getInvoice } from "@/lib/invoices";
import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "../../invoice-form";
import { getFormOptions } from "../../form-options";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage(props: PageProps<"/invoices/[id]/edit">) {
  const { id } = await props.params;
  const user = await requireUser();
  const [invoice, options] = await Promise.all([getInvoice(user.id, id), getFormOptions(user.id)]);
  if (!invoice) notFound();

  return (
    <>
      <PageHeader title={`Edit ${invoice.number}`} />
      <InvoiceForm
        invoiceId={invoice.id}
        initial={{
          clientId: invoice.clientId,
          number: invoice.number,
          currency: invoice.currency,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          taxRate: invoice.taxRate,
          discountType: invoice.discountType,
          discountValue: invoice.discountValue,
          notes: invoice.notes,
          terms: invoice.terms,
          items: invoice.items.map((i) => ({
            serviceId: i.serviceId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }}
        {...options}
      />
    </>
  );
}
