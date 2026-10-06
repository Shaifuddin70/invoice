import type { BusinessProfile } from "@/db/schema";
import type { FullInvoice } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { formatAmount, invoiceSummary, paymentTerms, slashDate, splitDescription } from "@/lib/invoice-layout";

export function InvoicePreview({
  invoice,
  profile,
  signatoryName,
}: {
  invoice: FullInvoice;
  profile: BusinessProfile;
  signatoryName: string;
}) {
  const money = (n: number) => formatMoney(n, invoice.currency);
  const c = invoice.client;
  const { paid, balanceDue } = invoiceSummary(invoice);
  const name = profile.businessName || signatoryName;

  const meta = [
    ["Invoice Date :", slashDate(invoice.issueDate)],
    ["Terms :", paymentTerms(invoice.issueDate, invoice.dueDate)],
    ["Due Date :", slashDate(invoice.dueDate)],
    invoice.status === "cancelled" && ["Status :", "Cancelled"],
  ].filter(Boolean) as [string, string][];

  const muted = "whitespace-pre-line leading-relaxed text-neutral-500";

  return (
    <div className="card overflow-x-auto bg-white">
      <div className="min-w-[640px] px-10 py-10 text-[13px] text-neutral-800 sm:px-12">
        <div className="flex justify-between gap-8">
          <div className="max-w-xs">
            {profile.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoDataUrl} alt="" className="mb-3 max-h-16 max-w-36 object-contain object-left" />
            ) : (
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-2xl font-bold text-white">
                {name.trim().charAt(0).toUpperCase()}
              </div>
            )}
            <p className="font-semibold text-neutral-900">{name}</p>
            {profile.tagline && <p className={muted}>{profile.tagline}</p>}
            {profile.address && <p className={muted}>{profile.address}</p>}
            {profile.phone && <p className={muted}>{profile.phone}</p>}
            {profile.email && <p className={muted}>{profile.email}</p>}
            {profile.website && <p className={muted}>{profile.website}</p>}
            {profile.taxId && <p className={muted}>Tax ID: {profile.taxId}</p>}
          </div>
          <div className="text-right">
            <p className="text-4xl font-light tracking-wide text-neutral-900">INVOICE</p>
            <p className="mt-1 text-xs font-semibold">Invoice# {invoice.number}</p>
            <p className="mt-6 text-xs">Balance Due</p>
            <p className="text-lg font-bold text-neutral-900">{money(balanceDue)}</p>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-8">
          <div className="max-w-xs">
            <p className="mb-1 text-neutral-500">Bill To</p>
            <p className="font-semibold text-neutral-900">{c.name}</p>
            {c.company && <p className={muted}>{c.company}</p>}
            {c.address && <p className={muted}>{c.address}</p>}
            {c.phone && <p className={muted}>{c.phone}</p>}
            {c.email && <p className={muted}>{c.email}</p>}
            {c.taxId && <p className={muted}>Tax ID: {c.taxId}</p>}
          </div>
          <dl className="grid grid-cols-[auto_7rem] gap-x-5 gap-y-2 text-right">
            {meta.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-neutral-500">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <table className="mt-8 w-full border-collapse">
          <thead>
            <tr className="bg-neutral-900 text-left text-xs text-white">
              <th className="w-10 py-2.5 pl-3 font-normal">#</th>
              <th className="py-2.5 font-normal">Item &amp; Description</th>
              <th className="w-20 py-2.5 text-right font-normal">Qty</th>
              <th className="w-28 py-2.5 text-right font-normal">Rate</th>
              <th className="w-32 py-2.5 pr-3 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const { title, detail } = splitDescription(item.description);
              return (
                <tr key={item.id} className="border-b border-neutral-200 align-top">
                  <td className="py-3 pl-3">{idx + 1}</td>
                  <td className="py-3 pr-4">
                    <p>{title}</p>
                    {detail && <p className="mt-0.5 whitespace-pre-line text-xs text-neutral-500">{detail}</p>}
                  </td>
                  <td className="py-3 text-right">{formatAmount(item.quantity)}</td>
                  <td className="py-3 text-right">{formatAmount(item.unitPrice)}</td>
                  <td className="py-3 pr-3 text-right">{formatAmount(item.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ml-auto mt-2 w-80">
          <Row label="Sub Total" value={formatAmount(invoice.subtotal)} />
          {invoice.discountAmount > 0 && (
            <Row
              label={`Discount${invoice.discountType === "percent" ? ` (${invoice.discountValue}%)` : ""}`}
              value={`(-) ${formatAmount(invoice.discountAmount)}`}
            />
          )}
          {invoice.taxRate > 0 && <Row label={`Tax (${invoice.taxRate}%)`} value={formatAmount(invoice.taxAmount)} />}
          <Row label="Total" value={money(invoice.total)} bold />
          {paid > 0 && <Row label="Payment Made" value={`(-) ${formatAmount(paid)}`} valueClass="text-red-600" />}
          <Row label="Balance Due" value={money(balanceDue)} bold className="bg-neutral-100" />
        </div>

        {(invoice.notes || profile.paymentDetails || profile.showSignature) && (
          <div className="mt-10 flex items-start gap-6">
            {invoice.notes && (
              <div className="w-56">
                <p className="mb-1">Notes</p>
                <p className={`text-xs ${muted}`}>{invoice.notes}</p>
              </div>
            )}
            {profile.paymentDetails && (
              <div className="w-56">
                <p className="mb-1">Payment Options</p>
                <p className={`text-xs ${muted}`}>{profile.paymentDetails}</p>
              </div>
            )}
            {profile.showSignature && (
              <div className="ml-auto w-48 text-right">
                {profile.signatureDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.signatureDataUrl} alt="Signature" className="ml-auto h-12 max-w-44 object-contain object-right" />
                ) : (
                  <div className="ml-auto h-12 w-44 border-b border-neutral-400" />
                )}
                <p className="mt-1.5 font-semibold">{signatoryName}</p>
                <p className="text-xs text-neutral-500">Authorized Signature</p>
              </div>
            )}
          </div>
        )}

        {invoice.terms && (
          <div className="mt-8">
            <p className="mb-1">Terms &amp; Conditions</p>
            <p className={`text-xs ${muted}`}>{invoice.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  className = "",
  valueClass = "",
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
  valueClass?: string;
}) {
  return (
    <div className={`flex px-3 py-2 ${bold ? "font-semibold text-neutral-900" : ""} ${className}`}>
      <span className="flex-1 pr-4 text-right">{label}</span>
      <span className={`w-36 text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
