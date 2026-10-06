"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/form";

export function DeleteButton({
  action,
  confirmText,
  label = "Delete",
}: {
  action: () => Promise<FormState>;
  confirmText: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn-danger"
        disabled={pending}
        onClick={() => {
          if (!confirm(confirmText)) return;
          startTransition(async () => {
            const res = await action();
            if (res?.message) setError(res.message);
          });
        }}
      >
        {pending ? "Deleting…" : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
