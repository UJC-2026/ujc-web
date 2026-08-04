"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleRegistration } from "@/app/(app)/workshops/actions";

function Submit({ registered }: { registered: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant={registered ? "outline" : undefined}
      loading={pending}
    >
      {pending ? "Memproses…" : registered ? "Batalkan" : "Daftar"}
    </Button>
  );
}

export function RegisterButton({
  workshopId,
  registered,
  disabled,
}: {
  workshopId: string;
  registered: boolean;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await toggleRegistration({}, formData);
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
  }

  if (disabled) {
    return (
      <p className="text-caption text-muted-foreground">
        Kuota sudah penuh. Pantau kalau ada yang membatalkan.
      </p>
    );
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="workshopId" value={workshopId} />
      <input type="hidden" name="registered" value={String(registered)} />
      <Submit registered={registered} />
      {error && (
        <p role="alert" className="mt-2 text-caption text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
