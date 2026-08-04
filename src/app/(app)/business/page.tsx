import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck, Store } from "lucide-react";
import { getBusinesses, getBusinessCategories } from "@/lib/directory/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { BusinessForm } from "@/components/directory/business-form";
import { VerifyBusiness } from "@/components/directory/verify-business";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Direktori bisnis anggota",
  description:
    "Usaha dan jasa yang ditawarkan anggota UJC — jasa titip, terjemahan, katering, potong rambut, dan lainnya.",
};

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const profile = await getCurrentProfile();

  const [items, categories] = await Promise.all([
    getBusinesses(kategori),
    getBusinessCategories(),
  ]);

  const canModerate =
    profile?.role === "admin" || profile?.role === "moderator";

  // RLS also returns the caller's own pending listing and, for moderators, the
  // review queue — so those are shown separately instead of mixed in.
  const verified = items.filter((b) => b.is_verified);
  const pending = items.filter((b) => !b.is_verified);

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

  const card = (b: (typeof items)[number]) => (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface">
      {b.images[0] ? (
        <Image
          src={b.images[0]}
          alt=""
          width={480}
          height={280}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-primary/8">
          <Store className="size-8 text-primary/40" aria-hidden />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {b.is_verified ? (
            <Badge variant="success">
              <ShieldCheck aria-hidden />
              Terverifikasi
            </Badge>
          ) : (
            <Badge variant="danger">Menunggu tinjauan</Badge>
          )}
          {b.category && <Badge variant="outline">{b.category}</Badge>}
        </div>

        <h3 className="mt-3 text-h3 font-medium text-foreground">{b.name}</h3>

        {b.description && (
          <p className="mt-2 line-clamp-3 text-body text-muted-foreground">
            {b.description}
          </p>
        )}

        {b.city && (
          <p className="mt-3 flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="size-4" aria-hidden />
            {b.city}
          </p>
        )}

        <div className="mt-auto pt-5">
          {b.owner && (
            <div className="flex items-center gap-2.5">
              <Avatar src={b.owner.avatar_url} name={b.owner.full_name} size="sm" />
              <Link
                href={`/members/${b.owner.id}`}
                className="min-w-0 flex-1 truncate text-caption text-foreground transition-colors hover:text-primary"
              >
                {b.owner.full_name}
              </Link>
            </div>
          )}

          {b.contact && (
            <p className="mt-2.5 text-caption text-muted-foreground">
              Kontak: <span className="text-foreground">{b.contact}</span>
            </p>
          )}

          {canModerate && (
            <div className="mt-3.5">
              <VerifyBusiness businessId={b.id} verified={b.is_verified} />
            </div>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">
          Direktori bisnis anggota
        </h1>
        <p className="mt-5 text-body text-muted-foreground">
          Anggota yang punya usaha atau menawarkan jasa — jasa titip, terjemahan,
          katering, potong rambut, dan lainnya. Berbelanja di sini berarti uangnya
          berputar di dalam komunitas.
        </p>
      </Reveal>

      <div className="mt-8">
        {profile ? (
          <BusinessForm />
        ) : (
          <Button asChild variant="outline">
            <Link href="/login?next=/business">Masuk untuk mendaftarkan usaha</Link>
          </Button>
        )}
      </div>

      {categories.length > 0 && (
        <div
          role="group"
          aria-label="Saring kategori"
          className="mt-8 flex flex-wrap gap-1.5"
        >
          <Link href="/business" className={chip(!kategori)}>
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/business?kategori=${encodeURIComponent(c)}`}
              className={chip(kategori === c)}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h3 text-foreground">Menunggu tinjauan</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Hanya kamu dan pengurus yang melihat bagian ini.
          </p>
          <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((b) => (
              <RevealItem key={b.id}>{card(b)}</RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      <section className="mt-10">
        {verified.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Belum ada usaha terdaftar"
            description="Belum ada yang lolos tinjauan. Kalau kamu punya usaha atau menawarkan jasa, daftarkan yang pertama."
          />
        ) : (
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {verified.map((b) => (
              <RevealItem key={b.id}>{card(b)}</RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>
    </div>
  );
}
