"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/(app)/settings/data/actions";
import { DELETE_CONFIRMATION } from "@/lib/account/confirmation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function Submit({ armed }: { armed: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" loading={pending} disabled={!armed}>
      <Trash2 aria-hidden />
      {pending ? "Menghapus…" : "Hapus akun saya"}
    </Button>
  );
}

export function DeleteAccountForm() {
  const [error, setError] = useState<string>();
  // Mirrors the server check so the button stays inert until the words match;
  // the action re-checks regardless, this only removes the near-miss click.
  const [armed, setArmed] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await deleteAccount({}, formData);
    // Reached only when the action refused — success redirects away.
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Field
        label={`Ketik "${DELETE_CONFIRMATION}" untuk mengonfirmasi`}
        htmlFor="confirmation"
      >
        <Input
          id="confirmation"
          name="confirmation"
          autoComplete="off"
          placeholder={DELETE_CONFIRMATION}
          onChange={(event) =>
            setArmed(
              event.target.value.trim().toUpperCase() === DELETE_CONFIRMATION,
            )
          }
        />
      </Field>

      <Submit armed={armed} />
    </form>
  );
}
