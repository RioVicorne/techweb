"use client";

import { useCart } from "@/context/cart-context";
import type { CatalogProduct } from "@/lib/catalog";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = {
  product: CatalogProduct;
};

export function CategoryProductCard({ product: p }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      id: p.id,
      title: p.title,
      price: p.price,
      reviews: p.reviews,
      stars: p.stars,
      img: p.img,
      badge: p.badge,
      tag: p.tag,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        background: "var(--stitch-color-surface-container-high)",
        border:
          "1px solid color-mix(in srgb, var(--stitch-color-secondary) 34%, var(--stitch-color-outline))",
        boxShadow:
          "inset 0 0 0 1px color-mix(in srgb, var(--stitch-color-primary-container) 35%, transparent)",
      }}
    >
      {/* Badges */}
      {(p.badge || p.tag) && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {p.badge && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--stitch-color-on-secondary)] shadow"
              style={{ background: "var(--stitch-color-secondary)" }}
            >
              {p.badge}
            </span>
          )}
          {p.tag && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--stitch-color-on-primary)] shadow"
              style={{ background: "var(--stitch-color-primary)" }}
            >
              {p.tag}
            </span>
          )}
        </div>
      )}

      {/* Image */}
      <Link href={`/product/${p.id}`} className="block" tabIndex={-1}>
        <div
          className="relative h-52 w-full overflow-hidden"
          style={{ background: "var(--stitch-color-surface-container-low)" }}
        >
          <Image
            src={p.img}
            alt={p.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--stitch-color-primary) 24%, transparent), transparent 55%)",
            }}
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Stars */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined text-sm"
                style={{
                  color: i < p.stars ? "var(--stitch-color-warning)" : "var(--stitch-color-outline-variant)",
                  fontVariationSettings: `"FILL" ${i < p.stars ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 20`,
                }}
                aria-hidden
              >
                star
              </span>
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            {p.reviews}
          </span>
        </div>

        {/* Title */}
        <Link href={`/product/${p.id}`}>
          <h3
            className="line-clamp-2 text-base font-bold leading-snug transition-colors"
            style={{ fontFamily: "var(--stitch-font-headline)", color: "var(--stitch-color-on-surface)" }}
          >
            {p.title}
          </h3>
        </Link>

        {/* Price */}
        <p className="text-xl font-black" style={{ color: "var(--stitch-color-primary)" }}>
          {p.price}
          <span className="ml-1 text-xs font-normal" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            đ
          </span>
        </p>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={handleAdd}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold transition-all duration-200 active:scale-95"
            style={{
              background: added
                ? "var(--stitch-color-secondary)"
                : "var(--stitch-color-primary)",
              color: added
                ? "var(--stitch-color-on-secondary)"
                : "var(--stitch-color-on-primary)",
            }}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: `"FILL" 1, "wght" 500, "GRAD" 0, "opsz" 20` }}
              aria-hidden
            >
              {added ? "check" : "add_shopping_cart"}
            </span>
            {added ? "Đã thêm!" : "Thêm vào giỏ"}
          </button>
          <Link
            href={`/product/${p.id}`}
            className="flex items-center justify-center rounded-2xl px-3 py-2.5 transition-all duration-200 active:scale-95"
            style={{
              background: "var(--stitch-color-surface-container-high)",
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--stitch-color-primary) 10%, transparent)",
            }}
            title="Xem chi tiết"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
