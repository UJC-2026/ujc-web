import Link from "next/link";
import type { PanelDef, PanelId } from "@/lib/dashboard/panels";
import { cn } from "@/lib/utils";

/**
 * Panels are addressed by `?panel=`, so switching is a client-side navigation
 * that re-renders only the active panel on the server. Deep links and the back
 * button keep working, which client-only state would have thrown away.
 */
export function DashboardNav({
  panels,
  active,
}: {
  panels: PanelDef[];
  active: PanelId;
}) {
  const groups: { key: "anggota" | "pengurus"; label: string }[] = [
    { key: "anggota", label: "Anggota" },
    { key: "pengurus", label: "Pengurus" },
  ];

  return (
    <nav aria-label="Menu dashboard" className="lg:w-56 lg:shrink-0">
      {groups.map((group) => {
        const items = panels.filter((panel) => panel.group === group.key);
        if (items.length === 0) return null;

        return (
          <div key={group.key} className="mb-6 last:mb-0">
            <p className="px-3.5 pb-2 text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
            <ul className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
              {items.map((panel) => (
                <li key={panel.id} className="shrink-0 lg:shrink">
                  <Link
                    href={`/dashboard?panel=${panel.id}`}
                    aria-current={active === panel.id ? "page" : undefined}
                    className={cn(
                      "block rounded-field px-3.5 py-2.5 text-caption font-medium whitespace-nowrap transition-colors",
                      active === panel.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
                    )}
                  >
                    {panel.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
