"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MemberSearch({
  basePath,
  initial,
  placeholder = "Cari nama atau NIM…",
  label = "Cari anggota",
}: {
  basePath: string;
  initial: string;
  /** Overridden on /structure, where the same box also matches divisi and kota. */
  placeholder?: string;
  label?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(initial);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = new URLSearchParams(params.toString());
        if (term.trim()) query.set("q", term.trim());
        else query.delete("q");
        // A new search invalidates the current page offset.
        query.delete("page");
        const qs = query.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath);
      }}
      className="relative w-full max-w-md"
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pl-10"
      />
      <Button type="submit" className="sr-only">
        Cari
      </Button>
    </form>
  );
}
