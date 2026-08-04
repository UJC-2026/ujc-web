import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile, getPengurusRoles } from "@/lib/auth/session";
import { NewJobForm } from "./new-job-form";

export const metadata: Metadata = { title: "Pasang lowongan" };

export default async function NewJobPage() {
  const profile = await requireProfile();
  const roles = await getPengurusRoles(profile.id);

  // Posting is pengurus-only to keep scam listings out; RLS enforces it too.
  if (roles.length === 0 && profile.role !== "admin") redirect("/jobs");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/jobs" className="transition-colors hover:text-primary">
          Papan lowongan
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Pasang lowongan</span>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">Pasang lowongan</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Lowongan tidak langsung tampil — moderator meninjau dulu sebelum
        anggota bisa melihatnya. Cantumkan nama perusahaan yang sebenarnya dan
        kontak yang bisa diverifikasi.
      </p>

      <div className="mt-9">
        <NewJobForm />
      </div>
    </div>
  );
}
