"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-card !border !border-border !bg-surface !text-foreground",
          description: "!text-muted-foreground",
          success: "!text-success",
          error: "!text-danger",
          info: "!text-primary",
        },
      }}
    />
  );
}
