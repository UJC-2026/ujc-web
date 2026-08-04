import { createClient } from "@/lib/supabase/server";

export type PeduliStatus = "pengajuan" | "diverifikasi" | "berjalan" | "selesai";

export type PeduliCase = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_amount: number | null;
  collected_amount: number;
  donation_count: number;
  status: PeduliStatus;
  is_public: boolean;
  created_at: string;
};

export type PeduliImpact = {
  casesHelped: number;
  totalCollected: number;
  totalDonations: number;
};

export async function getPeduliImpact(): Promise<PeduliImpact> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("peduli_impact");

  const row = Array.isArray(data) ? data[0] : data;

  return {
    casesHelped: Number(row?.cases_helped ?? 0),
    totalCollected: Number(row?.total_collected ?? 0),
    totalDonations: Number(row?.total_donations ?? 0),
  };
}

/**
 * Public cases only. RLS also lets a submitter see their own pending case and
 * lets pengurus see everything, so this returns whatever the caller is
 * entitled to rather than filtering by is_public here.
 */
export async function getPeduliCases(): Promise<PeduliCase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("peduli_cases")
    .select(
      "id, title, description, category, target_amount, collected_amount, donation_count, status, is_public, created_at",
    )
    .order("created_at", { ascending: false });

  return (data as PeduliCase[] | null) ?? [];
}

export async function getPeduliCase(id: string): Promise<PeduliCase | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("peduli_cases")
    .select(
      "id, title, description, category, target_amount, collected_amount, donation_count, status, is_public, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  return (data as PeduliCase | null) ?? null;
}

export type PeduliReviewCase = PeduliCase & {
  submitter: { id: string; full_name: string } | null;
};

/**
 * Everything the reviewer is allowed to see, pending first. RLS limits this to
 * pimpinan and bendahara, so an ordinary pengurus gets an empty list rather
 * than someone else's medical or financial situation.
 */
export async function getPeduliReviewQueue(): Promise<PeduliReviewCase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("peduli_cases")
    .select(
      `id, title, description, category, target_amount, collected_amount,
       donation_count, status, is_public, created_at,
       submitter:profiles!peduli_cases_submitted_by_fkey(id, full_name)`,
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const submitter = Array.isArray(row.submitter)
      ? row.submitter[0]
      : row.submitter;
    return {
      ...(row as unknown as PeduliCase),
      submitter: (submitter as { id: string; full_name: string }) ?? null,
    };
  });
}

export type PeduliDonation = {
  id: string;
  amount: number;
  is_anonymous: boolean;
  message: string | null;
  created_at: string;
  donor: { full_name: string } | null;
};

/**
 * Donation rows are restricted by RLS to the donor, bendahara, and pimpinan.
 * Anonymous donors are additionally stripped of their name here so a bendahara
 * reviewing the ledger does not surface it into a public view by accident.
 */
export async function getCaseDonations(
  caseId: string,
): Promise<PeduliDonation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("peduli_donations")
    .select(
      "id, amount, is_anonymous, message, created_at, donor:profiles!peduli_donations_donor_id_fkey(full_name)",
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const donor = Array.isArray(row.donor) ? row.donor[0] : row.donor;
    return {
      id: row.id as string,
      amount: row.amount as number,
      is_anonymous: row.is_anonymous as boolean,
      message: row.message as string | null,
      created_at: row.created_at as string,
      donor: row.is_anonymous ? null : ((donor as { full_name: string }) ?? null),
    };
  });
}
