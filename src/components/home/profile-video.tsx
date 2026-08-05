"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * Click-to-play facade for the community profile video.
 *
 * Embedding the iframe directly would load YouTube's player — and its cookies
 * — for every visitor to the landing page, including the ones who never watch
 * it. The poster is a static thumbnail; nothing is requested from YouTube's
 * player until someone actually asks for the video, and `youtube-nocookie`
 * is used when they do.
 */
export function ProfileVideo({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-panel border border-border"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Putar video: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-panel border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {posterFailed ? (
        <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary/12 via-accent-muted/40 to-primary/8" />
      ) : (
        <Image
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt=""
          fill
          sizes="(min-width: 1024px) 60rem, 100vw"
          onError={() => setPosterFailed(true)}
          className="object-cover"
        />
      )}

      <span className="absolute inset-0 flex items-center justify-center bg-navy-900/30 transition-colors group-hover:bg-navy-900/15">
        <span className="flex size-16 items-center justify-center rounded-pill bg-white/90 text-primary shadow-lg transition-transform group-hover:scale-110">
          <Play className="ml-1 size-7" aria-hidden />
        </span>
      </span>
    </button>
  );
}
