import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "UNSIA Japan Community",
    short_name: "UJC",
    description:
      "Wadah mahasiswa program distance learning Universitas Siber Asia yang tinggal dan bekerja di Jepang.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1e3a8a",
    lang: "id",
    dir: "ltr",
    categories: ["education", "social"],
    icons: [
      // PNGs are what browsers actually check before offering to install;
      // the SVG is kept for crisp rendering where it is supported.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/logo-ujc.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Forum", url: "/forum" },
      { name: "Kegiatan", url: "/events" },
      { name: "Pesan", url: "/messages" },
    ],
  };
}
