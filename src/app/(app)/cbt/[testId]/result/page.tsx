import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { getAttempt, getAttemptReview, getCbtCategory } from "@/lib/cbt/queries";
import { requireProfile } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeID } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

export const metadata: Metadata = {
  title: "Hasil latihan",
  robots: { index: false },
};

export default async function ResultPage({ params, searchParams }: PageProps) {
  await requireProfile();

  const [{ testId }, { attempt: attemptId }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!attemptId) redirect(`/cbt/${testId}`);

  const [category, attempt] = await Promise.all([
    getCbtCategory(testId),
    getAttempt(attemptId),
  ]);

  if (!category || !attempt || attempt.category_id !== category.id) notFound();
  if (!attempt.finished_at) redirect(`/cbt/${testId}?attempt=${attemptId}`);

  const review = await getAttemptReview(attempt.id);

  const score = attempt.score ?? 0;
  const total = attempt.total_questions ?? review.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/cbt" className="transition-colors hover:text-primary">
          Latihan CBT
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/cbt/${category.id}`}
          className="transition-colors hover:text-primary"
        >
          {category.name}
        </Link>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">Hasil latihan</h1>

      <section className="mt-8 rounded-panel border border-border bg-surface p-6">
        <p className="text-caption text-muted-foreground">Skor kamu</p>
        <p className="mt-1 text-h1 font-semibold tabular-nums text-foreground">
          {score}
          <span className="text-muted-foreground">/{total}</span>
          <span className="ml-3 text-h3 text-accent">{pct}%</span>
        </p>

        <div
          className="mt-4 h-2.5 overflow-hidden rounded-pill bg-surface-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Skor ${pct} persen`}
        >
          <span
            className="block h-full rounded-pill bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-3 text-caption text-muted-foreground">
          Dikumpulkan {formatDateTimeID(attempt.finished_at)}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/cbt/${category.id}`}>Coba lagi</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/cbt">Kembali ke daftar</Link>
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="rule-gold text-h3 text-foreground">Pembahasan</h2>

        <ol className="mt-7 space-y-5">
          {review.map((row, index) => (
            <li
              key={row.question_id}
              className={cn(
                "rounded-card border bg-surface p-5",
                row.is_correct ? "border-success/40" : "border-danger/40",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill",
                    row.is_correct
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger",
                  )}
                >
                  {row.is_correct ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <X className="size-3.5" aria-hidden />
                  )}
                  <span className="sr-only">
                    {row.is_correct ? "Benar" : "Salah"}
                  </span>
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-foreground">
                    <span className="text-muted-foreground">{index + 1}.</span>{" "}
                    {row.question}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {row.options.map((option) => {
                      const isKey = option === row.correct_answer;
                      const isPicked = option === row.selected_answer;

                      return (
                        <li
                          key={option}
                          className={cn(
                            "flex flex-wrap items-center gap-2 rounded-field border px-3.5 py-2 text-body",
                            isKey
                              ? "border-success/50 text-foreground"
                              : isPicked
                                ? "border-danger/50 text-foreground"
                                : "border-border text-muted-foreground",
                          )}
                        >
                          {option}
                          {isKey && <Badge variant="success">Kunci</Badge>}
                          {isPicked && !isKey && (
                            <Badge variant="danger">Jawabanmu</Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {!row.selected_answer && (
                    <p className="mt-2 text-caption text-muted-foreground">
                      Kamu tidak menjawab soal ini.
                    </p>
                  )}

                  {row.explanation && (
                    <p className="mt-3 rounded-field bg-surface-muted px-3.5 py-3 text-caption text-muted-foreground">
                      {row.explanation}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
