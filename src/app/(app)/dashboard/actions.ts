"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPengurusRoles } from "@/lib/auth/session";
import {
  academicReminderSchema,
  boardPostSchema,
  boardReplySchema,
  calendarEntrySchema,
  cashSchema,
  contentSlotSchema,
  noteSchema,
  programSchema,
  taskSchema,
  taskStatusSchema,
} from "@/lib/validations/dashboard";

export type DashboardState = { error?: string; success?: string };

/**
 * RLS is the real gate for every write below. These checks exist to turn a
 * silent policy rejection into a sentence the user can act on.
 */
async function currentPengurus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, roles: [] as string[], isAdmin: false };
  }

  const [roles, profile] = await Promise.all([
    getPengurusRoles(user.id),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);

  return {
    supabase,
    user,
    roles: roles as string[],
    isAdmin: profile.data?.role === "admin",
  };
}

export async function createProgram(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = programSchema.safeParse({
    divisi: formData.get("divisi"),
    title: formData.get("title"),
    description: formData.get("description"),
    target: formData.get("target"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    budget: formData.get("budget"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa membuat proker." };
  }

  const { error } = await supabase.from("programs").insert({
    divisi: parsed.data.divisi,
    title: parsed.data.title,
    description: parsed.data.description,
    target: parsed.data.target,
    start_date: parsed.data.startDate,
    end_date: parsed.data.endDate,
    budget: parsed.data.budget,
    status: parsed.data.status,
    pic_id: user.id,
  });

  if (error) {
    return { error: "Proker gagal disimpan. Pastikan kamu pengurus divisi ini." };
  }

  await supabase.rpc("log_audit", {
    p_action: "proker.buat",
    p_target_type: "program",
    p_metadata: { divisi: parsed.data.divisi, title: parsed.data.title },
  });

  revalidatePath("/dashboard");
  return { success: "Program kerja tersimpan." };
}

export async function createTask(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    programId: formData.get("programId"),
    assignedTo: formData.get("assignedTo"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0) {
    return { error: "Hanya pengurus yang bisa membuat tugas." };
  }

  const { error } = await supabase.from("tasks").insert({
    title: parsed.data.title,
    description: parsed.data.description,
    program_id: parsed.data.programId,
    assigned_to: parsed.data.assignedTo,
    created_by: user.id,
    due_date: parsed.data.dueDate,
    priority: parsed.data.priority,
  });

  if (error) return { error: "Tugas gagal disimpan. Coba lagi sebentar lagi." };

  // The assignee is notified by a database trigger (migration 0022).

  revalidatePath("/dashboard");
  return { success: "Tugas dibuat dan penanggung jawabnya diberi tahu." };
}

export async function updateTaskStatus(
  formData: FormData,
): Promise<void> {
  const parsed = taskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.taskId);

  revalidatePath("/dashboard");
}

export async function createMeetingNote(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = noteSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    meetingDate: formData.get("meetingDate"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa menambah notulen." };
  }

  const { error } = await supabase.from("meeting_notes").insert({
    title: parsed.data.title,
    content: parsed.data.content,
    meeting_date: parsed.data.meetingDate,
    created_by: user.id,
  });

  if (error) return { error: "Notulen gagal disimpan. Coba lagi." };

  await supabase.rpc("log_audit", {
    p_action: "notulen.buat",
    p_target_type: "meeting_note",
    p_metadata: { title: parsed.data.title },
  });

  revalidatePath("/dashboard");
  return { success: "Notulen tersimpan." };
}

export async function createContentSlot(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = contentSlotSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    scheduledAt: formData.get("scheduledAt"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa menjadwalkan konten." };
  }

  const { error } = await supabase.from("content_calendar").insert({
    title: parsed.data.title,
    type: parsed.data.type,
    scheduled_at: new Date(parsed.data.scheduledAt).toISOString(),
    status: parsed.data.status,
    assigned_to: user.id,
  });

  if (error) return { error: "Jadwal konten gagal disimpan. Coba lagi." };

  await supabase.rpc("log_audit", {
    p_action: "konten.jadwalkan",
    p_target_type: "content_calendar",
    p_metadata: { title: parsed.data.title },
  });

  revalidatePath("/dashboard");
  return { success: "Jadwal konten tersimpan." };
}

export async function createBoardPost(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = boardPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    isPinned: formData.get("isPinned") ?? "false",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa menulis di papan internal." };
  }

  const { error } = await supabase.from("internal_board").insert({
    title: parsed.data.title,
    content: parsed.data.content,
    is_pinned: parsed.data.isPinned === "true",
    author_id: user.id,
  });

  if (error) return { error: "Pesan gagal dikirim. Coba lagi sebentar lagi." };

  revalidatePath("/dashboard");
  return { success: "Pesan terkirim ke papan internal." };
}

export async function createBoardReply(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = boardReplySchema.safeParse({
    boardId: formData.get("boardId"),
    content: formData.get("content"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa membalas di papan internal." };
  }

  const { error } = await supabase.from("internal_board_replies").insert({
    board_id: parsed.data.boardId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) return { error: "Balasan gagal dikirim. Coba lagi." };

  // The thread starter is notified by a database trigger (migration 0022).

  revalidatePath("/dashboard");
  return { success: "Balasan terkirim." };
}

export async function createCalendarEntry(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = calendarEntrySchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    startAt: formData.get("startAt"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };
  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa menambah agenda." };
  }

  const { error } = await supabase.from("internal_calendar").insert({
    title: parsed.data.title,
    type: parsed.data.type,
    start_at: new Date(parsed.data.startAt).toISOString(),
    created_by: user.id,
  });

  if (error) return { error: "Agenda gagal disimpan. Coba lagi." };

  revalidatePath("/dashboard");
  return { success: "Agenda tersimpan." };
}

export async function createCashEntry(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = cashSchema.safeParse({
    type: formData.get("type"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    occurredOn: formData.get("occurredOn"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, roles, isAdmin } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  if (roles.length === 0 && !isAdmin) {
    return { error: "Hanya pengurus yang bisa mencatat transaksi kas." };
  }

  const { error } = await supabase.from("finance_transactions").insert({
    type: parsed.data.type,
    category: parsed.data.category,
    amount: parsed.data.amount,
    description: parsed.data.description,
    occurred_on: parsed.data.occurredOn,
    recorded_by: user.id,
  });

  if (error) return { error: "Transaksi gagal dicatat. Coba lagi." };

  await supabase.rpc("log_audit", {
    p_action: "kas.catat",
    p_target_type: "finance_transaction",
    p_metadata: {
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category,
    },
  });

  revalidatePath("/dashboard");
  return { success: "Transaksi kas tercatat." };
}

/**
 * Rewords the weekend academic reminder (migration 0033).
 *
 * RLS is the real gate: migration 0034 grants divisi pendidikan write access
 * to exactly these three keys, and admin/media keep theirs from 0031.
 */
export async function saveAcademicReminder(
  _prev: DashboardState,
  formData: FormData,
): Promise<DashboardState> {
  const parsed = academicReminderSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    link: formData.get("link"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await currentPengurus();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { error } = await supabase.from("site_settings").upsert(
    [
      { key: "academic_reminder_title", value: parsed.data.title || null },
      { key: "academic_reminder_body", value: parsed.data.body || null },
      { key: "academic_reminder_link", value: parsed.data.link || null },
    ],
    { onConflict: "key" },
  );

  if (error) {
    return {
      error: "Gagal disimpan. Hanya divisi pendidikan, media, dan admin yang bisa.",
    };
  }

  await supabase.rpc("log_audit", {
    p_action: "reminder_akademik.ubah",
    p_target_type: "site_settings",
    p_metadata: { title: parsed.data.title || null },
  });

  revalidatePath("/dashboard");
  return { success: "Teks reminder akhir pekan tersimpan." };
}
