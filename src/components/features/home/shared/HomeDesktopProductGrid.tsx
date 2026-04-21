import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog";
import { HomeProductCardBadges } from "@/components/features/home/shared/HomeProductCardBadges";
import { imageObjectFitForProductTitle } from "@/components/features/home/shared/homeSections";

export function HomeDesktopProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/product/${p.id}`}
          className="group/card relative block rounded-3xl border p-4 transition-all duration-300 hover:opacity-95 hover:border-[var(--stitch-color-primary)] active:scale-[0.99] hover:bg-[var(--stitch-color-surface-bright,var(--stitch-color-surface-container-high))]"
          style={{
            background: "var(--stitch-color-surface-container-high)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-secondary) 34%, var(--stitch-color-outline))",
            boxShadow:
              "inset 0 0 0 1px color-mix(in srgb, var(--stitch-color-primary-container) 35%, transparent)",
          }}
          aria-label={`Xem sản phẩm: ${p.title}`}
        >
          <HomeProductCardBadges product={p} />
          <div
            className="relative mb-4 h-44 overflow-hidden rounded-2xl"
            style={{
              background: "var(--stitch-color-surface-container-low, var(--stitch-color-surface))",
            }}
          >
            <Image
              src={p.img}
              alt={p.title}
              fill
              className={imageObjectFitForProductTitle(p.title)}
              sizes="(max-width: 640px) 100vw, 25vw"
              unoptimized
            />
          </div>
          {/* Hide rating on list cards; show on product detail only. */}
          <h3
            className="mb-2 line-clamp-2 text-sm font-bold"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-on-surface)",
            }}
          >
            {p.title}
          </h3>

          <p className="mb-4 text-lg font-black" style={{ color: "var(--stitch-color-primary)" }}>
            {p.price} <span className="text-xs font-normal">đ</span>
          </p>
        </Link>
      ))}
    </div>
  );
}
