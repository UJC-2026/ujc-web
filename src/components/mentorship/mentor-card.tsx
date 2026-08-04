import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RequestDialog } from "./request-dialog";
import type { Mentor } from "@/lib/mentorship/queries";

export function MentorCard({
  mentor,
  canRequest,
  alreadyAsked,
  isSelf,
}: {
  mentor: Mentor;
  canRequest: boolean;
  alreadyAsked: boolean;
  isSelf: boolean;
}) {
  const closed = !mentor.is_available || mentor.isFull;

  return (
    <article className="flex h-full flex-col rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <Avatar
          src={mentor.profile?.avatar_url}
          name={mentor.profile?.full_name ?? "Mentor"}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-foreground">
            {mentor.profile?.full_name ?? "Anggota UJC"}
          </p>
          <p className="text-caption text-muted-foreground">
            {[mentor.city ?? mentor.profile?.prefecture, mentor.profile?.angkatan && `Angkatan ${mentor.profile.angkatan}`]
              .filter(Boolean)
              .join(" · ") || "Domisili belum diisi"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {mentor.isFull ? (
          <Badge variant="danger">Kuota penuh</Badge>
        ) : mentor.is_available ? (
          <Badge variant="success">Menerima bimbingan</Badge>
        ) : (
          <Badge variant="outline">Sedang tutup</Badge>
        )}
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users className="size-3.5" aria-hidden />
          {mentor.active_mentees}/{mentor.capacity} mentee
        </span>
      </div>

      {mentor.experience_summary && (
        <p className="mt-3 line-clamp-4 text-body text-muted-foreground">
          {mentor.experience_summary}
        </p>
      )}

      {mentor.expertise.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {mentor.expertise.map((tag) => (
            <li key={tag}>
              <Badge variant="outline">{tag}</Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-5">
        {isSelf ? (
          <p className="text-caption text-muted-foreground">
            Ini profil mentormu sendiri.
          </p>
        ) : alreadyAsked ? (
          <p className="text-caption text-accent">
            Kamu sudah mengajukan bimbingan ke mentor ini.
          </p>
        ) : closed ? (
          <p className="text-caption text-muted-foreground">
            {mentor.isFull
              ? "Kuota sedang penuh. Coba lagi nanti."
              : "Mentor ini sedang tidak menerima bimbingan baru."}
          </p>
        ) : canRequest ? (
          <RequestDialog
            mentorId={mentor.id}
            mentorName={mentor.profile?.full_name ?? "mentor ini"}
          />
        ) : (
          <p className="text-caption text-muted-foreground">
            Masuk untuk mengajukan bimbingan.
          </p>
        )}
      </div>
    </article>
  );
}

