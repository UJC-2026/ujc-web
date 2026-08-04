"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MarketState = { error?: string; success?: string };

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable();

const itemSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(6, "Judul minimal 6 karakter.")
      .max(140, "Judul maksimal 140 karakter."),
    description: optionalText,
    category: optionalText,
    condition: optionalText,
    city: optionalText,
    prefecture: optionalText,
    isGiveaway: z.enum(["true", "false"]).default("false"),
    isAuction: z.enum(["true", "false"]).default("false"),
    price: z
      .string()
      .trim()
      .transform((value) => (value ? Number(value) : null))
      .refine(
        (value) => value === null || (Number.isInteger(value) && value >= 0),
        "Harga harus berupa angka bulat tidak negatif.",
      ),
    auctionEndAt: optionalText,
    images: z.array(z.string().url()).max(6, "Maksimal 6 foto per barang."),
  })
  .refine((data) => data.isGiveaway !== "true" || !data.price, {
    message: "Barang gratis tidak boleh punya harga.",
    path: ["price"],
  })
  .refine((data) => data.isAuction !== "true" || Boolean(data.auctionEndAt), {
    message: "Lelang harus punya waktu berakhir.",
    path: ["auctionEndAt"],
  })
  .refine(
    (data) =>
      data.isAuction !== "true" ||
      !data.auctionEndAt ||
      Date.parse(data.auctionEndAt) > Date.now(),
    { message: "Waktu berakhir lelang harus di masa depan.", path: ["auctionEndAt"] },
  )
  .refine((data) => !(data.isAuction === "true" && data.isGiveaway === "true"), {
    message: "Barang gratis tidak bisa sekaligus dilelang.",
    path: ["isAuction"],
  });

export async function createItem(
  _prev: MarketState,
  formData: FormData,
): Promise<MarketState> {
  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    condition: formData.get("condition"),
    city: formData.get("city"),
    prefecture: formData.get("prefecture"),
    isGiveaway: formData.get("isGiveaway") ?? "false",
    isAuction: formData.get("isAuction") ?? "false",
    price: formData.get("price"),
    auctionEndAt: formData.get("auctionEndAt"),
    images: formData.getAll("images").map(String).filter(Boolean),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi kamu sudah berakhir. Coba masuk lagi." };

  const isGiveaway = parsed.data.isGiveaway === "true";
  const isAuction = parsed.data.isAuction === "true";

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .insert({
      seller_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      condition: parsed.data.condition,
      city: parsed.data.city,
      prefecture: parsed.data.prefecture,
      images: parsed.data.images,
      is_giveaway: isGiveaway,
      is_auction: isAuction,
      price: isGiveaway ? null : parsed.data.price,
      auction_end_at:
        isAuction && parsed.data.auctionEndAt
          ? new Date(parsed.data.auctionEndAt).toISOString()
          : null,
    })
    .select("id")
    .single();

  if (error || !item) {
    return { error: "Barang gagal diposting. Coba lagi sebentar lagi." };
  }

  revalidatePath("/marketplace");
  redirect(`/marketplace/${item.id}`);
}

const bidSchema = z.object({
  itemId: z.uuid(),
  amount: z
    .string()
    .trim()
    .transform((value) => Number(value))
    .refine(
      (value) => Number.isInteger(value) && value > 0,
      "Tawaran harus berupa angka bulat lebih dari 0.",
    ),
});

/**
 * Every rule that matters (no self-bidding, auction still open, bid must beat
 * the current highest) is enforced by a database trigger, because the table is
 * reachable directly. This surfaces the trigger's message to the user.
 */
export async function placeBid(
  _prev: MarketState,
  formData: FormData,
): Promise<MarketState> {
  const parsed = bidSchema.safeParse({
    itemId: formData.get("itemId"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Masuk dulu untuk menawar." };

  const { error } = await supabase.from("marketplace_bids").insert({
    item_id: parsed.data.itemId,
    bidder_id: user.id,
    amount: parsed.data.amount,
  });

  if (error) {
    return {
      error: error.message.includes("Tawaran") ||
        error.message.includes("Lelang") ||
        error.message.includes("Penjual") ||
        error.message.includes("Barang")
        ? error.message
        : "Tawaran gagal dikirim. Coba lagi.",
    };
  }

  revalidatePath(`/marketplace/${parsed.data.itemId}`);
  return { success: "Tawaranmu tercatat." };
}

const statusSchema = z.object({
  itemId: z.uuid(),
  status: z.enum(["tersedia", "dipesan", "terjual"]),
});

/** Seller-only; RLS rejects it for anyone else. */
export async function updateItemStatus(
  formData: FormData,
): Promise<void> {
  const parsed = statusSchema.safeParse({
    itemId: formData.get("itemId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("marketplace_items")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.itemId);

  revalidatePath(`/marketplace/${parsed.data.itemId}`);
  revalidatePath("/marketplace");
}
