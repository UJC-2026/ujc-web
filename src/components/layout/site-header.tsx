import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { NotificationBell } from "./notification-bell";
import { CommandPalette } from "@/components/search/command-palette";
import { HeaderShell } from "./header-shell";
import { NAV_LINKS } from "./nav-links";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" aria-label="Beranda UJC">
          <Logo />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="ml-4 hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-pill px-3 py-2 text-caption font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CommandPalette />
          <ThemeToggle />
          {profile ? (
            <>
              <NotificationBell />
              <UserMenu profile={profile} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Daftar</Link>
              </Button>
            </div>
          )}
          <MobileNav isAuthenticated={Boolean(profile)} />
        </div>
      </div>
    </HeaderShell>
  );
}
