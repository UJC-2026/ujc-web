import type { Metadata } from "next";
import Link from "next/link";
import { Palette } from "lucide-react";
import { getCreativeWorks } from "@/lib/creative/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { WorkCard } from "@/components/creative/work-card";
import { SubmitWorkForm } from "@/components/creative/submit-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Creative Hub",
  description:
    "Karya anggota UJC — vlog, fotografi, musik, komik, dan tulisan yang lahir di sela kuliah dan kerja di Jepang.",
};

export default async function CreativeHubPage() {
  const profile = await getCurrentProfile();
  const works = await getCreativeWorks();

  const canModerate =
    profile?.role === "admin" || profile?.role === "moderator";

  // RLS returns approved works, the caller's own pending ones, and (for
  // moderators) the review queue — split for display, never re-filtered.
  const pending = works.filter((w) => !w.is_approved);
  const approved = works.filter((w) => w.is_approved);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">Creative Hub</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Karya yang lahir di sela shift dan kelas daring — vlog, fotografi,
          musik, komik, tulisan. Dikurasi divisi media supaya yang tampil di
          sini memang layak dirayakan.
        </p>
      </Reveal>

      <div className="mt-8">
        {profile ? (
          <SubmitWorkForm />
        ) : (
          <Button asChild variant="outline">
            <Link href="/login?next=/creative-hub">
              Masuk untuk membagikan karyamu
            </Link>
          </Button>
        )}
      </div>

      {pending.length > 0 && (
        <section className="mt-10">
          <h2 className="text-h3 text-foreground">Menunggu tinjauan</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Hanya kamu dan pengurus yang melihat bagian ini.
          </p>
          <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((work) => (
              <RevealItem key={work.id}>
                <WorkCard
                  work={work}
                  canModerate={canModerate}
                  isOwner={work.submitted_by === profile?.id}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}

      <section className="mt-10">
        {approved.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="Belum ada karya"
            description="Jadilah yang pertama — bagikan vlog, foto, musik, atau tulisanmu."
          />
        ) : (
          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((work) => (
              <RevealItem key={work.id}>
                <WorkCard
                  work={work}
                  canModerate={canModerate}
                  isOwner={work.submitted_by === profile?.id}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>
    </div>
  );
}
