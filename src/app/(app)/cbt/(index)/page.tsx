import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, History } from "lucide-react";
import { getCbtCategories, getMyAttempts } from "@/lib/cbt/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { formatDateTimeID } from "@/lib/format";

export const metadata: Metadata = {
  title: "Latihan CBT",
  description:
    "Latihan ujian berbasis komputer untuk JLPT dan SSW — dengan timer, skor otomatis, dan pembahasan soal.",
};

export default async function CbtPage() {
  const profile = await getCurrentProfile();
  const [categories, attempts] = await Promise.all([
    getCbtCategories(),
    profile ? getMyAttempts(profile.id) : Promise.resolve([]),
  ]);

  const ready = categories.filter((category) => category.questionCount > 0);
  const empty = categories.filter((category) => category.questionCount === 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">Latihan CBT</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Latihan ujian JLPT dan SSW dengan timer dan penilaian otomatis.
          Pembahasan muncul setelah kamu mengumpulkan jawaban.
        </p>
      </Reveal>

      {ready.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={BookOpen}
            title="Bank soal masih kosong"
            description="Divisi Pendidikan belum mengisi soal untuk kategori mana pun. Nantikan, ya."
          />
        </div>
      ) : (
        <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((category) => (
            <RevealItem key={category.id}>
              <Link href={`/cbt/${category.id}`} className="block h-full">
                <Card interactive className="h-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="primary">
                      {category.type.toUpperCase()}
                    </Badge>
                    {category.level && (
                      <Badge variant="outline">{category.level}</Badge>
                    )}
                  </div>

                  <CardTitle className="mt-3">{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription className="mt-2 text-body">
                      {category.description}
                    </CardDescription>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-4" aria-hidden />
                      {category.questionCount} soal
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4" aria-hidden />
                      {category.duration_minutes} menit
                    </span>
                  </div>
                </Card>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      )}

      {empty.length > 0 && (
        <p className="mt-6 text-caption text-muted-foreground">
          Belum tersedia:{" "}
          {empty.map((category) => category.name).join(", ")} — bank soalnya
          masih disusun.
        </p>
      )}

      {profile && (
        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-h2 text-foreground">
            <History className="size-6 text-muted-foreground" aria-hidden />
            Riwayat hasilmu
          </h2>

          {attempts.length === 0 ? (
            <p className="mt-5 text-body text-muted-foreground">
              Kamu belum pernah menyelesaikan latihan. Pilih satu kategori di
              atas untuk mulai.
            </p>
          ) : (
            <ul className="mt-5 space-y-2.5">
              {attempts.map((attempt) => {
                const pct =
                  attempt.total_questions && attempt.score !== null
                    ? Math.round((attempt.score / attempt.total_questions) * 100)
                    : null;

                return (
                  <li
                    key={attempt.id}
                    className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/cbt/${attempt.category_id}/result?attempt=${attempt.id}`}
                        className="text-body font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {attempt.category?.name ?? "Latihan"}
                      </Link>
                      <p className="text-caption text-muted-foreground">
                        {attempt.finished_at &&
                          formatDateTimeID(attempt.finished_at)}
                      </p>
                    </div>
                    <span className="text-body font-medium tabular-nums text-foreground">
                      {attempt.score}/{attempt.total_questions}
                      {pct !== null && (
                        <span className="ml-1.5 text-caption text-muted-foreground">
                          ({pct}%)
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
