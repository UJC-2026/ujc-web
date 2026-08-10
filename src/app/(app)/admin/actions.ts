"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { error?: string; success?: string };

const resolveSchema = z.object({
  kind: z.enum(["report", "flag"]),
  id: z.uuid(),
  contentType: z.enum(["thread", "reply", "barang"]),
  contentId: z.uuid(),
  decision: z.enum(["tolak", "hapus"]),
});

/**
 * Closes one moderation queue entry. "tolak" dismisses the report and leaves
 * the content alone; "hapus" removes the offending content as well. Both are
 * recorded in the audit trail.
 */
export async function resolveQueueItem(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const parsed = resolveSchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id"),
    contentType: formData.get("contentType"),
    contentId: formData.get("contentId"),
    decision: formData.get("decision"),
  });

  if (!parsed.success) return { error: "Aksi moderasi tidak dikenali." };

  const { kind, id, contentType, contentId, decision } = parsed.data;
  const supabase = await createClient();

  if (decision === "hapus") {
    // A map, not a ternary. The two-branch version silently treated every
    // non-thread report as a reply, so a reported marketplace item was
    // deleted from forum_replies — nought rows, and the listing stayed up
    // while the report was marked resolved.
    const TABLES = {
      thread: "forum_threads",
      reply: "forum_replies",
      barang: "marketplace_items",
    } as const;

    const { error } = await supabase
      .from(TABLES[contentType])
      .delete()
      .eq("id", contentId);

    if (error) {
      return { error: "Konten gagal dihapus. Coba lagi sebentar lagi." };
    }
  }

  // Mark the queue entry closed. The two tables use different status enums.
  const { error: closeError } =
    kind === "report"
      ? await supabase
          .from("reports")
          .update({ status: decision === "hapus" ? "ditindak" : "ditolak" })
          .eq("id", id)
      : await supabase
          .from("content_flags")
          .update({ status: decision === "hapus" ? "disetujui" : "ditolak" })
          .eq("id", id);

  if (closeError) {
    return { error: "Status antrean gagal diperbarui. Coba lagi." };
  }

  await supabase.rpc("log_audit", {
    p_action: decision === "hapus" ? "moderasi.hapus" : "moderasi.tolak",
    p_target_type: contentType,
    p_target_id: contentId,
    p_metadata: { kind, queue_id: id },
  });

  revalidatePath("/admin/moderasi");
  revalidatePath("/admin");

  return {
    success:
      decision === "hapus"
        ? "Konten dihapus dan laporan ditutup."
        : "Laporan ditutup tanpa menghapus konten.",
  };
}

const roleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["admin", "moderator", "member"]),
});

/** Admin-only; the profiles_guard_privileges trigger enforces this in the DB. */
export async function updateMemberRole(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { error: "Peran tidak dikenali." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === parsed.data.userId) {
    return { error: "Kamu tidak bisa mengubah peranmu sendiri." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .select("id, role")
    .maybeSingle();

  if (error || !data) {
    return { error: "Peran gagal diubah. Pastikan kamu punya akses admin." };
  }

  // The privilege guard silently reverts the value for non-admins rather than
  // failing, so the write has to be read back to know it actually took.
  if (data.role !== parsed.data.role) {
    return { error: "Hanya admin yang boleh mengubah peran anggota." };
  }

  await supabase.rpc("log_audit", {
    p_action: "anggota.ubah_peran",
    p_target_type: "profile",
    p_target_id: parsed.data.userId,
    p_metadata: { role: parsed.data.role },
  });

  revalidatePath("/admin/anggota");
  return { success: "Peran anggota diperbarui." };
}

const verifySchema = z.object({
  userId: z.uuid(),
  verified: z.enum(["true", "false"]),
});

export async function updateMemberVerification(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const parsed = verifySchema.safeParse({
    userId: formData.get("userId"),
    verified: formData.get("verified"),
  });

  if (!parsed.success) return { error: "Status verifikasi tidak dikenali." };

  const isVerified = parsed.data.verified === "true";
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_verified: isVerified })
    .eq("id", parsed.data.userId)
    .select("id, is_verified")
    .maybeSingle();

  if (error || !data) {
    return { error: "Verifikasi gagal disimpan. Coba lagi." };
  }

  if (data.is_verified !== isVerified) {
    return { error: "Hanya admin yang boleh mengubah verifikasi anggota." };
  }

  await supabase.rpc("log_audit", {
    p_action: isVerified ? "anggota.verifikasi" : "anggota.batal_verifikasi",
    p_target_type: "profile",
    p_target_id: parsed.data.userId,
  });

  revalidatePath("/admin/anggota");
  return {
    success: isVerified
      ? "Anggota ditandai terverifikasi."
      : "Verifikasi anggota dicabut.",
  };
}
