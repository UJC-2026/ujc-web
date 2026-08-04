import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import {
  getPreferences,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/notifications/queries";
import { Button } from "@/components/ui/button";
import { savePreferences } from "@/app/(app)/notifications/actions";

export const metadata: Metadata = {
  title: "Pengaturan notifikasi",
  robots: { index: false },
};

export default async function NotificationSettingsPage() {
  await requireProfile();
  const prefs = await getPreferences();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/notifications" className="transition-colors hover:text-primary">
          Notifikasi
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Pengaturan</span>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">
        Pengaturan notifikasi
      </h1>
      <p className="mt-5 text-body text-muted-foreground">
        Pilih kabar apa saja yang ingin kamu terima di dalam aplikasi. Yang
        dimatikan tidak akan dibuatkan notifikasinya sama sekali.
      </p>

      <form action={savePreferences} className="mt-9 space-y-4">
        {(Object.keys(NOTIFICATION_TYPES) as NotificationType[]).map((type) => (
          <label
            key={type}
            className="flex items-start gap-3 rounded-card border border-border bg-surface p-4"
          >
            <input type="hidden" name="type" value={type} />
            <input
              type="checkbox"
              name="enabled"
              value={type}
              defaultChecked={prefs[type]}
              className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
            />
            <span className="text-body text-foreground">
              {NOTIFICATION_TYPES[type]}
            </span>
          </label>
        ))}

        <p className="text-caption text-muted-foreground">
          Notifikasi lewat email dan push belum tersedia — saat ini semuanya
          hanya muncul di dalam aplikasi.
        </p>

        <Button type="submit">Simpan pengaturan</Button>
      </form>
    </div>
  );
}
