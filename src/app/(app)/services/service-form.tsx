"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveService } from "@/app/actions/services";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { Service } from "@/db/schema";

const UNITS = ["item", "hour", "day", "month", "project", "unit"];

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action] = useActionState(saveService.bind(null, service?.id ?? null), undefined);

  return (
    <form action={action} className="card space-y-5 p-6">
      {state?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</div>}
      <div>
        <label className="label" htmlFor="name">Service name *</label>
        <input className="input" id="name" name="name" defaultValue={service?.name} placeholder="e.g. Website design" required />
        <FieldError errors={state?.errors?.name} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input" id="description" name="description" rows={3} defaultValue={service?.description} placeholder="Shown on the invoice line" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="unitPrice">Default price *</label>
          <input className="input" id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" defaultValue={service?.unitPrice ?? ""} required />
          <p className="mt-1 text-xs text-slate-500">Uses the invoice&apos;s currency.</p>
          <FieldError errors={state?.errors?.unitPrice} />
        </div>
        <div>
          <label className="label" htmlFor="unit">Billed per</label>
          <select className="input" id="unit" name="unit" defaultValue={service?.unit ?? "item"}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked={service?.active ?? true} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
        Active (available when creating invoices)
      </label>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
        <Link href="/services" className="btn-secondary">Cancel</Link>
        <SubmitButton>{service ? "Save changes" : "Add service"}</SubmitButton>
      </div>
    </form>
  );
}
