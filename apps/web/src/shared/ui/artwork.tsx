"use client";

import type { Artwork as ArtworkSet } from "@song/music-sources";
import { useState } from "react";
import { WaveIcon } from "./icons";
import Image from "next/image";

interface Props {
  artwork?: ArtworkSet;
  /** Which size to load; pick the smallest that covers the rendered size */
  size: "small" | "medium" | "large";
  className?: string;
  priority?: boolean;
  rounded?: "art" | "full";
}

const fallbackOrder = {
  small: ["small", "medium", "large"],
  medium: ["medium", "large", "small"],
  large: ["large", "medium", "small"],
} as const;

/**
 * Cover art with a branded placeholder, also shown when the image fails to load.
 * Plain <img>: Audius serves from many content nodes, so next/image's remote
 * allow-list would be a moving target.
 */
export function Artwork({ artwork, size, className = "", priority, rounded = "art" }: Props) {
  const src = artwork && fallbackOrder[size].map((k) => artwork[k]).find(Boolean);
  // Some Audius content nodes go offline; show the placeholder instead of a broken image.
  const [failed, setFailed] = useState<string | undefined>();
  const radius = rounded === "full" ? "rounded-full" : "rounded-(--radius-art)";
  return (
    <div className={`relative overflow-hidden bg-surface-raised ${radius} ${className}`}>
      {src && failed !== src ? (
        <Image
          src={src}
          alt=""
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onError={() => {
            setFailed(src);
          }}
          className="size-full object-cover"
        />
      ) : (
        <div className="grid size-full place-items-center text-text-muted">
          <WaveIcon size={28} />
        </div>
      )}
    </div>
  );
}
