"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_IMAGE = "https://placehold.co/1200x800/png?text=RioShop";

function isRenderableImageSource(value: string): boolean {
  const src = value.trim();
  if (!src) return false;
  if (src.startsWith("data:image/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProductHeroCarousel({
  images,
  alt,
  intervalMs = 3500,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
}) {
  const slides = useMemo(() => {
    const normalized = images.filter(Boolean).map((src) => src.trim()).filter(isRenderableImageSource);

    return normalized.length > 0 ? normalized : [FALLBACK_IMAGE];
  }, [images]);
  const [idx, setIdx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef(0);

  const hasMultiple = slides.length > 1;

  useEffect(() => {
    if (!hasMultiple || isDragging) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [hasMultiple, isDragging, intervalMs, slides.length]);

  const safeIdx = slides.length ? idx % slides.length : 0;

  const goTo = (nextIdx: number) => {
    if (!slides.length) return;
    setIdx(((nextIdx % slides.length) + slides.length) % slides.length);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;
    startXRef.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - startXRef.current);
  };

  const finishDrag = () => {
    if (!isDragging) return;
    const threshold = 50;

    if (dragOffset <= -threshold) goTo(safeIdx + 1);
    if (dragOffset >= threshold) goTo(safeIdx - 1);

    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div className="w-full">
      <div
        className="relative h-[240px] touch-pan-y sm:h-[320px]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={[
              "flex h-full w-full",
              isDragging ? "transition-none" : "transition-transform duration-700 ease-out",
            ].join(" ")}
            style={{
              transform: `translate3d(calc(${-safeIdx * 100}% + ${dragOffset}px), 0, 0)`,
            }}
          >
            {slides.length ? (
              slides.map((src, i) => (
                <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={i === 0}
                    unoptimized
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== FALLBACK_IMAGE) {
                        target.src = FALLBACK_IMAGE;
                      }
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="relative h-full w-full shrink-0" />
            )}
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--stitch-color-primary) 22%, transparent) 0%, transparent 58%)",
          }}
        />

      </div>

      {hasMultiple ? (
        <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 pt-3">
          {slides.map((src, i) => {
            const active = i === safeIdx;
            return (
              <button
                key={`${src}-thumb-${i}`}
                type="button"
                aria-label={`Chọn ảnh ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition"
                style={{
                  borderColor: active
                    ? "var(--stitch-color-primary)"
                    : "color-mix(in srgb, var(--stitch-color-on-surface-variant) 35%, transparent)",
                  opacity: active ? 1 : 0.72,
                }}
              >
                <Image
                  src={src}
                  alt={`${alt} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== FALLBACK_IMAGE) {
                      target.src = FALLBACK_IMAGE;
                    }
                  }}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
