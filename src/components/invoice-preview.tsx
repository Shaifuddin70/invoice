import type { BusinessProfile } from "@/db/schema";
import type { FullInvoice } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";

const BLUE = "#3a6fc4";
const LIGHT_BLUE = "#c5dff3";
const ACCENT = "#4aa3df";

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Divider({ accentRight = false }: { accentRight?: boolean }) {
  return (
    <div className="relative flex h-[3px] flex-1 items-center">
      <div className="h-px w-full bg-neutral-400" />
      <div className="absolute left-0 top-0 h-[3px] w-12" style={{ background: ACCENT }} />
      {accentRight && <div className="absolute right-0 top-0 h-[3px] w-12" style={{ background: ACCENT }} />}
    </div>
  );
}

const ICONS = {
  phone:
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
};

export function InvoicePreview({
  invoice,
  profile,
  signatoryName,
}: {
  invoice: FullInvoice;
  profile: BusinessProfile;
  signatoryName: string;
}) {
  const fmt = (n: number) => formatMoney(n, invoice.currency);
  const c = invoice.client;
  const oneLine = (v: string) => v.replace(/\s*\n\s*/g, ", ");
  const contacts = [
    profile.phone && { icon: ICONS.phone, text: profile.phone },
    profile.email && { icon: ICONS.mail, text: profile.email },
    profile.address && { icon: ICONS.pin, text: oneLine(profile.address) },
  ].filter(Boolean) as { icon: string; text: string }[];

  return (
    <div className="card overflow-x-auto bg-white">
      <div className="min-w-[640px] px-10 py-10 text-[13px] text-neutral-900 sm:px-14">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {profile.logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoDataUrl} alt="" className="h-14 w-14 object-contain" />
            )}
            <div>
              <p className="text-xl font-bold uppercase tracking-wide">{profile.businessName}</p>
              {profile.tagline && <p className="text-xs uppercase tracking-wide">{profile.tagline}</p>}
            </div>
          </div>
          <p className="text-4xl font-bold tracking-[0.12em]" style={{ color: BLUE }}>INVOICE</p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Divider />
          {profile.website && <span className="text-xs uppercase tracking-wide">{profile.website}</span>}
        </div>

        <div className="mt-10 flex justify-between gap-6">
          <div>
            <p className="font-bold">Invoice to :</p>
            <p className="mt-1 mb-3 text-lg font-bold">{c.name}</p>
            <div className="space-y-1.5 text-xs text-neutral-600">
              {c.company && <p>{c.company}</p>}
              {c.phone && <p>{c.phone}</p>}
              {c.email && <p>{c.email}</p>}
              {c.address && <p>{oneLine(c.address)}</p>}
              {c.taxId && <p>Tax ID: {c.taxId}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">Invoice no : {invoice.number}</p>
            <p className="mt-1.5">{longDate(invoice.issueDate)}</p>
            <p className="mt-1 text-xs text-neutral-600">Due : {longDate(invoice.dueDate)}</p>
            {profile.taxId && <p className="mt-0.5 text-xs text-neutral-600">Tax ID : {profile.taxId}</p>}
          </div>
        </div>

        <table className="mt-8 w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="text-white uppercase" style={{ background: BLUE }}>
              <th className="w-10 py-1.5 font-bold">No</th>
              <th className="py-1.5 font-bold">Description</th>
              <th className="w-20 py-1.5 font-bold">Qty</th>
              <th className="w-28 py-1.5 font-bold">Price</th>
              <th className="w-28 py-1.5 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const shaded = idx % 2 === 1;
              const cell = {
                background: shaded ? LIGHT_BLUE : "#fff",
                boxShadow: `inset -2px 0 0 ${shaded ? "#fff" : LIGHT_BLUE}`,
              };
              return (
                <tr key={item.id}>
                  <td className="px-2 py-1.5 text-center" style={cell}>{idx + 1}</td>
                  <td className="whitespace-pre-line px-2 py-1.5" style={cell}>{item.description}</td>
                  <td className="px-2 py-1.5 text-center" style={cell}>{item.quantity}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={cell}>{fmt(item.unitPrice)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={{ ...cell, boxShadow: "none" }}>{fmt(item.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-3 ml-auto w-72 space-y-2">
          <div className="flex justify-end gap-6">
            <span>Sub Total :</span>
            <span className="w-28 text-right tabular-nums">{fmt(invoice.subtotal)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-end gap-6">
              <span>Discount{invoice.discountType === "percent" ? ` ${invoice.discountValue}%` : ""} :</span>
              <span className="w-28 text-right tabular-nums">−{fmt(invoice.discountAmount)}</span>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className="flex justify-end gap-6">
              <span>Tax {invoice.taxRate}% :</span>
              <span className="w-28 text-right tabular-nums">{fmt(invoice.taxAmount)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-6">
          {profile.paymentDetails ? (
            <div className="w-48 px-2 py-1 text-sm font-bold text-white uppercase" style={{ background: BLUE }}>
              Payment method :
            </div>
          ) : (
            <div />
          )}
          <div className="flex w-80 justify-between px-3 py-1 text-sm font-bold text-white uppercase" style={{ background: BLUE }}>
            <span>Grand total :</span>
            <span className="tabular-nums">{fmt(invoice.total)}</span>
          </div>
        </div>
        {profile.paymentDetails && <p className="mt-3 whitespace-pre-line leading-relaxed">{profile.paymentDetails}</p>}

        {invoice.notes && (
          <>
            <div className="mt-6 h-px w-64 bg-neutral-400" />
            <p className="mt-4 font-bold">{invoice.notes}</p>
          </>
        )}

        <div className="mt-8 flex items-end justify-between gap-6">
          <div className="max-w-xs">
            {invoice.terms && (
              <>
                <p className="mb-1.5 font-bold">Term and Conditions :</p>
                <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-600">{invoice.terms}</p>
              </>
            )}
          </div>
          <div className="text-right">
            {profile.signatureDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.signatureDataUrl} alt="Signature" className="ml-auto h-14 max-w-48 object-contain object-right" />
            ) : (
              <div className="ml-auto h-14 w-48 border-b" style={{ borderColor: "#b5b5b5" }} />
            )}
            <p className="mt-1.5 font-bold">{signatoryName}</p>
            <p className="text-sm font-bold">Authorized Signatory</p>
          </div>
        </div>

        <div className="mt-10">
          <Divider accentRight />
          {contacts.length > 0 && (
            <div className="mt-4 flex justify-between gap-4 text-xs text-neutral-600">
              {contacts.map((ct) => (
                <div key={ct.icon} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.6" className="shrink-0">
                    <path d={ct.icon} />
                  </svg>
                  <span className={ct.icon === ICONS.pin ? undefined : "whitespace-nowrap"}>{ct.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
