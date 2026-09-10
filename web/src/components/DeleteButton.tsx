"use client";

import { useState, useTransition } from "react";

export function DeleteButton<T extends number | string>({
  action,
  id,
  label = "Hapus",
  confirmText = "Yakin?",
  className,
}: {
  action: (id: T) => Promise<void>;
  id: T;
  label?: string;
  confirmText?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className={
        className ||
        "rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
      }
      onClick={() => {
        if (!confirm) {
          setConfirm(true);
          window.setTimeout(() => setConfirm(false), 3000);
          return;
        }
        startTransition(() => {
          void action(id);
        });
      }}
    >
      {pending ? "..." : confirm ? confirmText : label}
    </button>
  );
}