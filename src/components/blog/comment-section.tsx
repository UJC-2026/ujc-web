"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { addComment } from "@/app/(app)/blog/actions";
import { relativeTime } from "@/lib/format";
import type { BlogComment } from "@/lib/blog/queries";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {pending ? "Mengirim…" : "Kirim komentar"}
    </Button>
  );
}

export function CommentSection({
  postId,
  slug,
  comments,
  canComment,
}: {
  postId: string;
  slug: string;
  comments: BlogComment[];
  canComment: boolean;
}) {
  const [error, setError] = useState<string>();
  const [key, setKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    const result = await addComment({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setKey((value) => value + 1);
    toast.success(result.success);
  }

  return (
    <section className="mt-12">
      <h2 className="rule-gold flex items-center gap-2 text-h3 text-foreground">
        <MessageSquare className="size-5 text-muted-foreground" aria-hidden />
        {comments.length} komentar
      </h2>

      {comments.length > 0 && (
        <ul className="mt-7 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <Avatar
                  src={comment.author?.avatar_url}
                  name={comment.author?.full_name ?? "Anggota"}
                  size="sm"
                />
                <Link
                  href={`/members/${comment.author_id}`}
                  className="text-caption font-medium text-foreground transition-colors hover:text-primary"
                >
                  {comment.author?.full_name ?? "Anggota UJC"}
                </Link>
                <span className="text-caption text-muted-foreground">
                  {relativeTime(comment.created_at)}
                </span>
              </div>
              <p className="mt-2.5 text-body whitespace-pre-line text-muted-foreground">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7">
        {canComment ? (
          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="slug" value={slug} />

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Textarea
              key={key}
              name="content"
              rows={3}
              required
              minLength={2}
              maxLength={2000}
              placeholder="Tulis komentarmu…"
              aria-label="Tulis komentar"
            />
            <SubmitButton />
          </form>
        ) : (
          <p className="text-body text-muted-foreground">
            <Link href={`/login?next=/blog/${slug}`} className="text-primary hover:underline">
              Masuk
            </Link>{" "}
            untuk ikut berkomentar.
          </p>
        )}
      </div>
    </section>
  );
}
