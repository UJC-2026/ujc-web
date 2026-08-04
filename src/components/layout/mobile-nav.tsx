"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { NAV_LINKS } from "./nav-links";

export function MobileNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
          <Menu aria-hidden />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col border-l border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <Dialog.Title asChild>
              <Logo showWordmark={false} />
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Tutup menu">
                <X aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Navigasi utama UNSIA Japan Community
          </Dialog.Description>

          <nav className="mt-6 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-field bg-surface-muted px-3.5 py-3 text-body font-medium text-primary"
                      : "rounded-field px-3.5 py-3 text-body text-foreground transition-colors hover:bg-surface-muted"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {!isAuthenticated && (
            <div className="mt-auto flex flex-col gap-2 border-t border-border pt-5">
              <Button asChild variant="outline">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Masuk
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={() => setOpen(false)}>
                  Daftar
                </Link>
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
