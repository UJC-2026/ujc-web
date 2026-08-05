"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * YouTube serves thumbnails publicly per video id, with no API key — but it
 * answers 404 once a video is deleted or made private, and `next/image` then
 * renders a broken image. Since a curated link outlives the uploader's control
 * of it, the failure is expected rather than exceptional: on error the card
 * falls back to the same placeholder every non-YouTube work already uses.
 */
export function YouTubeThumbnail({ videoId }: { videoId: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/12 via-accent-muted/40 to-primary/8">
        <Play className="size-10 text-primary/50" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        width={480}
        height={270}
        onError={() => setFailed(true)}
        className="aspect-video w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-navy-900/25 transition-colors group-hover:bg-navy-900/10">
        <span className="flex size-12 items-center justify-center rounded-pill bg-white/90 text-primary shadow-md transition-transform group-hover:scale-110">
          <Play className="ml-0.5 size-5" aria-hidden />
        </span>
      </span>
    </div>
  );
}
