import { Camera, Globe, Link2, Music4, Play, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { YouTubeThumbnail } from "@/components/creative/thumbnail";
import type { CreativeWork } from "@/lib/creative/queries";
import { curateWork, deleteWork } from "@/app/(app)/creative-hub/actions";

const PLATFORM = {
  youtube: { label: "YouTube", icon: Play },
  instagram: { label: "Instagram", icon: Camera },
  tiktok: { label: "TikTok", icon: Music4 },
  facebook: { label: "Facebook", icon: Globe },
  lainnya: { label: "Tautan", icon: Link2 },
} as const;

export function WorkCard({
  work,
  canModerate,
  isOwner,
}: {
  work: CreativeWork;
  canModerate: boolean;
  isOwner: boolean;
}) {
  const platform = PLATFORM[work.platform];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg">
      <a
        href={work.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block"
        aria-label={`Buka “${work.title}” di ${platform.label}`}
      >
        {work.youtube_id ? (
          <YouTubeThumbnail videoId={work.youtube_id} />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/12 via-accent-muted/40 to-primary/8">
            <platform.icon className="size-10 text-primary/50" aria-hidden />
          </div>
        )}
      </a>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{platform.label}</Badge>
          {work.is_featured && (
            <Badge variant="primary">
              <Sparkles aria-hidden />
              Pilihan
            </Badge>
          )}
          {!work.is_approved && <Badge variant="danger">Menunggu tinjauan</Badge>}
        </div>

        <h3 className="mt-3 text-h3 font-medium text-foreground">
          <a href={work.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-primary">
            {work.title}
          </a>
        </h3>

        {work.description && (
          <p className="mt-2 line-clamp-2 text-body text-muted-foreground">
            {work.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2.5 pt-5">
          {work.author && (
            <>
              <Avatar
                src={work.author.avatar_url}
                name={work.author.full_name}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
                {work.author.full_name}
              </span>
            </>
          )}
        </div>

        {(canModerate || isOwner) && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {canModerate && !work.is_approved && (
              <form action={curateWork}>
                <input type="hidden" name="workId" value={work.id} />
                <input type="hidden" name="curate" value="approve" />
                <button type="submit" className="rounded-field border border-border px-2.5 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary">
                  Setujui
                </button>
              </form>
            )}
            {canModerate && work.is_approved && (
              <form action={curateWork}>
                <input type="hidden" name="workId" value={work.id} />
                <input type="hidden" name="curate" value={work.is_featured ? "unfeature" : "feature"} />
                <button type="submit" className="rounded-field border border-border px-2.5 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary">
                  {work.is_featured ? "Lepas pilihan" : "Jadikan pilihan"}
                </button>
              </form>
            )}
            {(isOwner || canModerate) && (
              <form action={deleteWork}>
                <input type="hidden" name="workId" value={work.id} />
                <button type="submit" className="rounded-field border border-border px-2.5 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-danger hover:text-danger">
                  Hapus
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
