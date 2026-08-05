import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  GraduationCap,
  HandHeart,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  getMemberListings,
  getMemberProfile,
  getMemberThreads,
} from "@/lib/members/queries";
import { getMemberBadges } from "@/lib/badges/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { openConversation } from "@/app/(app)/messages/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateID, relativeTime } from "@/lib/format";

type PageProps = { params: Promise<{ id: string }> };

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberProfile(id);

  if (!member) return { title: "Anggota tidak ditemukan" };

  return {
    title: `${member.full_name} · Anggota`,
    description:
      member.bio?.slice(0, 155) ??
      `Profil ${member.full_name}, anggota UNSIA Japan Community.`,
  };
}

export default async function MemberPage({ params }: PageProps) {
  const { id } = await params;

  const [member, viewer] = await Promise.all([
    getMemberProfile(id),
    getCurrentProfile(),
  ]);

  // RLS hides members who made their profile private, so a miss is a 404.
  if (!member) notFound();

  const [threads, listings, badges] = await Promise.all([
    getMemberThreads(member.id),
    getMemberListings(member.id),
    getMemberBadges(member.id),
  ]);

  const isSelf = viewer?.id === member.id;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/members" className="transition-colors hover:text-primary">
          Direktori anggota
        </Link>
      </nav>

      <header className="mt-5 flex flex-wrap items-start gap-5">
        <Avatar src={member.avatar_url} name={member.full_name} size="lg" />

        <div className="min-w-0 flex-1">
          <h1 className="text-h1 text-foreground">{member.full_name}</h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {member.role !== "member" && <RoleBadge role={member.role} />}
            {member.is_verified && (
              <Badge variant="success">
                <ShieldCheck aria-hidden />
                Terverifikasi
              </Badge>
            )}
            {member.isMentor && (
              <Badge variant="accent">
                <HandHeart aria-hidden />
                Mentor
              </Badge>
            )}
          </div>

          {member.motto && (
            <p className="mt-3 text-body italic text-muted-foreground">
              “{member.motto}”
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {viewer && !isSelf && (
            <form action={openConversation}>
              <input type="hidden" name="otherId" value={member.id} />
              <Button type="submit" size="sm">
                <MessageSquare aria-hidden />
                Kirim pesan
              </Button>
            </form>
          )}
          {member.isMentor && !isSelf && (
            <Button asChild size="sm" variant="outline">
              <Link href="/mentorship">
                <HandHeart aria-hidden />
                Ajukan bimbingan
              </Link>
            </Button>
          )}
          {isSelf && (
            <Button asChild size="sm" variant="outline">
              <Link href="/profile">Edit profil</Link>
            </Button>
          )}
        </div>
      </header>

      {member.bio && (
        <p className="mt-7 text-body whitespace-pre-line text-muted-foreground">
          {member.bio}
        </p>
      )}

      <dl className="mt-8 grid gap-4 rounded-panel border border-border bg-surface p-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Domisili</dt>
            <dd className="text-body text-foreground">
              {[member.city, member.prefecture].filter(Boolean).join(", ") ||
                "Belum diisi"}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <GraduationCap className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Program studi</dt>
            <dd className="text-body text-foreground">
              {[member.major, member.angkatan && `Angkatan ${member.angkatan}`]
                .filter(Boolean)
                .join(" · ") || "Belum diisi"}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Bergabung</dt>
            <dd className="text-body text-foreground">
              {formatDateID(member.join_date)}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Star className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Kontribusi</dt>
            <dd className="text-body text-foreground">
              {member.points.toLocaleString("id-ID")} poin ·{" "}
              {member.threadCount.toLocaleString("id-ID")} diskusi
            </dd>
          </div>
        </div>
      </dl>

      {badges.length > 0 && (
        <section className="mt-10">
          <h2 className="rule-gold text-h3 text-foreground">Lencana</h2>
          <BadgeGrid badges={badges} className="mt-6" />
        </section>
      )}

      {threads.length > 0 && (
        <section className="mt-10">
          <h2 className="rule-gold text-h3 text-foreground">Diskusi terbaru</h2>
          <ul className="mt-6 space-y-2.5">
            {threads.map((thread) => (
              <li
                key={thread.id}
                className="rounded-card border border-border bg-surface px-4 py-3"
              >
                <p className="text-body text-foreground">
                  {thread.href ? (
                    <Link
                      href={thread.href}
                      className="transition-colors hover:text-primary"
                    >
                      {thread.title}
                    </Link>
                  ) : (
                    thread.title
                  )}
                </p>
                <p className="text-caption text-muted-foreground">
                  {relativeTime(thread.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {listings.length > 0 && (
        <section className="mt-10">
          <h2 className="rule-gold text-h3 text-foreground">
            Sedang dijual di marketplace
          </h2>
          <ul className="mt-6 space-y-2.5">
            {listings.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <Package className="size-4 shrink-0 text-primary" aria-hidden />
                <Link
                  href={`/marketplace/${item.id}`}
                  className="min-w-0 flex-1 truncate text-body text-foreground transition-colors hover:text-primary"
                >
                  {item.title}
                </Link>
                <span className="text-caption font-medium text-foreground">
                  {item.is_giveaway
                    ? "Gratis"
                    : item.price !== null
                      ? yen.format(item.price)
                      : "Nego"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
