import Image from "next/image";
import Link from "next/link";
import { HomeCategoryChips } from "@/components/features/home/shared/HomeCategoryChips";
import type { HomeCategoryChipItem } from "@/components/features/home/shared/HomeCategoryChips";
import { HomeDesktopProductGrid } from "@/components/features/home/shared/HomeDesktopProductGrid";
import { HOME_CTA_LABEL, HOME_EXPLORE_HREF } from "@/components/features/home/shared/homeHeroCopy";
import { HERO_IMG, SIDE_CONSOLE, SIDE_PC } from "@/components/features/home/shared/homeImages";
import type { CatalogProduct } from "@/lib/catalog";

export function HomeDesktop({
  hotProducts,
  newProducts,
  categories,
}: {
  hotProducts: CatalogProduct[];
  newProducts: CatalogProduct[];
  categories: HomeCategoryChipItem[];
}) {
  return (
    <div className="hidden md:block">
      <aside className="pointer-events-none fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 xl:pointer-events-auto xl:flex xl:flex-col xl:gap-4">
        <Link
          href="/#hot-deals"
          className="group flex h-64 w-12 flex-col items-center justify-center gap-8 rounded-full py-6 transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
          style={{
            background:
              "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
          }}
          aria-label="Flash sale — xuống mục deal hot"
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: "var(--stitch-color-secondary)", writingMode: "vertical-rl" }}
          >
            FLASH SALE
          </span>
          <span className="material-symbols-outlined animate-pulse" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
            bolt
          </span>
        </Link>
      </aside>

      <aside className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 xl:pointer-events-auto xl:flex xl:flex-col xl:gap-4">
        <Link
          href="/#new-drops"
          className="group flex h-64 w-12 flex-col items-center justify-center gap-8 rounded-full border py-6 transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-primary)]"
          style={{
            background:
              "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
          aria-label="Hàng mới — xuống mục New Drops"
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.3em]"
            style={{ color: "var(--stitch-color-primary)", writingMode: "vertical-rl" }}
          >
            NEW DROP
          </span>
          <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-primary)" }} aria-hidden>
            rocket_launch
          </span>
        </Link>
      </aside>

      <main className="mx-auto max-w-screen-2xl px-6 pb-12 pt-24 md:px-12">
        <section className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="group relative h-[420px] cursor-pointer overflow-hidden rounded-3xl shadow-2xl md:h-[500px] lg:col-span-8">
            <Image
              src={HERO_IMG}
              alt="Gaming setup"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
              unoptimized
            />
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  "linear-gradient(to top, var(--stitch-color-surface) 0%, transparent 55%)",
              }}
            />
            <div className="absolute bottom-8 left-8 max-w-lg md:bottom-10 md:left-10">
              <span
                className="mb-4 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: "var(--stitch-color-secondary-container)",
                  color: "var(--stitch-color-on-secondary-container)",
                }}
              >
                Phiên bản giới hạn
              </span>
              <h1
                className="mb-4 text-4xl font-bold italic leading-tight tracking-tighter text-white md:text-6xl"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                CYBERPULSE{" "}
                <span style={{ color: "var(--stitch-color-primary)" }}>ELITE X</span>
              </h1>
              <p className="mb-8 text-lg font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Phản hồi xúc giác thế hệ mới — độ trễ gần như bằng không. Trải nghiệm chơi cạnh tranh đỉnh cao.
              </p>
              <Link
                href={HOME_EXPLORE_HREF}
                className="group inline-flex min-h-[44px] items-center gap-3 rounded-full px-8 py-4 font-extrabold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stitch-color-surface)]"
                style={{ background: "#ffffff", color: "var(--stitch-color-surface)" }}
              >
                {HOME_CTA_LABEL}
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" aria-hidden>
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="group relative h-[220px] flex-1 cursor-pointer overflow-hidden rounded-3xl md:h-[240px]">
              <Image
                src={SIDE_PC}
                alt="PC components"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="400px"
                unoptimized
              />
              <div
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-r p-6 md:p-8"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--stitch-color-surface-container-lowest, #000) 80%, transparent), transparent)",
                }}
              >
                <h2 className="mb-1 text-2xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                  RTX SERIES
                </h2>
                <p className="text-sm font-bold" style={{ color: "var(--stitch-color-tertiary)" }}>
                  UP TO 25% OFF
                </p>
              </div>
            </div>

            <div className="group relative h-[220px] flex-1 cursor-pointer overflow-hidden rounded-3xl md:h-[240px]">
              <Image
                src={SIDE_CONSOLE}
                alt="Gaming console"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="400px"
                unoptimized
              />
              <div
                className="absolute inset-0 flex flex-col justify-end bg-gradient-to-r p-6 md:p-8"
                style={{
                  background:
                    "linear-gradient(to right, color-mix(in srgb, var(--stitch-color-surface-container-lowest, #000) 80%, transparent), transparent)",
                }}
              >
                <h2 className="mb-1 text-2xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                  PRO GEAR
                </h2>
                <p className="text-sm font-bold" style={{ color: "var(--stitch-color-primary)" }}>
                  LEVEL UP YOUR CONSOLE
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="hot-deals" className="mb-20 scroll-mt-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-white md:text-3xl"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                <span className="h-0.5 w-10" style={{ background: "var(--stitch-color-secondary)" }} />
                DEAL HOT
              </h2>
              <p className="mt-2" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Phần cứng được săn nhiều nhất với mức giá ưu đãi.
              </p>
            </div>
            <Link
              href={HOME_EXPLORE_HREF}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-1 font-bold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              Xem tất cả
              <span className="material-symbols-outlined text-sm" aria-hidden>
                open_in_new
              </span>
            </Link>
          </div>

          <HomeDesktopProductGrid products={hotProducts} />
        </section>

        <section id="new-drops" className="mb-20 scroll-mt-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="text-2xl font-black italic tracking-tighter text-white md:text-3xl"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                New Drops
              </h2>
              <p className="mt-2" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Sản phẩm mới cập nhật — cùng bộ lọc danh mục với Deal hot.
              </p>
            </div>
            <Link
              href={HOME_EXPLORE_HREF}
              className="flex min-h-[44px] items-center gap-2 rounded-lg px-1 font-bold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              Xem tất cả
              <span className="material-symbols-outlined text-sm" aria-hidden>
                open_in_new
              </span>
            </Link>
          </div>

          <HomeDesktopProductGrid products={newProducts} />
        </section>

        <section className="mb-12">
          <h2
            className="mb-8 text-2xl font-black italic tracking-tighter"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              color: "var(--stitch-color-on-surface-variant)",
            }}
          >
            DUYỆT PHỤ KIỆN
          </h2>
          <HomeCategoryChips categories={categories} variant="desktop" />
        </section>
      </main>
    </div>
  );
}
