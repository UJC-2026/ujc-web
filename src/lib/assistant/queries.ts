import { createClient } from "@/lib/supabase/server";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type ChatSession = {
  id: string;
  title: string | null;
  created_at: string;
};

/** RLS scopes every row here to the signed-in member. */
export async function getSessions(): Promise<ChatSession[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_chat_sessions")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (data as ChatSession[] | null) ?? [];
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (data as ChatMessage[] | null) ?? [];
}

export async function getQuota(): Promise<{ used: number; quota: number }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ai_quota_status");
  const row = Array.isArray(data) ? data[0] : data;
  return { used: row?.used ?? 0, quota: row?.quota ?? 0 };
}
