"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export function ProductHeroCarousel({
  images,
  alt,
  intervalMs = 3500,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
}) {
  const slides = useMemo(() => images.filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), intervalMs);
    return () => window.clearInterval(t);
  }, [slides.length, intervalMs]);

  const safeIdx = slides.length ? idx % slides.length : 0;

  return (
    <div className="relative h-[240px] sm:h-[320px]">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${safeIdx * 100}%)` }}
        >
          {slides.length ? (
            slides.map((src, i) => (
              <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
                <Image src={src} alt={alt} fill className="object-cover" sizes="100vw" priority={i === 0} unoptimized />
              </div>
            ))
          ) : (
            <div className="relative h-full w-full shrink-0" />
          )}
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-90"
        style={{ background: "linear-gradient(to top, var(--stitch-color-surface) 0%, transparent 60%)" }}
      />

      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => {
            const active = i === safeIdx;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: active ? 18 : 6,
                  background: active
                    ? "var(--stitch-color-primary)"
                    : "color-mix(in srgb, var(--stitch-color-on-surface-variant) 60%, transparent)",
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

