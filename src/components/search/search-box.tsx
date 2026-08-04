"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(initial);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const q = term.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="relative"
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Cari apa saja…"
        aria-label="Kata kunci pencarian"
        autoFocus
        className="h-12 pl-11 text-body"
      />
      <Button type="submit" className="sr-only">
        Cari
      </Button>
    </form>
  );
}
