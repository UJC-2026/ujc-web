import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Lock, MessageSquare, Pin, ShieldCheck } from "lucide-react";
import {
  getCategoryBySlug,
  getThreadById,
  getThreadReplies,
  getUserVotes,
} from "@/lib/forum/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { richTextToPlain } from "@/lib/sanitize";
import { relativeTime, formatDateTimeID } from "@/lib/format";
import { RichText } from "@/components/editor/rich-text";
import { VoteButtons } from "@/components/forum/vote-buttons";
import { ReportDialog } from "@/components/forum/report-dialog";
import { ReplyForm } from "@/components/forum/reply-form";
import { ReplyItem } from "@/components/forum/reply-item";
import { PinButton } from "@/components/forum/pin-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type PageProps = {
  params: Promise<{ category: string; threadId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { threadId } = await params;
  const thread = await getThreadById(threadId);

  if (!thread) return { title: "Thread tidak ditemukan" };

  const description = richTextToPlain(thread.content, 155);

  return {
    title: thread.title,
    description,
    openGraph: {
      type: "article",
      title: thread.title,
      description,
      publishedTime: thread.created_at,
      authors: thread.author ? [thread.author.full_name] : undefined,
    },
  };
}

export default async function ThreadPage({ params }: PageProps) {
  const { category: slug, threadId } = await params;

  const [category, thread, profile] = await Promise.all([
    getCategoryBySlug(slug),
    getThreadById(threadId),
    getCurrentProfile(),
  ]);

  if (!category || !thread || thread.category_id !== category.id) notFound();

  const replies = await getThreadReplies(thread.id);

  const replyIds = replies.flatMap((reply) => [
    reply.id,
    ...reply.children.map((child) => child.id),
  ]);

  const votes = profile
    ? await getUserVotes(profile.id, thread.id, replyIds)
    : {};

  // Fire-and-forget: a failed counter must never break the page.
  const supabase = await createClient();
  void supabase.rpc("increment_thread_views", { target: thread.id });

  const path = `/forum/${category.slug}/${thread.id}`;
  const canModerate =
    profile?.role === "admin" || profile?.role === "moderator";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/forum" className="transition-colors hover:text-primary">
          Forum
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/forum/${category.slug}`}
          className="transition-colors hover:text-primary"
        >
          {category.name}
        </Link>
      </nav>

      <article className="mt-5 rounded-panel border border-border bg-surface p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {thread.is_pinned && (
            <Badge variant="accent">
              <Pin aria-hidden />
              Disematkan
            </Badge>
          )}
          {thread.is_locked && (
            <Badge variant="outline">
              <Lock aria-hidden />
              Dikunci
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-h1 text-foreground">{thread.title}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Avatar
            src={thread.author?.avatar_url}
            name={thread.author?.full_name ?? "Anggota"}
            size="md"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/members/${thread.author_id}`}
                className="text-caption font-medium text-foreground transition-colors hover:text-primary"
              >
                {thread.author?.full_name ?? "Anggota UJC"}
              </Link>
              {thread.author?.is_verified && (
                <ShieldCheck
                  className="size-3.5 text-accent"
                  aria-label="Terverifikasi"
                />
              )}
            </div>
            <time
              dateTime={thread.created_at}
              title={formatDateTimeID(thread.created_at)}
              className="text-caption text-muted-foreground"
            >
              {relativeTime(thread.created_at)}
            </time>
          </div>
        </div>

        <RichText html={thread.content} className="mt-6" />

        {thread.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-1.5">
            {thread.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline">#{tag}</Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-border pt-5">
          <VoteButtons
            score={thread.score}
            currentVote={votes[thread.id]}
            threadId={thread.id}
            path={path}
            orientation="horizontal"
            disabled={!profile}
          />

          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <MessageSquare className="size-4" aria-hidden />
            {thread.reply_count} balasan
          </span>
          <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Eye className="size-4" aria-hidden />
            {thread.view_count} dilihat
          </span>

          <div className="ml-auto flex items-center gap-1">
            {canModerate && (
              <PinButton
                threadId={thread.id}
                pinned={thread.is_pinned}
                path={path}
              />
            )}
            {profile && <ReportDialog contentType="thread" contentId={thread.id} />}
          </div>
        </div>
      </article>

      <section className="mt-10">
        <h2 className="rule-gold text-h3 text-foreground">
          {thread.reply_count} balasan
        </h2>

        {replies.length === 0 ? (
          <div className="mt-7">
            <EmptyState
              icon={MessageSquare}
              title="Belum ada balasan"
              description="Jadi yang pertama membantu menjawab — jawabanmu mungkin juga berguna buat anggota lain."
            />
          </div>
        ) : (
          <ul className="mt-7 space-y-4">
            {replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                threadId={thread.id}
                path={path}
                votes={votes}
                canInteract={Boolean(profile)}
                isLocked={thread.is_locked}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-panel border border-border bg-surface p-6">
        {!profile ? (
          <div className="text-center">
            <p className="text-body text-muted-foreground">
              Masuk dulu untuk ikut berdiskusi.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/login?next=${path}`}>Masuk</Link>
            </Button>
          </div>
        ) : thread.is_locked ? (
          <p className="text-center text-body text-muted-foreground">
            Thread ini sudah dikunci moderator, jadi tidak menerima balasan baru.
          </p>
        ) : (
          <>
            <h2 className="text-h3 text-foreground">Tulis balasan</h2>
            <div className="mt-5">
              <ReplyForm threadId={thread.id} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
