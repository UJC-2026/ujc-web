"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DELETE_CONFIRMATION } from "@/lib/account/confirmation";

export type DeleteAccountState = { error?: string };

/**
 * Irreversible. The cascade rules decide what goes and what stays, and
 * `delete_my_account()` (0028) refuses the last remaining admin — see the
 * migration for why both of those live in the database.
 */
export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const typed = String(formData.get("confirmation") ?? "").trim();

  if (typed.toUpperCase() !== DELETE_CONFIRMATION) {
    return {
      error: `Ketik persis "${DELETE_CONFIRMATION}" untuk melanjutkan.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("delete_my_account");

  if (error) {
    // The last-admin refusal is written for the person reading it; anything
    // else is ours to own rather than to paste at them.
    return {
      error: error.message.startsWith("Kamu satu-satunya admin")
        ? error.message
        : "Akun gagal dihapus. Coba lagi, atau hubungi pengurus.",
    };
  }

  // The account is gone; the cookie is not. Clearing it stops the next request
  // from arriving with a token whose user no longer exists.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?akun=dihapus");
}
