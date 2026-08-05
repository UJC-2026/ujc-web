"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The "download" is the browser's own print-to-PDF; see the page comment. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer aria-hidden />
      Unduh / cetak PDF
    </Button>
  );
}
