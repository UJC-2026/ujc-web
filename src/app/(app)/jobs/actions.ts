"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type JobState = { error?: string; success?: string };

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable();

const optionalInt = z
  .string()
  .trim()
  .transform((value) => (value ? Number(value) : null))
  .refine(
    (value) => value === null || (Number.isInteger(value) && value >= 0),
    "Gaji harus berupa angka bulat tidak negatif.",
  );

const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(6, "Judul posisi minimal 6 karakter.")
      .max(140, "Judul posisi maksimal 140 karakter."),
    company: z
      .string()
      .trim()
      .min(2, "Nama perusahaan wajib diisi.")
      .max(140, "Nama perusahaan maksimal 140 karakter."),
    locationPrefecture: optionalText,
    contractType: optionalText,
    salaryMin: optionalInt,
    salaryMax: optionalInt,
    visaTypes: z.array(z.string().trim().min(1)).max(8),
    deadline: optionalText,
    description: optionalText,
    requirements: optionalText,
  })
  .refine(
    (data) =>
      data.salaryMin === null ||
      data.salaryMax === null ||
      data.salaryMin <= data.salaryMax,
    { message: "Gaji minimum tidak boleh melebihi maksimum.", path: ["salaryMax"] },
  );

/**
 * Posting is limited to pengurus and always lands unverified — a moderator
 * has to approve it before members see it. Both rules are enforced by RLS
 * (migration 0014), so this only turns a rejection into a readable message.
 */
export async function createJob(
  _prev: JobState,
  formData: FormData,
): Promise<JobState> {
  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    company: formData.get("company"),
    locationPrefecture: formData.get("locationPrefecture"),
    contractType: formData.get("contractType"),
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    visaTypes: formData.getAll("visaTypes").map(String).filter(Boolean),
    deadline: formData.get("deadline"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      title: parsed.data.title,
      company: parsed.data.company,
      location_prefecture: parsed.data.locationPrefecture,
      contract_type: parsed.data.contractType,
      salary_min: parsed.data.salaryMin,
      salary_max: parsed.data.salaryMax,
      visa_types: parsed.data.visaTypes,
      deadline: parsed.data.deadline,
      description: parsed.data.description,
      requirements: parsed.data.requirements,
      posted_by: user.id,
    })
    .select("id")
    .single();

  if (error || !job) {
    return {
      error:
        "Lowongan gagal disimpan. Hanya pengurus yang boleh memasang lowongan.",
    };
  }

  await supabase.rpc("log_audit", {
    p_action: "lowongan.buat",
    p_target_type: "job",
    p_target_id: job.id,
    p_metadata: { title: parsed.data.title, company: parsed.data.company },
  });

  revalidatePath("/jobs");
  redirect(`/jobs/${job.id}`);
}

const saveSchema = z.object({
  jobId: z.uuid(),
  status: z.enum(["disimpan", "dilamar", "hapus"]),
});

export async function toggleJobSave(formData: FormData): Promise<void> {
  const parsed = saveSchema.safeParse({
    jobId: formData.get("jobId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/jobs/${parsed.data.jobId}`);

  if (parsed.data.status === "hapus") {
    await supabase
      .from("job_saves")
      .delete()
      .eq("job_id", parsed.data.jobId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("job_saves").upsert(
      {
        job_id: parsed.data.jobId,
        user_id: user.id,
        status: parsed.data.status,
      },
      { onConflict: "job_id,user_id" },
    );
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${parsed.data.jobId}`);
}

/** Moderator-only. RLS rejects it for anyone else. */
export async function verifyJob(formData: FormData): Promise<void> {
  const jobId = String(formData.get("jobId"));
  const verified = formData.get("verified") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("jobs")
    .update({ is_verified: !verified })
    .eq("id", jobId)
    .select("id")
    .maybeSingle();

  if (data) {
    await supabase.rpc("log_audit", {
      p_action: verified ? "lowongan.batal_verifikasi" : "lowongan.verifikasi",
      p_target_type: "job",
      p_target_id: jobId,
    });
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}
