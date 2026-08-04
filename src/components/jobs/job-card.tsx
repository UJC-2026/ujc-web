import Link from "next/link";
import { Building2, CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateID } from "@/lib/format";
import type { Job, SaveStatus } from "@/lib/jobs/queries";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function salaryLabel(job: Job) {
  if (job.salary_min === null && job.salary_max === null) return "Gaji nego";
  if (job.salary_min !== null && job.salary_max !== null) {
    return `${yen.format(job.salary_min)} – ${yen.format(job.salary_max)}`;
  }
  return yen.format((job.salary_min ?? job.salary_max) as number);
}

export function JobCard({
  job,
  save,
}: {
  job: Job;
  save?: SaveStatus;
}) {
  return (
    <article className="relative rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent">
      <div className="flex flex-wrap items-center gap-1.5">
        {job.is_verified ? (
          <Badge variant="success">
            <ShieldCheck aria-hidden />
            Terverifikasi
          </Badge>
        ) : (
          <Badge variant="danger">Menunggu verifikasi</Badge>
        )}
        {job.contract_type && <Badge variant="outline">{job.contract_type}</Badge>}
        {job.isExpired && <Badge variant="neutral">Lewat tenggat</Badge>}
        {save === "dilamar" && <Badge variant="accent">Sudah dilamar</Badge>}
        {save === "disimpan" && <Badge variant="neutral">Disimpan</Badge>}
      </div>

      <h3 className="mt-3 text-h3 font-medium text-foreground">
        <Link href={`/jobs/${job.id}`}>
          <span className="absolute inset-0" aria-hidden />
          {job.title}
        </Link>
      </h3>

      <p className="mt-1.5 flex items-center gap-1.5 text-body text-muted-foreground">
        <Building2 className="size-4 shrink-0" aria-hidden />
        {job.company}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-muted-foreground">
        {job.location_prefecture && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {job.location_prefecture}
          </span>
        )}
        <span className="font-medium text-foreground">{salaryLabel(job)}</span>
        {job.deadline && (
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-4" aria-hidden />
            Tutup {formatDateID(job.deadline)}
          </span>
        )}
      </div>

      {job.visa_types.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.visa_types.map((visa) => (
            <li key={visa}>
              <Badge variant="outline">{visa}</Badge>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
