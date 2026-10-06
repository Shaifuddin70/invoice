"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword, updateAccount } from "@/app/actions/account";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import type { FormState } from "@/lib/form";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 p-6 md:grid-cols-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-5 md:col-span-2">{children}</div>
    </div>
  );
}

function Footer({ state, label }: { state: FormState; label: string }) {
  return (
    <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50 px-6 py-4">
      {state?.message && (
        <span className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>{state.message}</span>
      )}
      <SubmitButton>{label}</SubmitButton>
    </div>
  );
}

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState(updateAccount, undefined);
  const e = state?.errors;
  return (
    <form action={action} className="card">
      <Section title="Personal details" description="Used to sign in and shown on invoices as the signatory.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Full name *</label>
            <input className="input" id="name" name="name" defaultValue={name} autoComplete="name" required />
            <FieldError errors={e?.name} />
          </div>
          <div>
            <label className="label" htmlFor="email">Login email *</label>
            <input className="input" id="email" name="email" type="email" defaultValue={email} autoComplete="email" required />
            <FieldError errors={e?.email} />
          </div>
        </div>
      </Section>
      <Footer state={state} label="Save profile" />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const e = state?.errors;

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card">
      <Section title="Change password" description="At least 8 characters, with a letter and a number.">
        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <input className="input" id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
          <FieldError errors={e?.currentPassword} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="newPassword">New password</label>
            <input className="input" id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
            <FieldError errors={e?.newPassword} />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm new password</label>
            <input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            <FieldError errors={e?.confirmPassword} />
          </div>
        </div>
      </Section>
      <Footer state={state} label="Change password" />
    </form>
  );
}
