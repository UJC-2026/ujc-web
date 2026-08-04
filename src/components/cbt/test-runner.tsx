"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitAttempt } from "@/app/(app)/cbt/actions";
import type { CbtQuestion } from "@/lib/cbt/queries";
import { cn } from "@/lib/utils";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Mengumpulkan…" : label}
    </Button>
  );
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TestRunner({
  attemptId,
  categoryId,
  questions,
  durationMinutes,
  startedAt,
}: {
  attemptId: string;
  categoryId: string;
  questions: CbtQuestion[];
  durationMinutes: number;
  startedAt: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [left, setLeft] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  // Remaining time is derived from the server's started_at, so reloading the
  // page cannot buy extra minutes.
  useEffect(() => {
    const deadline =
      new Date(startedAt).getTime() + durationMinutes * 60_000;

    const tick = () => {
      const seconds = Math.max(
        0,
        Math.round((deadline - Date.now()) / 1000),
      );
      setLeft(seconds);

      if (seconds === 0 && !submitted.current) {
        submitted.current = true;
        formRef.current?.requestSubmit();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMinutes]);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      const result = await submitAttempt({}, formData);
      // A successful submit redirects, so anything returned is a failure.
      if (result?.error) {
        submitted.current = false;
        setError(result.error);
      }
    },
    [],
  );

  const answered = Object.keys(answers).length;

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />

      <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-surface/95 px-5 py-3.5 backdrop-blur">
        <p className="text-caption text-muted-foreground">
          Terjawab{" "}
          <span className="font-medium text-foreground">
            {answered}/{questions.length}
          </span>
        </p>
        <p
          className={cn(
            "flex items-center gap-1.5 text-body font-semibold tabular-nums",
            left !== null && left <= 60 ? "text-danger" : "text-foreground",
          )}
          aria-live="polite"
        >
          <Clock className="size-4" aria-hidden />
          {left === null ? "--:--" : formatClock(left)}
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <ol className="space-y-5">
        {questions.map((question, index) => (
          <li
            key={question.id}
            className="rounded-card border border-border bg-surface p-5"
          >
            <fieldset>
              <legend className="text-body font-medium text-foreground">
                <span className="text-muted-foreground">{index + 1}.</span>{" "}
                {question.question}
              </legend>

              <div className="mt-4 space-y-2">
                {question.options.map((option) => {
                  const id = `${question.id}-${option}`;
                  const checked = answers[question.id] === option;

                  return (
                    <label
                      key={option}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-field border px-4 py-3 text-body transition-colors",
                        checked
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
                      )}
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`q-${question.id}`}
                        value={option}
                        checked={checked}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: option,
                          }))
                        }
                        className="size-4 accent-[var(--primary)]"
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label="Kumpulkan jawaban" />
        {answered < questions.length && (
          <p className="text-caption text-muted-foreground">
            Masih ada {questions.length - answered} soal belum dijawab — boleh
            dikumpulkan, tapi yang kosong dihitung salah.
          </p>
        )}
      </div>
    </form>
  );
}
