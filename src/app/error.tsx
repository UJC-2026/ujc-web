"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-28 text-center">
      <span className="flex size-14 items-center justify-center rounded-pill border border-accent/40 bg-accent-muted/40 text-accent">
        <RefreshCw className="size-6" aria-hidden />
      </span>
      <h1 className="mt-7 text-h2 text-foreground">Ada yang tidak beres</h1>
      <p className="mt-4 text-body text-muted-foreground">
        Halaman ini gagal dimuat. Bukan salahmu — coba muat ulang, biasanya
        langsung beres.
      </p>
      <Button className="mt-8" onClick={reset}>
        Coba lagi
      </Button>
    </div>
  );
}
