"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { CornerDownLeft, Loader2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KIND_LABEL, type SearchHit } from "@/lib/search/types";
import { cn } from "@/lib/utils";

const NAV_SHORTCUTS = [
  { label: "Forum", href: "/forum" },
  { label: "Kegiatan", href: "/events" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Papan lowongan", href: "/jobs" },
  { label: "Latihan CBT", href: "/cbt" },
  { label: "Direktori anggota", href: "/members" },
  { label: "UJC Peduli", href: "/peduli" },
  { label: "Pesan", href: "/messages" },
];

/**
 * ⌘K / Ctrl+K search. Queries the same `global_search` RPC the results page
 * uses, so what appears here is filtered by RLS in exactly the same way.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced so typing does not fire a query per keystroke. Nothing is set
  // synchronously here — a short term simply falls through to the shortcut
  // list below, so stale hits never need clearing.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) return;

    const ticket = ++seq.current;

    const timer = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.rpc("global_search", { q, per_kind: 3 });

      // Ignore results from a query the user has already typed past.
      if (ticket !== seq.current) return;

      setHits(
        ((data ?? []) as SearchHit[]).sort((a, b) => b.rank - a.rank).slice(0, 8),
      );
      setActive(0);
      setLoading(false);
    }, 220);

    return () => clearTimeout(timer);
  }, [term]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setTerm("");
      router.push(href);
    },
    [router],
  );

  const options = term.trim().length < 2
    ? NAV_SHORTCUTS.map((s) => ({ href: s.href, title: s.label, kind: null }))
    : hits.map((h) => ({ href: h.href, title: h.title, kind: h.kind }));

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Cari (Ctrl+K)"
          className="flex size-9 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-[12vh] left-1/2 z-50 w-[min(36rem,92vw)] -translate-x-1/2 overflow-hidden rounded-panel border border-border bg-surface"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, options.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === "Enter" && options[active]) {
              event.preventDefault();
              go(options[active].href);
            }
          }}
        >
          <Dialog.Title className="sr-only">Pencarian cepat</Dialog.Title>
          <Dialog.Description className="sr-only">
            Ketik untuk mencari, panah atas-bawah untuk memilih, Enter untuk membuka.
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4.5 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Cari forum, anggota, barang, lowongan…"
              aria-label="Kata kunci"
              className="h-13 flex-1 bg-transparent py-4 text-body text-foreground outline-none placeholder:text-muted-foreground"
            />
            {loading && (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            )}
          </div>

          <ul className="max-h-[50vh] overflow-y-auto p-2">
            {options.length === 0 ? (
              <li className="px-3 py-6 text-center text-caption text-muted-foreground">
                {loading ? "Mencari…" : `Tidak ada hasil untuk “${term.trim()}”.`}
              </li>
            ) : (
              options.map((option, index) => (
                <li key={`${option.href}-${index}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(option.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-field px-3 py-2.5 text-left transition-colors",
                      index === active
                        ? "bg-surface-muted text-primary"
                        : "text-foreground hover:bg-surface-muted",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-body">
                      {option.title}
                    </span>
                    {option.kind && (
                      <span className="shrink-0 text-caption text-muted-foreground">
                        {KIND_LABEL[option.kind]}
                      </span>
                    )}
                    {index === active && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-border px-4 py-2.5 text-caption text-muted-foreground">
            <kbd className="rounded border border-border px-1.5 py-0.5">↑↓</kbd>{" "}
            pilih ·{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5">Enter</kbd>{" "}
            buka ·{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5">Esc</kbd>{" "}
            tutup
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
