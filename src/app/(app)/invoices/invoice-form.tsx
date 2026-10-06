"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveInvoice, type InvoicePayload } from "@/app/actions/invoices";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { calcTotals, CURRENCIES, formatMoney } from "@/lib/money";

type Line = { key: number; serviceId: string | null; description: string; quantity: string; unitPrice: string };

export type InvoiceFormInitial = Omit<InvoicePayload, "items" | "taxRate" | "discountValue"> & {
  taxRate: number;
  discountValue: number;
  items: { serviceId: string | null; description: string; quantity: number; unitPrice: number }[];
};

type Props = {
  invoiceId: string | null;
  initial: InvoiceFormInitial;
  clients: { id: string; name: string; company: string }[];
  services: { id: string; name: string; description: string; unitPrice: number; unit: string }[];
};

let nextKey = 1;
const toLine = (i: InvoiceFormInitial["items"][number]): Line => ({
  key: nextKey++,
  serviceId: i.serviceId,
  description: i.description,
  quantity: String(i.quantity),
  unitPrice: String(i.unitPrice),
});
const emptyLine = (): Line => ({ key: nextKey++, serviceId: null, description: "", quantity: "1", unitPrice: "0" });

export function InvoiceForm({ invoiceId, initial, clients, services }: Props) {
  const [state, action] = useActionState(saveInvoice.bind(null, invoiceId), undefined);
  const [form, setForm] = useState({
    clientId: initial.clientId,
    number: initial.number,
    currency: initial.currency,
    issueDate: initial.issueDate,
    dueDate: initial.dueDate,
    taxRate: String(initial.taxRate),
    discountType: initial.discountType,
    discountValue: String(initial.discountValue),
    notes: initial.notes,
    terms: initial.terms,
  });
  const [lines, setLines] = useState<Line[]>(initial.items.length ? initial.items.map(toLine) : [emptyLine()]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const parsedItems = lines.map((l) => ({
    serviceId: l.serviceId,
    description: l.description,
    quantity: Number(l.quantity) || 0,
    unitPrice: Number(l.unitPrice) || 0,
  }));
  const totals = calcTotals(parsedItems, {
    taxRate: Number(form.taxRate) || 0,
    discountType: form.discountType,
    discountValue: Number(form.discountValue) || 0,
  });
  const payload: InvoicePayload = { ...form, items: parsedItems };
  const fmt = (n: number) => formatMoney(n, form.currency);
  const e = state?.errors;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {state?.message && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</div>}

      <div className="card grid gap-5 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="clientId">Bill to *</label>
            <Link href={`/clients/new?returnTo=${invoiceId ? `/invoices/${invoiceId}/edit` : "/invoices/new"}`} className="mb-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500">
              + New client
            </Link>
          </div>
          <select className="input" id="clientId" value={form.clientId} onChange={(ev) => set("clientId", ev.target.value)}>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
          <FieldError errors={e?.clientId} />
        </div>
        <div>
          <label className="label" htmlFor="number">Invoice number *</label>
          <input className="input" id="number" value={form.number} onChange={(ev) => set("number", ev.target.value)} />
          <FieldError errors={e?.number} />
        </div>
        <div>
          <label className="label" htmlFor="issueDate">Issue date</label>
          <input className="input" id="issueDate" type="date" value={form.issueDate} onChange={(ev) => set("issueDate", ev.target.value)} />
          <FieldError errors={e?.issueDate} />
        </div>
        <div>
          <label className="label" htmlFor="dueDate">Due date</label>
          <input className="input" id="dueDate" type="date" value={form.dueDate} onChange={(ev) => set("dueDate", ev.target.value)} />
          <FieldError errors={e?.dueDate} />
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <select className="input" id="currency" value={form.currency} onChange={(ev) => set("currency", ev.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Line items</h2>
          <FieldError errors={e?.items} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="table-th w-[45%]">Description</th>
                <th className="table-th w-24 text-right">Qty</th>
                <th className="table-th w-36 text-right">Price</th>
                <th className="table-th w-36 text-right">Amount</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((l) => (
                <tr key={l.key} className="align-top">
                  <td className="px-4 py-3">
                    {services.length > 0 && (
                      <select
                        className="input mb-2 py-1.5 text-xs text-slate-600"
                        value={l.serviceId ?? ""}
                        onChange={(ev) => {
                          const s = services.find((x) => x.id === ev.target.value);
                          updateLine(
                            l.key,
                            s
                              ? { serviceId: s.id, description: s.description ? `${s.name} — ${s.description}` : s.name, unitPrice: String(s.unitPrice) }
                              : { serviceId: null },
                          );
                        }}
                      >
                        <option value="">Custom item (or pick a service)</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} · {s.unitPrice.toFixed(2)}/{s.unit}
                          </option>
                        ))}
                      </select>
                    )}
                    <textarea
                      className="input"
                      rows={1}
                      placeholder="Description"
                      value={l.description}
                      onChange={(ev) => updateLine(l.key, { description: ev.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input className="input text-right" type="number" step="any" min="0" value={l.quantity} onChange={(ev) => updateLine(l.key, { quantity: ev.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <input className="input text-right" type="number" step="0.01" min="0" value={l.unitPrice} onChange={(ev) => updateLine(l.key, { unitPrice: ev.target.value })} />
                  </td>
                  <td className="px-4 py-3 pt-5 text-right text-sm font-medium tabular-nums text-slate-900">
                    {fmt((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}
                  </td>
                  <td className="py-3 pr-3 pt-4">
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-slate-400 hover:text-red-600"
                      onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))}
                      aria-label="Remove line"
                      disabled={lines.length === 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-6 py-3">
          <button type="button" className="btn-ghost -ml-3 text-indigo-600" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
            + Add line
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card space-y-5 p-6 lg:col-span-3">
          <div>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea className="input" id="notes" rows={3} value={form.notes} onChange={(ev) => set("notes", ev.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="terms">Terms</label>
            <textarea className="input" id="terms" rows={3} value={form.terms} onChange={(ev) => set("terms", ev.target.value)} />
          </div>
        </div>

        <div className="card space-y-4 p-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="discountValue">Discount</label>
              <div className="flex">
                <input className="input rounded-r-none" id="discountValue" type="number" step="0.01" min="0" value={form.discountValue} onChange={(ev) => set("discountValue", ev.target.value)} />
                <select
                  className="input w-20 rounded-l-none border-l-0 px-2"
                  value={form.discountType}
                  onChange={(ev) => set("discountType", ev.target.value as "percent" | "fixed")}
                  aria-label="Discount type"
                >
                  <option value="percent">%</option>
                  <option value="fixed">{form.currency}</option>
                </select>
              </div>
              <FieldError errors={e?.discountValue} />
            </div>
            <div>
              <label className="label" htmlFor="taxRate">Tax / VAT (%)</label>
              <input className="input" id="taxRate" type="number" step="0.001" min="0" max="100" value={form.taxRate} onChange={(ev) => set("taxRate", ev.target.value)} />
              <FieldError errors={e?.taxRate} />
            </div>
          </div>
          <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{fmt(totals.subtotal)}</dd>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{fmt(totals.discountAmount)}</dd>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <dt>Tax ({Number(form.taxRate) || 0}%)</dt>
                <dd className="tabular-nums">{fmt(totals.taxAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
              <dt>Total</dt>
              <dd className="tabular-nums">{fmt(totals.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Link href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"} className="btn-secondary">Cancel</Link>
        <SubmitButton>{invoiceId ? "Save invoice" : "Create invoice"}</SubmitButton>
      </div>
    </form>
  );
}
