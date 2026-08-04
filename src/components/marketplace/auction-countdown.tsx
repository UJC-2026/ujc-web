"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

function remaining(endAt: string) {
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return null;

  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Ticks client-side, but starts from null so server and client agree on the
 * first paint — otherwise the countdown would differ by the request latency
 * and trip a hydration mismatch.
 */
export function AuctionCountdown({
  endAt,
  compact = false,
}: {
  endAt: string;
  compact?: boolean;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(remaining(endAt));
    tick();

    // Under a minute left, count seconds; otherwise a slower tick is plenty.
    const soon = new Date(endAt).getTime() - Date.now() < 3_600_000;
    const id = setInterval(tick, soon ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [endAt]);

  if (!label) {
    return (
      <p
        className={cn(
          "flex items-center gap-1.5 text-caption text-muted-foreground",
          compact ? "mt-1" : "mt-0",
        )}
      >
        <Timer className="size-4 shrink-0" aria-hidden />
        <span className="tabular-nums">Menghitung sisa waktu…</span>
      </p>
    );
  }

  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-caption font-medium text-accent",
        compact ? "mt-1" : "mt-0",
      )}
    >
      <Timer className="size-4 shrink-0" aria-hidden />
      <span className="tabular-nums">Sisa {label}</span>
    </p>
  );
}
