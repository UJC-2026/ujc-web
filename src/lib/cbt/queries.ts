import { createClient } from "@/lib/supabase/server";

export type CbtCategory = {
  id: string;
  name: string;
  type: "jlpt" | "ssw";
  level: string | null;
  description: string | null;
  duration_minutes: number;
  is_published: boolean;
  questionCount: number;
};

export async function getCbtCategories(): Promise<CbtCategory[]> {
  const supabase = await createClient();

  const [categories, counts] = await Promise.all([
    supabase
      .from("cbt_test_categories")
      .select("id, name, type, level, description, duration_minutes, is_published")
      .order("type")
      .order("level"),
    supabase.rpc("cbt_category_counts"),
  ]);

  const byCategory = new Map<string, number>();
  for (const row of counts.data ?? []) {
    byCategory.set(row.category_id as string, Number(row.question_count ?? 0));
  }

  return (categories.data ?? []).map((row) => ({
    ...(row as Omit<CbtCategory, "questionCount">),
    questionCount: byCategory.get(row.id as string) ?? 0,
  }));
}

export async function getCbtCategory(id: string): Promise<CbtCategory | null> {
  const all = await getCbtCategories();
  return all.find((category) => category.id === id) ?? null;
}

export type CbtQuestion = {
  id: string;
  question: string;
  options: string[];
  sort_order: number;
};

export async function getAttemptQuestions(
  attemptId: string,
): Promise<CbtQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("cbt_attempt_questions", {
    p_attempt: attemptId,
  });
  return (data as CbtQuestion[] | null) ?? [];
}

export type CbtReviewRow = {
  question_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  selected_answer: string | null;
  is_correct: boolean | null;
};

export async function getAttemptReview(
  attemptId: string,
): Promise<CbtReviewRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("cbt_attempt_review", {
    p_attempt: attemptId,
  });
  return (data as CbtReviewRow[] | null) ?? [];
}

export type CbtAttempt = {
  id: string;
  category_id: string;
  score: number | null;
  total_questions: number | null;
  started_at: string;
  finished_at: string | null;
  category: { name: string; level: string | null } | null;
};

export async function getAttempt(id: string): Promise<CbtAttempt | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cbt_attempts")
    .select(
      "id, category_id, score, total_questions, started_at, finished_at, category:cbt_test_categories(name, level)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const category = Array.isArray(data.category) ? data.category[0] : data.category;
  return { ...(data as unknown as CbtAttempt), category: category ?? null };
}

/** The signed-in member's finished attempts, newest first. */
export async function getMyAttempts(userId: string): Promise<CbtAttempt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cbt_attempts")
    .select(
      "id, category_id, score, total_questions, started_at, finished_at, category:cbt_test_categories(name, level)",
    )
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    return { ...(row as unknown as CbtAttempt), category: category ?? null };
  });
}
