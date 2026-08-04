import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { NewItemForm } from "./new-item-form";

export const metadata: Metadata = { title: "Pasang barang" };

export default async function NewItemPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/marketplace" className="transition-colors hover:text-primary">
          Marketplace
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Pasang barang</span>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">Pasang barang</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Tulis kondisi barang sejujurnya — reputasi di komunitas kecil itu
        bertahan lama.
      </p>

      <div className="mt-9">
        <NewItemForm
          defaultCity={profile.city}
          defaultPrefecture={profile.prefecture}
        />
      </div>
    </div>
  );
}
