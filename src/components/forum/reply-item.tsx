"use client";

import { useState } from "react";
import Link from "next/link";
import { Reply as ReplyIcon, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RichText } from "@/components/editor/rich-text";
import { VoteButtons } from "./vote-buttons";
import { ReportDialog } from "./report-dialog";
import { ReplyForm } from "./reply-form";
import { relativeTime } from "@/lib/format";
import type { ForumReply, ThreadedReply } from "@/lib/forum/types";

function ReplyBody({
  reply,
  threadId,
  path,
  votes,
  canInteract,
  isLocked,
  nested = false,
}: {
  reply: ForumReply;
  threadId: string;
  path: string;
  votes: Record<string, "up" | "down">;
  canInteract: boolean;
  isLocked: boolean;
  nested?: boolean;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex gap-3">
      <VoteButtons
        score={reply.score}
        currentVote={votes[reply.id]}
        replyId={reply.id}
        path={path}
        disabled={!canInteract}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar
            src={reply.author?.avatar_url}
            name={reply.author?.full_name ?? "Anggota"}
            size="sm"
          />
          <Link
            href={`/members/${reply.author_id}`}
            className="text-caption font-medium text-foreground transition-colors hover:text-primary"
          >
            {reply.author?.full_name ?? "Anggota UJC"}
          </Link>
          {reply.author?.is_verified && (
            <ShieldCheck className="size-3.5 text-accent" aria-label="Terverifikasi" />
          )}
          {reply.author?.role !== "member" && reply.author && (
            <Badge variant="outline">
              {reply.author.role === "admin" ? "Admin" : "Moderator"}
            </Badge>
          )}
          <span className="text-caption text-muted-foreground">
            {relativeTime(reply.created_at)}
          </span>
        </div>

        <RichText html={reply.content} className="mt-2.5" />

        <div className="mt-2 flex flex-wrap items-center gap-1">
          {canInteract && !isLocked && !nested && (
            <button
              type="button"
              onClick={() => setReplying((value) => !value)}
              className="flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-caption text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
            >
              <ReplyIcon className="size-3.5" aria-hidden />
              Balas
            </button>
          )}
          {canInteract && <ReportDialog contentType="reply" contentId={reply.id} />}
        </div>

        {replying && (
          <div className="mt-4">
            <ReplyForm
              threadId={threadId}
              parentReplyId={reply.id}
              placeholder={`Balas ${reply.author?.full_name ?? "anggota ini"}…`}
              submitLabel="Kirim"
              autoFocusKey={reply.id}
              onDone={() => setReplying(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ReplyItem({
  reply,
  threadId,
  path,
  votes,
  canInteract,
  isLocked,
}: {
  reply: ThreadedReply;
  threadId: string;
  path: string;
  votes: Record<string, "up" | "down">;
  canInteract: boolean;
  isLocked: boolean;
}) {
  return (
    <li className="rounded-card border border-border bg-surface p-5">
      <ReplyBody
        reply={reply}
        threadId={threadId}
        path={path}
        votes={votes}
        canInteract={canInteract}
        isLocked={isLocked}
      />

      {reply.children.length > 0 && (
        <ul className="mt-5 space-y-5 border-l-2 border-border pl-5">
          {reply.children.map((child) => (
            <li key={child.id}>
              <ReplyBody
                reply={child}
                threadId={threadId}
                path={path}
                votes={votes}
                canInteract={canInteract}
                isLocked={isLocked}
                nested
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
