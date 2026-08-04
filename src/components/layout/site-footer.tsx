import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NamiPattern } from "@/components/brand/motifs";

const FOOTER_SECTIONS = [
  {
    title: "Komunitas",
    links: [
      { href: "/forum", label: "Forum" },
      { href: "/members", label: "Direktori anggota" },
      { href: "/events", label: "Kegiatan" },
      { href: "/gallery", label: "Galeri" },
      { href: "/map", label: "Peta anggota" },
      { href: "/structure", label: "Struktur organisasi" },
    ],
  },
  {
    title: "Belajar & Karier",
    links: [
      { href: "/cbt", label: "Latihan CBT" },
      { href: "/workshops", label: "Workshop & webinar" },
      { href: "/mentorship", label: "Mentor Senpai-Kouhai" },
      { href: "/jobs", label: "Papan lowongan" },
      { href: "/resources", label: "Resource" },
    ],
  },
  {
    title: "Ekonomi & Cerita",
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/business", label: "Bisnis anggota" },
      { href: "/blog", label: "Blog komunitas" },
      { href: "/peduli", label: "UJC Peduli" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/about", label: "Tentang UJC" },
      { href: "/help", label: "Cara pakai website" },
      { href: "/search", label: "Pencarian" },
      { href: "/privacy", label: "Kebijakan privasi" },
      { href: "/terms", label: "Ketentuan layanan" },
      { href: "/accessibility", label: "Aksesibilitas" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-border bg-surface-muted/50">
      <NamiPattern
        className="absolute inset-x-0 -top-px h-6 w-full text-brand-blue-100 dark:text-navy-800/60"
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-caption text-muted-foreground">
              Wadah mahasiswa program distance learning Universitas Siber Asia
              yang tinggal dan bekerja di Jepang.
            </p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="text-caption font-semibold text-foreground">
                {section.title}
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-caption text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted-foreground">
            © {new Date().getFullYear()} UNSIA Japan Community
          </p>
          <p className="text-caption text-muted-foreground">
            Dibangun dengan{" "}
            <span className="font-serif text-accent" aria-label="kizuna, ikatan">
              絆
            </span>{" "}
            oleh anggota UJC
          </p>
        </div>
      </div>
    </footer>
  );
}
