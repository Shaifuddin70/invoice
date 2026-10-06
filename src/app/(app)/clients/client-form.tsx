"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveClient } from "@/app/actions/clients";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { Client } from "@/db/schema";

export function ClientForm({ client, returnTo }: { client?: Client; returnTo?: string }) {
  const [state, action] = useActionState(saveClient.bind(null, client?.id ?? null), undefined);

  return (
    <form action={action} className="card space-y-5 p-6">
      {state?.message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</div>}
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Contact name *</label>
          <input className="input" id="name" name="name" defaultValue={client?.name} required />
          <FieldError errors={state?.errors?.name} />
        </div>
        <div>
          <label className="label" htmlFor="company">Company</label>
          <input className="input" id="company" name="company" defaultValue={client?.company} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" defaultValue={client?.email} />
          <FieldError errors={state?.errors?.email} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input className="input" id="phone" name="phone" defaultValue={client?.phone} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">Address</label>
          <textarea className="input" id="address" name="address" rows={3} defaultValue={client?.address} />
        </div>
        <div>
          <label className="label" htmlFor="taxId">Tax / VAT ID</label>
          <input className="input" id="taxId" name="taxId" defaultValue={client?.taxId} />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
        <Link href={returnTo ?? "/clients"} className="btn-secondary">Cancel</Link>
        <SubmitButton>{client ? "Save changes" : "Add client"}</SubmitButton>
      </div>
    </form>
  );
}
