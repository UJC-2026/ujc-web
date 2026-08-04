import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT } from "@/lib/assistant/prompt";

/** Keeps one exchange bounded; the daily quota bounds the rest. */
const MAX_TURNS = 20;

const bodySchema = z.object({
  sessionId: z.uuid(),
  message: z.string().trim().min(1).max(2000),
});

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!env.ANTHROPIC_API_KEY) {
    return fail("Asisten belum dikonfigurasi di server ini.", 503);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Masuk dulu untuk memakai asisten.", 401);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Pesan tidak valid.", 400);

  const { sessionId, message } = parsed.data;

  // RLS scopes this to the caller's own session, so a forged id finds nothing.
  const { data: session } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return fail("Percakapan tidak ditemukan.", 404);

  // Claim quota before spending anything. The ceiling is enforced inside the
  // database (migration 0025), not here — this route is not the only way to
  // reach the table.
  const { error: quotaError } = await supabase.rpc("ai_claim_quota");
  if (quotaError) {
    const known = quotaError.message.startsWith("Kuota harian");
    return fail(
      known ? quotaError.message : "Gagal memeriksa kuota. Coba lagi.",
      known ? 429 : 500,
    );
  }

  const { data: history } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(MAX_TURNS);

  await supabase.from("ai_chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: message,
  });

  const messages: Anthropic.MessageParam[] = [
    ...(history ?? []).map((row) => ({
      role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: row.content as string,
    })),
    { role: "user", content: message },
  ];

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        // Streamed because a long answer would otherwise sit behind a request
        // timeout with nothing on screen. Low effort: these are short
        // conversational answers, and latency is what members feel.
        const reply = client.messages.stream({
          model: "claude-opus-5",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          thinking: { type: "adaptive" },
          output_config: { effort: "low" },
          messages,
        });

        reply.on("text", (delta) => {
          full += delta;
          controller.enqueue(encoder.encode(delta));
        });

        await reply.finalMessage();
      } catch {
        const notice =
          "\n\nMaaf, jawabannya terputus. Coba kirim ulang pertanyaanmu.";
        full += notice;
        controller.enqueue(encoder.encode(notice));
      } finally {
        // Persist whatever was produced — a truncated answer the member can
        // see is more useful than a conversation with a gap in it.
        if (full.trim()) {
          await supabase.from("ai_chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: full,
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
