"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Both icons render on the server; CSS picks one from the `dark` class on
  // <html>, so there is no theme-dependent markup to mismatch on hydration.
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Ganti mode terang atau gelap"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon aria-hidden className="dark:hidden" />
      <Sun aria-hidden className="hidden dark:block" />
    </Button>
  );
}
