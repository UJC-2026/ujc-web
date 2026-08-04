import type { Metadata } from "next";
import Link from "next/link";
import { BellOff, Check, Settings2 } from "lucide-react";
import { getNotifications } from "@/lib/notifications/queries";
import { requireProfile } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/format";
import { clearRead, markAllRead, markOneRead } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notifikasi",
  robots: { index: false },
};

export default async function NotificationsPage() {
  await requireProfile();
  const items = await getNotifications();

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="rule-gold text-h1 text-foreground">Notifikasi</h1>
          <p className="mt-5 text-body text-muted-foreground">
            {unread > 0
              ? `${unread.toLocaleString("id-ID")} belum dibaca.`
              : "Semua sudah kamu baca."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/settings/notifications">
            <Settings2 aria-hidden />
            Atur notifikasi
          </Link>
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-2">
          {unread > 0 && (
            <form action={markAllRead}>
              <Button type="submit" size="sm" variant="outline">
                <Check aria-hidden />
                Tandai semua dibaca
              </Button>
            </form>
          )}
          <form action={clearRead}>
            <Button type="submit" size="sm" variant="ghost">
              Hapus yang sudah dibaca
            </Button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={BellOff}
            title="Belum ada notifikasi"
            description="Kalau ada yang membalas diskusimu, mengirim pesan, atau memberimu tugas, kabarnya muncul di sini."
          />
        </div>
      ) : (
        <ul className="mt-7 space-y-2.5">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-card border px-4 py-3.5",
                item.is_read
                  ? "border-border bg-surface"
                  : "border-accent/50 bg-accent-muted/25",
              )}
            >
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-foreground">
                    {item.link ? (
                      <Link
                        href={item.link}
                        className="transition-colors hover:text-primary"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </p>
                  {item.body && (
                    <p className="mt-1 text-caption text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-1 text-caption text-muted-foreground">
                    {relativeTime(item.created_at)}
                  </p>
                </div>

                {!item.is_read && (
                  <form action={markOneRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="rounded-field border border-border px-2.5 py-1.5 text-caption text-muted-foreground transition-colors hover:border-accent hover:text-primary"
                    >
                      Tandai dibaca
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
