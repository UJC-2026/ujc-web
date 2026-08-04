import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getConversation, isBlocked } from "@/lib/messages/queries";
import { requireProfile } from "@/lib/auth/session";
import { MessageThread } from "@/components/messages/message-thread";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toggleBlock } from "../actions";

export const metadata: Metadata = {
  title: "Percakapan",
  robots: { index: false },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, profile] = await Promise.all([params, requireProfile()]);

  const conversation = await getConversation(id, profile.id);
  // RLS returns nothing when the caller is not a participant.
  if (!conversation) notFound();

  const blocked = conversation.other
    ? await isBlocked(profile.id, conversation.other.id)
    : false;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1.5 text-caption text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Semua pesan
      </Link>

      <header className="mt-5 flex flex-wrap items-center gap-3 border-b border-border pb-5">
        <Avatar
          src={conversation.other?.avatar_url}
          name={conversation.other?.full_name ?? "Anggota"}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h3 text-foreground">
            {conversation.other?.full_name ?? "Anggota UJC"}
          </h1>
          {blocked && <Badge variant="danger">Kamu memblokir anggota ini</Badge>}
        </div>

        {conversation.other && (
          <form action={toggleBlock}>
            <input type="hidden" name="otherId" value={conversation.other.id} />
            <input type="hidden" name="blocked" value={String(blocked)} />
            <button
              type="submit"
              className="rounded-field border border-border px-3 py-2 text-caption text-muted-foreground transition-colors hover:border-danger hover:text-danger"
            >
              {blocked ? "Buka blokir" : "Blokir"}
            </button>
          </form>
        )}
      </header>

      <MessageThread
        conversationId={id}
        messages={conversation.messages}
        meId={profile.id}
        blocked={blocked}
      />
    </div>
  );
}
