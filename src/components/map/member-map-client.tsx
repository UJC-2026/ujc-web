"use client";

import dynamic from "next/dynamic";
import type { PrefectureCount } from "@/lib/map/queries";

/**
 * Leaflet touches `window` at import time, so the map must not be
 * server-rendered. `ssr: false` is only honoured inside a Client Component —
 * calling next/dynamic from the Server Component page still SSRs the child,
 * which is what threw "window is not defined" on every request to /map.
 */
const MemberMap = dynamic(
  () => import("./member-map").then((m) => m.MemberMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="skeleton-shimmer h-[26rem] w-full rounded-panel sm:h-[34rem]"
        aria-label="Memuat peta anggota"
      />
    ),
  },
);

export function MemberMapClient({ points }: { points: PrefectureCount[] }) {
  return <MemberMap points={points} />;
}
