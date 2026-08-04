"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, LayoutDashboard, LogOut, MessageSquare, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { signOut } from "@/app/(auth)/actions";
import type { Profile } from "@/lib/supabase/types";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profil saya", icon: User },
  { href: "/messages", label: "Pesan", icon: MessageSquare },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
];

const itemClass =
  "flex w-full items-center gap-2.5 rounded-field px-2.5 py-2 text-caption text-foreground outline-none transition-colors data-[highlighted]:bg-surface-muted data-[highlighted]:text-primary";

export function UserMenu({ profile }: { profile: Profile }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="rounded-pill outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Menu akun"
      >
        <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 w-60 rounded-card border border-border bg-surface p-1.5 shadow-lg"
        >
          <div className="border-b border-border px-2.5 pt-1.5 pb-3">
            <p className="truncate text-caption font-semibold text-foreground">
              {profile.full_name}
            </p>
            <div className="mt-1.5">
              <RoleBadge role={profile.role} />
            </div>
          </div>

          <div className="pt-1.5">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <DropdownMenu.Item key={href} asChild>
                <Link href={href} className={itemClass}>
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </DropdownMenu.Item>
            ))}
          </div>

          <DropdownMenu.Separator className="my-1.5 h-px bg-border" />

          <form action={signOut}>
            <DropdownMenu.Item asChild>
              <button type="submit" className={`${itemClass} text-danger data-[highlighted]:text-danger`}>
                <LogOut className="size-4" aria-hidden />
                Keluar
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
