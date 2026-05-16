"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type AirlineLogoProps = {
  src?: string | null;
  alt: string;
  seed?: string;
  size?: number;
  className?: string;
  imageClassName?: string;
};

function buildFallbackLogo(seed: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=000000`;
}

export function AirlineLogo({
  src,
  alt,
  seed,
  size = 40,
  className,
  imageClassName,
}: AirlineLogoProps) {
  const fallbackSrc = useMemo(() => buildFallbackLogo(seed || alt || "Airline"), [alt, seed]);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={currentSrc}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        className={cn("h-full w-full object-contain", imageClassName)}
        onError={() => setCurrentSrc(fallbackSrc)}
      />
    </div>
  );
}
