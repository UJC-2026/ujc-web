import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getConversations } from "@/lib/messages/queries";
import { requireProfile } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Pesan", robots: { index: false } };

export default async function MessagesPage() {
  const profile = await requireProfile();
  const conversations = await getConversations(profile.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="rule-gold text-h1 text-foreground">Pesan</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Percakapan pribadimu dengan anggota lain.
      </p>

      {conversations.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={MessageSquare}
            title="Belum ada percakapan"
            description="Buka profil anggota lain lalu kirim pesan untuk memulai percakapan pertamamu."
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-2.5">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent"
              >
                <Avatar
                  src={conversation.other?.avatar_url}
                  name={conversation.other?.full_name ?? "Anggota"}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-body font-medium text-foreground">
                      {conversation.other?.full_name ?? "Anggota UJC"}
                    </p>
                    {conversation.unread > 0 && (
                      <Badge variant="primary">{conversation.unread} baru</Badge>
                    )}
                  </div>
                  <p className="truncate text-caption text-muted-foreground">
                    {conversation.lastMessage
                      ? `${conversation.lastMessage.sender_id === profile.id ? "Kamu: " : ""}${conversation.lastMessage.content}`
                      : "Belum ada pesan"}
                  </p>
                </div>
                {conversation.lastMessage && (
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {relativeTime(conversation.lastMessage.created_at)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
