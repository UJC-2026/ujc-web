import type { Metadata } from "next";
import Link from "next/link";
import { HandHeart, Users } from "lucide-react";
import {
  getExpertiseTags,
  getMentors,
  getMyMentorProfile,
  getMyRequests,
} from "@/lib/mentorship/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { MentorCard } from "@/components/mentorship/mentor-card";
import { RequestList } from "@/components/mentorship/request-list";
import { MentorProfileForm } from "@/components/mentorship/mentor-profile-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mentor Senpai-Kouhai",
  description:
    "Sistem bimbingan antar anggota UJC — senior yang sudah lebih dulu di Jepang membantu anggota baru beradaptasi.",
};

type PageProps = { searchParams: Promise<{ bidang?: string }> };

export default async function MentorshipPage({ searchParams }: PageProps) {
  const { bidang } = await searchParams;
  const profile = await getCurrentProfile();

  const [mentors, tags, myMentor, requests] = await Promise.all([
    getMentors(bidang),
    getExpertiseTags(),
    profile ? getMyMentorProfile(profile.id) : Promise.resolve(null),
    profile ? getMyRequests() : Promise.resolve([]),
  ]);

  // RLS returns both sides; split them by who owns the mentor row.
  const asMentee = requests.filter((r) => r.mentee_id === profile?.id);
  const asMentor = myMentor
    ? requests.filter((r) => r.mentor_id === myMentor.id)
    : [];

  const askedMentorIds = new Set(
    asMentee
      .filter((r) => r.status === "menunggu" || r.status === "diterima")
      .map((r) => r.mentor_id),
  );

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">
          Mentor Senpai-Kouhai
        </h1>
        <p className="mt-5 text-body text-muted-foreground">
          Anggota yang sudah lebih dulu tinggal di Jepang membantu yang baru
          datang — soal kerja, kuliah, visa, sampai urusan sehari-hari. Gratis,
          antar anggota.
        </p>
      </Reveal>

      {profile && (
        <section className="mt-10 rounded-panel border border-accent/40 bg-accent-muted/30 p-6">
          <h2 className="text-h3 text-foreground">
            {myMentor ? "Profil mentormu" : "Mau jadi senpai?"}
          </h2>
          <p className="mt-2 max-w-2xl text-body text-muted-foreground">
            {myMentor
              ? "Perbarui bidang, kuota, dan status ketersediaanmu kapan saja."
              : "Tidak perlu ahli — cukup sudah pernah melewati apa yang sedang dihadapi anggota baru."}
          </p>
          <div className="mt-5">
            <MentorProfileForm mentor={myMentor} />
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <div
          role="group"
          aria-label="Saring bidang"
          className="mt-10 flex flex-wrap gap-1.5"
        >
          <Link href="/mentorship" className={chip(!bidang)}>
            Semua bidang
          </Link>
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/mentorship?bidang=${encodeURIComponent(tag)}`}
              className={chip(bidang === tag)}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-h2 text-foreground">Mentor tersedia</h2>

        {mentors.length === 0 ? (
          <div className="mt-7">
            <EmptyState
              icon={Users}
              title="Belum ada mentor terdaftar"
              description="Belum ada anggota yang mendaftar sebagai mentor untuk bidang ini. Kalau kamu merasa bisa membantu, daftarkan dirimu di atas."
            />
          </div>
        ) : (
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <RevealItem key={mentor.id}>
                <MentorCard
                  mentor={mentor}
                  canRequest={Boolean(profile)}
                  alreadyAsked={askedMentorIds.has(mentor.id)}
                  isSelf={mentor.user_id === profile?.id}
                />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {profile && asMentor.length > 0 && (
        <section className="mt-14">
          <h2 className="text-h2 text-foreground">Permintaan masuk untukmu</h2>
          <p className="mt-2 text-body text-muted-foreground">
            {myMentor?.active_mentees ?? 0} dari {myMentor?.capacity ?? 0} kuota
            terpakai.
          </p>
          <div className="mt-7">
            <RequestList requests={asMentor} asMentor />
          </div>
        </section>
      )}

      {profile && (
        <section className="mt-14">
          <h2 className="text-h2 text-foreground">Pengajuanmu</h2>

          {asMentee.length === 0 ? (
            <div className="mt-7">
              <EmptyState
                icon={HandHeart}
                title="Kamu belum mengajukan bimbingan"
                description="Pilih mentor yang bidangnya cocok, lalu ceritakan apa yang sedang kamu hadapi."
              />
            </div>
          ) : (
            <div className="mt-7">
              <RequestList requests={asMentee} asMentor={false} />
            </div>
          )}
        </section>
      )}

      {!profile && (
        <div className="mt-12 text-center">
          <p className="text-body text-muted-foreground">
            Masuk untuk mengajukan bimbingan atau mendaftar sebagai mentor.
          </p>
          <Button asChild className="mt-4">
            <Link href="/login?next=/mentorship">Masuk</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
