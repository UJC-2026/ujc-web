import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, TriangleAlert } from "lucide-react";
import { getAttempt, getAttemptQuestions, getCbtCategory } from "@/lib/cbt/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { startAttempt } from "../actions";
import { TestRunner } from "@/components/cbt/test-runner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string; error?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { testId } = await params;
  const category = await getCbtCategory(testId);

  if (!category) return { title: "Tes tidak ditemukan" };
  return { title: `${category.name} · Latihan CBT` };
}

export default async function TestPage({ params, searchParams }: PageProps) {
  const { testId } = await params;
  const { attempt: attemptId, error } = await searchParams;

  const [category, profile] = await Promise.all([
    getCbtCategory(testId),
    getCurrentProfile(),
  ]);

  if (!category) notFound();

  // With an attempt id in the URL, this page becomes the test itself.
  if (attemptId && profile) {
    const attempt = await getAttempt(attemptId);

    if (!attempt || attempt.category_id !== category.id) notFound();

    if (attempt.finished_at) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <h1 className="text-h2 text-foreground">{category.name}</h1>
          <p className="mt-4 text-body text-muted-foreground">
            Percobaan ini sudah kamu kumpulkan.
          </p>
          <Button asChild className="mt-5">
            <Link href={`/cbt/${category.id}/result?attempt=${attempt.id}`}>
              Lihat hasil &amp; pembahasan
            </Link>
          </Button>
        </div>
      );
    }

    const questions = await getAttemptQuestions(attempt.id);

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
          <Link href="/cbt" className="transition-colors hover:text-primary">
            Latihan CBT
          </Link>
        </nav>

        <h1 className="mt-4 text-h2 text-foreground">{category.name}</h1>
        <p className="mt-2 text-caption text-muted-foreground">
          {questions.length} soal · {category.duration_minutes} menit. Waktu
          dihitung sejak kamu memulai, jadi memuat ulang halaman tidak menambah
          waktu.
        </p>

        <div className="mt-8">
          <TestRunner
            attemptId={attempt.id}
            categoryId={category.id}
            questions={questions}
            durationMinutes={category.duration_minutes}
            startedAt={attempt.started_at}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/cbt" className="transition-colors hover:text-primary">
          Latihan CBT
        </Link>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge variant="primary">{category.type.toUpperCase()}</Badge>
        {category.level && <Badge variant="outline">{category.level}</Badge>}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{category.name}</h1>
      {category.description && (
        <p className="mt-5 text-body text-muted-foreground">
          {category.description}
        </p>
      )}

      <dl className="mt-8 grid gap-4 rounded-panel border border-border bg-surface p-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Jumlah soal</dt>
            <dd className="text-body text-foreground">
              {category.questionCount}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Waktu</dt>
            <dd className="text-body text-foreground">
              {category.duration_minutes} menit
            </dd>
          </div>
        </div>
      </dl>

      {error === "mulai" && (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Tes gagal dimulai. Mungkin bank soalnya sedang kosong — coba lagi
          nanti.
        </p>
      )}

      <div className="mt-8">
        {!profile ? (
          <>
            <p className="text-body text-muted-foreground">
              Masuk dulu untuk mengerjakan latihan.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/login?next=/cbt/${category.id}`}>Masuk</Link>
            </Button>
          </>
        ) : category.questionCount === 0 ? (
          <p className="text-body text-muted-foreground">
            Bank soal kategori ini masih kosong.
          </p>
        ) : (
          <form action={startAttempt}>
            <input type="hidden" name="categoryId" value={category.id} />
            <Button type="submit">Mulai kerjakan</Button>
            <p className="mt-3 text-caption text-muted-foreground">
              Timer mulai berjalan begitu kamu menekan tombol ini.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
