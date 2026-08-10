import type { TrendPoint } from "@/lib/admin/queries";

/**
 * Twelve monthly columns, drawn with divs.
 *
 * No chart library: this is one shape, the prefecture breakdown on the same
 * page already draws bars the same way, and a charting dependency would ship
 * more JavaScript to an admin page than the page itself.
 *
 * The numbers are also given as a table row underneath, because a bar whose
 * height is its only label is unreadable to a screen reader and hard to read
 * for anyone when two months are close.
 */
export function TrendChart({
  title,
  points,
  hint,
}: {
  title: string;
  points: TrendPoint[];
  hint?: string;
}) {
  const peak = Math.max(...points.map((p) => p.value), 1);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        <p className="text-caption text-muted-foreground">
          {total.toLocaleString("id-ID")} dalam 12 bulan
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-5 text-caption text-muted-foreground">
          Belum ada yang tercatat dalam setahun terakhir.
        </p>
      ) : (
        // Twelve columns will not fit every container. `flex-1` alone clipped
        // the last one — which is the current month, the only one with data on
        // a young community, so the chart read as a flat empty year. A minimum
        // width plus scrolling means a column is never hidden.
        <ol className="mt-5 flex h-32 items-end gap-1.5 overflow-x-auto pb-1">
          {points.map((point, i) => (
            <li
              key={`${point.label}-${i}`}
              className="flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="text-caption tabular-nums text-muted-foreground">
                {point.value > 0 ? point.value : ""}
              </span>
              <span
                className="w-full rounded-t-sm bg-primary/70"
                // A zero month keeps a hairline so the axis stays readable.
                style={{ height: `${Math.max((point.value / peak) * 100, 2)}%` }}
                aria-hidden
              />
              <span className="text-caption text-muted-foreground">
                {point.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {hint && <p className="mt-4 text-caption text-muted-foreground">{hint}</p>}

      <p className="sr-only">
        {points.map((p) => `${p.label}: ${p.value}`).join(", ")}
      </p>
    </section>
  );
}
