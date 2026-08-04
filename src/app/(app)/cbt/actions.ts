"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CbtState = { error?: string };

export async function startAttempt(formData: FormData): Promise<void> {
  const categoryId = String(formData.get("categoryId"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/cbt/${categoryId}`);

  const { data, error } = await supabase.rpc("cbt_start_attempt", {
    p_category: categoryId,
  });

  if (error || !data) redirect(`/cbt/${categoryId}?error=mulai`);

  redirect(`/cbt/${categoryId}?attempt=${data}`);
}

const submitSchema = z.object({
  attemptId: z.uuid(),
  categoryId: z.uuid(),
  answers: z.record(z.string(), z.string()),
});

/**
 * Only the member's choices are sent; grading happens inside the database
 * against a key the client never received.
 */
export async function submitAttempt(
  _prev: CbtState,
  formData: FormData,
): Promise<CbtState> {
  let answers: Record<string, string>;
  try {
    answers = JSON.parse(String(formData.get("answers") ?? "{}"));
  } catch {
    return { error: "Jawaban tidak terbaca. Coba kirim ulang." };
  }

  const parsed = submitSchema.safeParse({
    attemptId: formData.get("attemptId"),
    categoryId: formData.get("categoryId"),
    answers,
  });

  if (!parsed.success) return { error: "Data pengerjaan tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cbt_submit_attempt", {
    p_attempt: parsed.data.attemptId,
    p_answers: parsed.data.answers,
  });

  if (error) {
    return {
      error: error.message.includes("sudah dikumpulkan")
        ? "Tes ini sudah dikumpulkan sebelumnya."
        : "Jawaban gagal dikumpulkan. Coba lagi.",
    };
  }

  revalidatePath("/cbt");
  redirect(
    `/cbt/${parsed.data.categoryId}/result?attempt=${parsed.data.attemptId}`,
  );
}
