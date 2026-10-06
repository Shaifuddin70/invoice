"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "@/app/actions/settings";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CURRENCIES } from "@/lib/money";
import type { BusinessProfile } from "@/db/schema";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 border-b border-slate-100 p-6 last:border-0 md:grid-cols-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-5 md:col-span-2">{children}</div>
    </div>
  );
}

function ImageField({
  name,
  label,
  current,
  hint,
  boxClass,
  errors,
}: {
  name: string;
  label: string;
  current: string | null;
  hint: string;
  boxClass: string;
  errors?: string[];
}) {
  const [preview, setPreview] = useState<string | null>(current);
  return (
    <div className="flex items-center gap-4">
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${boxClass}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">{label}</span>
        )}
      </div>
      <div className="flex-1">
        <input
          type="file"
          name={name}
          accept="image/png,image/jpeg"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
        {current && (
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" name={`remove_${name}`} className="h-3.5 w-3.5 rounded border-slate-300" /> Remove current{" "}
            {label.toLowerCase()}
          </label>
        )}
        <FieldError errors={errors} />
      </div>
    </div>
  );
}

export function SettingsForm({ profile }: { profile: BusinessProfile }) {
  const [state, action] = useActionState(saveProfile, undefined);
  const e = state?.errors;

  return (
    <form action={action} className="card">
      <Section title="Business" description="Your company identity shown in the invoice header.">
        <ImageField
          name="logo"
          label="Logo"
          current={profile.logoDataUrl}
          hint="PNG or JPEG, up to 500 KB."
          boxClass="h-16 w-16"
          errors={e?.logo}
        />
        <div>
          <label className="label" htmlFor="businessName">Business name *</label>
          <input className="input" id="businessName" name="businessName" defaultValue={profile.businessName} required />
          <FieldError errors={e?.businessName} />
        </div>
        <div>
          <label className="label" htmlFor="tagline">Tagline</label>
          <input className="input" id="tagline" name="tagline" defaultValue={profile.tagline} placeholder="e.g. Creative Agency" />
          <p className="mt-1 text-xs text-slate-500">Shown under your business name on invoices.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" defaultValue={profile.email} />
            <FieldError errors={e?.email} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input className="input" id="phone" name="phone" defaultValue={profile.phone} />
          </div>
          <div>
            <label className="label" htmlFor="website">Website</label>
            <input className="input" id="website" name="website" defaultValue={profile.website} />
          </div>
          <div>
            <label className="label" htmlFor="taxId">Tax / VAT / BIN number</label>
            <input className="input" id="taxId" name="taxId" defaultValue={profile.taxId} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="address">Address</label>
          <textarea className="input" id="address" name="address" rows={3} defaultValue={profile.address} />
        </div>
      </Section>

      <Section
        title="Signature"
        description="Printed above “Authorized Signature” on invoices. Leave the image empty to sign printed invoices by hand."
      >
        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="showSignature"
            defaultChecked={profile.showSignature}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Show the Authorized Signature section on invoices
        </label>
        <ImageField
          name="signature"
          label="Signature"
          current={profile.signatureDataUrl}
          hint="PNG with a transparent or white background works best. Up to 500 KB."
          boxClass="h-16 w-40"
          errors={e?.signature}
        />
      </Section>

      <Section title="Payment details" description="Bank account, mobile banking, or payment link printed on invoices.">
        <textarea
          className="input font-mono text-xs"
          name="paymentDetails"
          rows={5}
          defaultValue={profile.paymentDetails}
          placeholder={"Bank: ...\nAccount name: ...\nAccount no: ...\nbKash: ..."}
        />
      </Section>

      <Section title="Invoice defaults" description="Pre-filled on every new invoice. You can change them per invoice.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="defaultCurrency">Default currency</label>
            <select className="input" id="defaultCurrency" name="defaultCurrency" defaultValue={profile.defaultCurrency}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="defaultTaxRate">Default tax / VAT rate (%)</label>
            <input className="input" id="defaultTaxRate" name="defaultTaxRate" type="number" step="0.001" min="0" max="100" defaultValue={profile.defaultTaxRate} />
            <FieldError errors={e?.defaultTaxRate} />
          </div>
          <div>
            <label className="label" htmlFor="defaultDueDays">Payment due (days after issue)</label>
            <input className="input" id="defaultDueDays" name="defaultDueDays" type="number" min="0" max="365" defaultValue={profile.defaultDueDays} />
            <FieldError errors={e?.defaultDueDays} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="invoicePrefix">Number prefix</label>
              <input className="input" id="invoicePrefix" name="invoicePrefix" defaultValue={profile.invoicePrefix} />
            </div>
            <div>
              <label className="label" htmlFor="nextInvoiceNumber">Next number</label>
              <input className="input" id="nextInvoiceNumber" name="nextInvoiceNumber" type="number" min="1" defaultValue={profile.nextInvoiceNumber} />
              <FieldError errors={e?.nextInvoiceNumber} />
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="defaultNotes">Default notes</label>
          <textarea className="input" id="defaultNotes" name="defaultNotes" rows={2} defaultValue={profile.defaultNotes} placeholder="Thank you for your business!" />
        </div>
        <div>
          <label className="label" htmlFor="defaultTerms">Default terms</label>
          <textarea className="input" id="defaultTerms" name="defaultTerms" rows={2} defaultValue={profile.defaultTerms} placeholder="Payment due within 14 days." />
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3 rounded-b-xl bg-slate-50 px-6 py-4">
        {state?.message && (
          <span className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>{state.message}</span>
        )}
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </form>
  );
}
