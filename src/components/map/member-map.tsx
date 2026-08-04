"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { JAPAN_CENTER, PREFECTURE_CENTROIDS } from "@/lib/map/prefectures";
import type { PrefectureCount } from "@/lib/map/queries";
import "leaflet/dist/leaflet.css";

/**
 * Plots one circle per prefecture, sized by member count. The circles use
 * centroids shipped with the app — member coordinates never reach the client
 * (see migration 0018), so nothing here can reveal where someone lives.
 */
export function MemberMap({ points }: { points: PrefectureCount[] }) {
  const max = Math.max(1, ...points.map((point) => point.member_count));

  return (
    <MapContainer
      center={JAPAN_CENTER}
      zoom={5}
      scrollWheelZoom={false}
      className="h-[26rem] w-full rounded-panel border border-border sm:h-[34rem]"
      aria-label="Peta sebaran anggota UJC di Jepang"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {points.map((point) => {
        const centroid = PREFECTURE_CENTROIDS[point.prefecture];
        if (!centroid) return null;

        // Area scales with the count so the circles stay comparable.
        const radius = 8 + Math.sqrt(point.member_count / max) * 22;

        return (
          <CircleMarker
            key={point.prefecture}
            center={centroid}
            radius={radius}
            pathOptions={{
              color: "var(--primary)",
              fillColor: "var(--accent)",
              fillOpacity: 0.55,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{point.prefecture}</strong>
              <br />
              {point.member_count.toLocaleString("id-ID")} anggota
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
