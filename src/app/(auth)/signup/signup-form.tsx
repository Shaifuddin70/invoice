"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</div>
      )}
      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
        <FieldError errors={state?.errors?.name} />
      </div>
      <div>
        <label className="label" htmlFor="businessName">Business name</label>
        <input className="input" id="businessName" name="businessName" autoComplete="organization" />
        <FieldError errors={state?.errors?.businessName} />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state?.errors?.email} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>
        <FieldError errors={state?.errors?.password} />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
