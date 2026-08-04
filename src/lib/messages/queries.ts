import { createClient } from "@/lib/supabase/server";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  other: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  lastMessage: Message | null;
  unread: number;
};

/**
 * RLS already limits every table here to conversations the caller belongs to,
 * so this assembles the list without needing its own ownership filters.
 */
export async function getConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, profile:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url)");

  if (!memberships || memberships.length === 0) return [];

  const ids = [
    ...new Set(memberships.map((row) => row.conversation_id as string)),
  ];

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, read_at, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  const lastByConv = new Map<string, Message>();
  const unreadByConv = new Map<string, number>();

  for (const row of (messages ?? []) as Message[]) {
    if (!lastByConv.has(row.conversation_id)) {
      lastByConv.set(row.conversation_id, row);
    }
    if (row.sender_id !== userId && row.read_at === null) {
      unreadByConv.set(
        row.conversation_id,
        (unreadByConv.get(row.conversation_id) ?? 0) + 1,
      );
    }
  }

  const otherByConv = new Map<string, ConversationSummary["other"]>();
  for (const row of memberships) {
    if (row.user_id === userId) continue;
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    otherByConv.set(
      row.conversation_id as string,
      (profile as ConversationSummary["other"]) ?? null,
    );
  }

  return ids
    .map((id) => ({
      id,
      other: otherByConv.get(id) ?? null,
      lastMessage: lastByConv.get(id) ?? null,
      unread: unreadByConv.get(id) ?? 0,
    }))
    .sort((a, b) => {
      const at = a.lastMessage?.created_at ?? "";
      const bt = b.lastMessage?.created_at ?? "";
      return bt.localeCompare(at);
    });
}

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<{
  messages: Message[];
  other: ConversationSummary["other"];
} | null> {
  const supabase = await createClient();

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id, profile:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId);

  // RLS returns nothing when the caller is not a participant.
  if (!participants || participants.length === 0) return null;

  const otherRow = participants.find((row) => row.user_id !== userId);
  const profile = otherRow
    ? Array.isArray(otherRow.profile)
      ? otherRow.profile[0]
      : otherRow.profile
    : null;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return {
    messages: (messages as Message[] | null) ?? [],
    other: (profile as ConversationSummary["other"]) ?? null,
  };
}

export async function isBlocked(
  userId: string,
  otherId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_id", userId)
    .eq("blocked_id", otherId)
    .maybeSingle();

  return Boolean(data);
}
