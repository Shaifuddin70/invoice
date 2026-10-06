"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { FieldError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-8 space-y-4">
      {state?.message && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state?.errors?.email} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError errors={state?.errors?.password} />
      </div>
      <SubmitButton className="btn-primary w-full" pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
