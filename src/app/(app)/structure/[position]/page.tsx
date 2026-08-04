import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Users } from "lucide-react";
import { getPosition } from "@/lib/structure/queries";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type PageProps = { params: Promise<{ position: string }> };

const STATUS = {
  aktif: { label: "Aktif", variant: "success" as const },
  alumni: { label: "Alumni", variant: "outline" as const },
  cuti: { label: "Cuti", variant: "neutral" as const },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { position: id } = await params;
  const result = await getPosition(id);

  if (!result) return { title: "Jabatan tidak ditemukan" };

  return {
    title: `${result.position.name} · Struktur organisasi`,
    description:
      result.position.description ??
      `Anggota ${result.position.name} di UNSIA Japan Community.`,
  };
}

export default async function PositionPage({ params }: PageProps) {
  const { position: id } = await params;
  const result = await getPosition(id);

  if (!result) notFound();
  const { position, parent, period } = result;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/structure" className="transition-colors hover:text-primary">
          Struktur organisasi
        </Link>
        {parent && (
          <>
            <span aria-hidden> / </span>
            <Link
              href={`/structure/${parent.id}`}
              className="transition-colors hover:text-primary"
            >
              {parent.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {period && (
          <Badge variant={period.is_active ? "primary" : "outline"}>
            Periode {period.year_label}
          </Badge>
        )}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{position.name}</h1>

      {position.description && (
        <p className="mt-5 text-body whitespace-pre-line text-muted-foreground">
          {position.description}
        </p>
      )}

      <section className="mt-10">
        <h2 className="rule-gold flex items-center gap-2 text-h3 text-foreground">
          <Users className="size-5 text-muted-foreground" aria-hidden />
          {position.members.length} pengurus
        </h2>

        {position.members.length === 0 ? (
          <p className="mt-6 text-body text-muted-foreground">
            Belum ada pengurus yang tercatat di jabatan ini.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {position.members.map((member) => {
              const badge = STATUS[member.status];
              const links = Object.entries(member.contact ?? {});

              return (
                <li
                  key={member.id}
                  className="rounded-card border border-border bg-surface p-5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.photo_url}
                      name={member.display_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-foreground">
                        {member.user_id ? (
                          <Link
                            href={`/members/${member.user_id}`}
                            className="transition-colors hover:text-primary"
                          >
                            {member.display_name}
                          </Link>
                        ) : (
                          member.display_name
                        )}
                      </p>
                      {member.city && (
                        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                          <MapPin className="size-3.5" aria-hidden />
                          {member.city}
                        </p>
                      )}
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>

                  {member.motto && (
                    <p className="mt-3 text-caption italic text-muted-foreground">
                      “{member.motto}”
                    </p>
                  )}

                  {links.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {links.map(([label, url]) => (
                        <li key={label}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-caption text-primary transition-colors hover:text-accent"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                            {label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {position.children.length > 0 && (
        <section className="mt-10">
          <h2 className="rule-gold text-h3 text-foreground">Di bawahnya</h2>
          <ul className="mt-6 space-y-2.5">
            {position.children.map((child) => (
              <li
                key={child.id}
                className="rounded-card border border-border bg-surface px-4 py-3"
              >
                <Link
                  href={`/structure/${child.id}`}
                  className="text-body text-foreground transition-colors hover:text-primary"
                >
                  {child.name}
                </Link>
                {child.description && (
                  <p className="text-caption text-muted-foreground">
                    {child.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
