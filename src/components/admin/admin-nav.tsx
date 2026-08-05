"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  Layout,
  ScrollText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Ikhtisar", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/moderasi", label: "Antrean moderasi", icon: ClipboardList, adminOnly: false },
  { href: "/admin/beranda", label: "Konten beranda", icon: Layout, adminOnly: false },
  { href: "/admin/anggota", label: "Anggota", icon: Users, adminOnly: true },
  { href: "/admin/audit", label: "Catatan tindakan", icon: ScrollText, adminOnly: false },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const visible = LINKS.filter((link) => isAdmin || !link.adminOnly);

  return (
    <nav aria-label="Menu pengelola" className="lg:w-56 lg:shrink-0">
      <ul className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
        {visible.map((link) => {
          // "/admin" would otherwise match every child route.
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0 lg:shrink">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-field px-3.5 py-2.5 text-caption font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
                )}
              >
                <link.icon className="size-4 shrink-0" aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
