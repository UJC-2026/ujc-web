import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCertificate } from "@/lib/events/checkin";
import { getCurrentProfile } from "@/lib/auth/session";
import { formatDateID } from "@/lib/format";
import { PrintButton } from "@/components/events/print-button";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "E-sertifikat",
  // Someone's name and attendance record has no business in a search index.
  robots: { index: false, follow: false },
};

/**
 * The certificate itself, sized to A4 landscape and styled to print.
 *
 * The spec asks for a numbered PDF. Generating one server-side would mean
 * pulling in a PDF toolchain plus an embedded font to produce a single page
 * the browser can already render losslessly from this markup — so the
 * "download" is the browser's own print-to-PDF, driven by the button below.
 * `certificates.pdf_url` stays free for a stored copy if one is ever wanted.
 *
 * Who may read this is RLS's call: "sertifikat terlihat pemilik & pengurus"
 * (0002). A member reaching for someone else's gets nothing back, and this
 * page turns that into a 404 rather than a hint that it exists.
 */
export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=/events/${id}/sertifikat`);

  const certificate = await getCertificate(id, profile.id);
  if (!certificate) notFound();

  const { event } = certificate;

  return (
    <div className="certificate-page mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/events/${id}`}
          className="flex items-center gap-2 text-caption text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke kegiatan
        </Link>
        <PrintButton />
      </div>

      <p className="mt-4 text-caption text-muted-foreground print:hidden">
        Pilih tujuan &ldquo;Save as PDF&rdquo; di dialog cetak. Ukuran kertas
        dan orientasinya sudah diatur otomatis.
      </p>

      <article className="certificate mt-6 aspect-[297/210] w-full overflow-hidden rounded-panel border-2 border-primary shadow-lg">
        <div className="flex h-full flex-col items-center justify-between border-2 border-accent/50 p-[3.5%] text-center">
          <header className="flex flex-col items-center gap-[0.6cqw]">
            <Image
              src="/logo-ujc.svg"
              alt=""
              width={80}
              height={80}
              className="certificate-logo"
            />
            <p className="certificate-eyebrow">UNSIA Japan Community</p>
            <h1 className="certificate-title">Sertifikat Kehadiran</h1>
          </header>

          <div className="flex flex-col items-center gap-[1cqw]">
            <p className="certificate-lead">Diberikan kepada</p>
            <p className="certificate-name">{certificate.holder}</p>
            <p className="certificate-lead mt-[1cqw]">
              atas kehadiran dan partisipasinya dalam kegiatan
            </p>
            <p className="certificate-event">{event?.title ?? "Kegiatan UJC"}</p>
            {event && (
              <p className="certificate-meta">
                {formatDateID(event.event_date)}
                {" · "}
                {event.is_online ? "Daring" : (event.location ?? "Jepang")}
              </p>
            )}
          </div>

          <footer className="certificate-foot flex w-full items-end justify-between">
            <div className="text-left">
              <p className="font-semibold">Nomor</p>
              <p className="font-mono tracking-wider">
                {certificate.certificate_number}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Diterbitkan</p>
              <p>{formatDateID(certificate.issued_at)}</p>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}
