import Image from "next/image";
import Link from "next/link";
import { HomeCategoryChips } from "@/components/features/home/shared/HomeCategoryChips";
import type { HomeCategoryChipItem } from "@/components/features/home/shared/HomeCategoryChips";
import { HOME_CTA_LABEL, HOME_EXPLORE_HREF } from "@/components/features/home/shared/homeHeroCopy";
import { HERO_IMG } from "@/components/features/home/shared/homeImages";
import { HomeProductCardBadges } from "@/components/features/home/shared/HomeProductCardBadges";
import { imageObjectFitForProductTitle } from "@/components/features/home/shared/homeSections";
import type { CatalogProduct } from "@/lib/catalog";

export function HomeMobile({
  hotProducts,
  newProducts,
  categories,
}: {
  hotProducts: CatalogProduct[];
  newProducts: CatalogProduct[];
  categories: HomeCategoryChipItem[];
}) {
  return (
    <div className="md:hidden">
      <main className="mx-auto max-w-screen-2xl px-5 pb-20 pt-24">
        <section className="relative mb-6 h-[235px] overflow-hidden rounded-3xl">
          <Image
            src={HERO_IMG}
            alt="Gaming setup"
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized
          />
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "linear-gradient(to top, var(--stitch-color-surface) 0%, transparent 58%)",
            }}
          />
          <div className="absolute bottom-6 left-5 right-5">
            <span
              className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{
                background: "var(--stitch-color-secondary-container)",
                color: "var(--stitch-color-on-secondary-container)",
              }}
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden>
                bolt
              </span>
              CYBERPULSE | Kinetic Gear
            </span>
            <h1
              className="mb-4 text-3xl font-bold italic leading-tight tracking-tighter text-white"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              OVERCLOCK YOUR REALITY
            </h1>
            <Link
              href={HOME_EXPLORE_HREF}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{
                background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                color: "var(--stitch-color-on-primary)",
              }}
            >
              {HOME_CTA_LABEL}
              <span className="material-symbols-outlined" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2
              className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-white"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              <span
                className="h-0.5 w-10"
                style={{ background: "var(--stitch-color-secondary)" }}
              />
              Duyệt phụ kiện
            </h2>
            <Link
              href={HOME_EXPLORE_HREF}
              className="flex min-h-[44px] items-center gap-2 text-sm font-bold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              Xem tất cả
              <span className="material-symbols-outlined text-sm" aria-hidden>
                open_in_new
              </span>
            </Link>
          </div>

          <HomeCategoryChips categories={categories} variant="mobile" />
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2
                className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-white"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--stitch-color-secondary)" }}
                  aria-hidden
                >
                  local_fire_department
                </span>
                Deal hot
              </h2>
              <div
                className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black"
                style={{ background: "var(--stitch-color-secondary)", color: "white" }}
              >
                Ưu đãi có hạn
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {hotProducts.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-3xl p-4"
                style={{ background: "var(--stitch-color-surface-container)" }}
              >
                <HomeProductCardBadges product={p} />

                <div className="flex flex-col gap-3 pt-10">
                  <div className="flex gap-4">
                    <Link
                      href={`/product/${p.id}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-low, var(--stitch-color-surface))",
                      }}
                    >
                      <Image
                        src={p.img}
                        alt={p.title}
                        fill
                        className={imageObjectFitForProductTitle(p.title)}
                        sizes="80px"
                        unoptimized
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      {/* Hide rating on list cards; show on product detail only. */}
                      <Link
                        href={`/product/${p.id}`}
                        className="mt-1 block line-clamp-2 text-base font-bold leading-snug text-white"
                        style={{ fontFamily: "var(--stitch-font-headline)" }}
                      >
                        {p.title}
                      </Link>
                      <p className="mt-2 text-lg font-black" style={{ color: "var(--stitch-color-primary)" }}>
                        {p.price} <span className="text-xs font-normal">đ</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/product/${p.id}`}
                    className="flex w-full items-center justify-center rounded-xl py-3 text-sm font-bold text-white transition-all hover:bg-[var(--stitch-color-primary)] hover:text-[var(--stitch-color-on-primary)] active:scale-95"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    }}
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="new-drops" className="mb-12 scroll-mt-28">
          <h2
            className="mb-4 text-2xl font-black uppercase italic tracking-tighter text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            New Drops
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {newProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group relative overflow-hidden rounded-3xl p-4"
                style={{ background: "var(--stitch-color-surface-container)" }}
              >
                <div
                  className="relative mb-4 h-24 overflow-hidden rounded-2xl"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-low, var(--stitch-color-surface))",
                  }}
                >
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    className={imageObjectFitForProductTitle(p.title)}
                    sizes="150px"
                    unoptimized
                  />
                </div>
                <p className="line-clamp-1 text-sm font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                  {p.title}
                </p>
                <p className="mt-2 text-base font-black" style={{ color: "var(--stitch-color-primary)" }}>
                  {p.price} <span className="text-[10px] font-normal">đ</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
