import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Downloads everything the signed-in member is the subject of, as JSON.
 *
 * A route handler rather than a server action because the result is a file:
 * actions return values to React, and streaming a download through one means
 * base64-ing the whole document into the page just to hand it back.
 *
 * `export_my_data()` (0028) scopes itself to `auth.uid()`, so there is no id
 * to pass and nothing here to get wrong.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Masuk dulu untuk mengunduh datamu." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase.rpc("export_my_data");

  if (error) {
    return NextResponse.json(
      { error: "Ekspor gagal dibuat. Coba lagi sebentar lagi." },
      { status: 500 },
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="data-ujc-${stamp}.json"`,
      // A personal data dump has no business in any cache.
      "Cache-Control": "no-store, private",
    },
  });
}
