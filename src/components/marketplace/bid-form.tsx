"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { placeBid } from "@/app/(app)/marketplace/actions";
import { useLiveRows } from "@/lib/realtime/use-live-rows";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Mengirim…" : "Kirim tawaran"}
    </Button>
  );
}

export function BidForm({
  itemId,
  minimum,
}: {
  itemId: string;
  minimum: number;
}) {
  const [error, setError] = useState<string>();
  const [amount, setAmount] = useState(String(minimum));

  // Competing bids show up without a refresh; bids are public, so this
  // exposes nothing that was not already readable.
  useLiveRows({ table: "marketplace_bids", filter: `item_id=eq.${itemId}` });

  async function handleSubmit(formData: FormData) {
    const result = await placeBid({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="itemId" value={itemId} />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="bid-amount"
          className="text-caption font-medium text-foreground"
        >
          Tawaranmu (¥)
        </label>
        <Input
          id="bid-amount"
          name="amount"
          type="number"
          min={minimum}
          step={1}
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="mt-1.5"
        />
        <p className="mt-1.5 text-caption text-muted-foreground">
          Minimal ¥{minimum.toLocaleString("ja-JP")}.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}
