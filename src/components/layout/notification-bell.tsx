import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/notifications/queries";

/**
 * Rendered on the server so the badge is correct on first paint. The count is
 * scoped by RLS to the signed-in member.
 */
export async function NotificationBell() {
  const unread = await getUnreadCount();

  return (
    <Link
      href="/notifications"
      aria-label={
        unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"
      }
      className="relative flex size-9 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
    >
      <Bell className="size-5" aria-hidden />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-pill bg-danger px-1 text-[0.65rem] font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
