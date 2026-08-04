import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Plus, ShieldCheck } from "lucide-react";
import {
  getJobFilters,
  getJobSaves,
  getJobs,
  type SaveStatus,
} from "@/lib/jobs/queries";
import { getCurrentProfile, getPengurusRoles } from "@/lib/auth/session";
import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Papan lowongan",
  description:
    "Lowongan kerja terverifikasi untuk anggota UJC di Jepang — lengkap dengan prefektur, kisaran gaji, dan tipe visa yang diterima.",
};

type PageProps = {
  searchParams: Promise<{ prefektur?: string; visa?: string }>;
};

export default async function JobsPage({ searchParams }: PageProps) {
  const { prefektur, visa } = await searchParams;
  const profile = await getCurrentProfile();

  const [jobs, filters, saves, roles] = await Promise.all([
    getJobs({ prefecture: prefektur, visa }),
    getJobFilters(),
    profile
      ? getJobSaves(profile.id)
      : Promise.resolve({} as Record<string, SaveStatus>),
    profile ? getPengurusRoles(profile.id) : Promise.resolve([]),
  ]);

  const canPost = roles.length > 0 || profile?.role === "admin";

  const chip = (active: boolean) =>
    cn(
      "rounded-pill px-3.5 py-2 text-caption font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
    );

  const withParams = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ prefektur, visa, ...next })) {
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="rule-gold text-h1 text-foreground">Papan lowongan</h1>
          <p className="mt-5 text-body text-muted-foreground">
            Lowongan yang dipasang pengurus dan ditinjau moderator sebelum
            tampil — supaya kamu tidak perlu menebak mana yang penipuan.
          </p>
        </div>
        {canPost && (
          <Button asChild>
            <Link href="/jobs/new">
              <Plus aria-hidden />
              Pasang lowongan
            </Link>
          </Button>
        )}
      </Reveal>

      <p className="mt-6 flex items-start gap-2.5 rounded-field border border-accent/40 bg-accent-muted/30 px-4 py-3 text-caption text-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        UJC tidak memungut biaya apa pun untuk penyaluran kerja. Kalau ada yang
        meminta uang muka atas nama komunitas, laporkan ke pengurus.
      </p>

      {filters.prefectures.length > 0 && (
        <div
          role="group"
          aria-label="Saring prefektur"
          className="mt-8 flex flex-wrap gap-1.5"
        >
          <Link href={withParams({ prefektur: undefined })} className={chip(!prefektur)}>
            Semua prefektur
          </Link>
          {filters.prefectures.map((item) => (
            <Link
              key={item}
              href={withParams({ prefektur: item })}
              className={chip(prefektur === item)}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      {filters.visaTypes.length > 0 && (
        <div
          role="group"
          aria-label="Saring tipe visa"
          className="mt-2 flex flex-wrap gap-1.5"
        >
          <Link href={withParams({ visa: undefined })} className={chip(!visa)}>
            Semua visa
          </Link>
          {filters.visaTypes.map((item) => (
            <Link
              key={item}
              href={withParams({ visa: item })}
              className={chip(visa === item)}
            >
              {item}
            </Link>
          ))}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={BriefcaseBusiness}
            title="Belum ada lowongan"
            description="Belum ada lowongan terverifikasi yang cocok. Coba saringan lain, atau pantau lagi nanti."
          />
        </div>
      ) : (
        <RevealGroup className="mt-10 space-y-4">
          {jobs.map((job) => (
            <RevealItem key={job.id}>
              <JobCard job={job} save={saves[job.id]} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
