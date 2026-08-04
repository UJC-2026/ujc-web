import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarClock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getJob, getJobSaves } from "@/lib/jobs/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { salaryLabel } from "@/components/jobs/job-card";
import { SaveControls } from "@/components/jobs/save-controls";
import { VerifyControl } from "@/components/jobs/verify-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateID, relativeTime } from "@/lib/format";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) return { title: "Lowongan tidak ditemukan" };

  // An unverified listing must not be advertised through metadata.
  if (!job.is_verified) {
    return { title: "Lowongan menunggu verifikasi", robots: { index: false } };
  }

  return {
    title: `${job.title} di ${job.company} · Lowongan`,
    description: job.description?.slice(0, 155),
  };
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;

  const [job, profile] = await Promise.all([getJob(id), getCurrentProfile()]);

  // RLS hides unverified listings from everyone but the poster and moderators.
  if (!job) notFound();

  const saves = profile ? await getJobSaves(profile.id) : {};
  const canModerate =
    profile?.role === "admin" || profile?.role === "moderator";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/jobs" className="transition-colors hover:text-primary">
          Papan lowongan
        </Link>
      </nav>

      {!job.is_verified && (
        <p className="mt-5 flex items-start gap-2.5 rounded-panel border border-danger/40 bg-danger/8 px-4 py-3.5 text-caption text-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          Lowongan ini belum diverifikasi moderator, jadi belum terlihat
          anggota lain. Jangan dibagikan sebelum ditinjau.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {job.is_verified && (
          <Badge variant="success">
            <ShieldCheck aria-hidden />
            Terverifikasi
          </Badge>
        )}
        {job.contract_type && <Badge variant="outline">{job.contract_type}</Badge>}
        {job.isExpired && <Badge variant="neutral">Lewat tenggat</Badge>}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{job.title}</h1>
      <p className="mt-2 flex items-center gap-2 text-h3 text-muted-foreground">
        <Building2 className="size-5 shrink-0" aria-hidden />
        {job.company}
      </p>

      <dl className="mt-8 grid gap-4 rounded-panel border border-border bg-surface p-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Lokasi</dt>
            <dd className="text-body text-foreground">
              {job.location_prefecture ?? "Menyusul"}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center font-semibold text-primary">
            ¥
          </span>
          <div>
            <dt className="text-caption text-muted-foreground">Kisaran gaji</dt>
            <dd className="text-body text-foreground">{salaryLabel(job)}</dd>
          </div>
        </div>

        {job.deadline && (
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-caption text-muted-foreground">Tenggat lamaran</dt>
              <dd className="text-body text-foreground">
                {formatDateID(job.deadline)}
              </dd>
            </div>
          </div>
        )}

        {job.visa_types.length > 0 && (
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-caption text-muted-foreground">Visa diterima</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {job.visa_types.map((visa) => (
                  <Badge key={visa} variant="outline">
                    {visa}
                  </Badge>
                ))}
              </dd>
            </div>
          </div>
        )}
      </dl>

      {job.description && (
        <div className="mt-8">
          <h2 className="rule-gold text-h3 text-foreground">Deskripsi</h2>
          <p className="mt-5 text-body whitespace-pre-line text-muted-foreground">
            {job.description}
          </p>
        </div>
      )}

      {job.requirements && (
        <div className="mt-8">
          <h2 className="rule-gold text-h3 text-foreground">Persyaratan</h2>
          <p className="mt-5 text-body whitespace-pre-line text-muted-foreground">
            {job.requirements}
          </p>
        </div>
      )}

      <section className="mt-10 rounded-panel border border-border bg-surface p-6">
        <h2 className="text-h3 text-foreground">Tandai lowongan ini</h2>

        {!profile ? (
          <div className="mt-5">
            <p className="text-body text-muted-foreground">
              Masuk dulu untuk menyimpan atau menandai lowongan.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/login?next=/jobs/${job.id}`}>Masuk</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-5">
            <SaveControls jobId={job.id} current={saves[job.id]} />
          </div>
        )}

        <p className="mt-5 text-caption text-muted-foreground">
          Dipasang {job.poster ? `oleh ${job.poster.full_name} ` : ""}
          {relativeTime(job.created_at)}.
        </p>
      </section>

      {canModerate && (
        <section className="mt-8 rounded-panel border border-accent/40 bg-accent-muted/30 p-6">
          <h2 className="text-h3 text-foreground">Moderasi</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Pastikan perusahaan dan kontaknya nyata sebelum menerbitkan.
            Lowongan tidak akan terlihat anggota sampai diverifikasi.
          </p>
          <div className="mt-4">
            <VerifyControl jobId={job.id} verified={job.is_verified} />
          </div>
        </section>
      )}
    </div>
  );
}
