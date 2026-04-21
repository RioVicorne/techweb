import Link from "next/link";
import { iconForCategorySlug } from "@/lib/nav-category-fallback";
import { getCatalogCategories, getCatalogProductsByCategorySlug } from "@/lib/catalog";
import { CategoryProductCard } from "@/components/category/CategoryProductCard";

type CategoryChip = {
  key: string;
  label: string;
  icon: string;
};
const DEFAULT_HERO = {
  headline: "Sản phẩm",
  sub: "Khám phá bộ sưu tập gaming gear đỉnh cao",
  gradient:
    "from-[color:color-mix(in_srgb,var(--stitch-color-primary)_30%,transparent)] via-[color:color-mix(in_srgb,var(--stitch-color-secondary)_20%,transparent)] to-transparent",
};

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const selected = (sp.category ?? "").toLowerCase();
  const categories = await getCatalogCategories();
  const chips: CategoryChip[] = categories.map((c) => ({
    key: c.slug,
    label: c.name,
    icon: iconForCategorySlug(c.slug),
  }));
  const products = await getCatalogProductsByCategorySlug(selected);

  // Hero data: use DB fields from the selected category, fallback to defaults
  const selectedCategory = selected ? categories.find((c) => c.slug === selected) : undefined;
  const hero = selectedCategory
    ? {
        headline: selectedCategory.heroHeadline || selectedCategory.name,
        sub: selectedCategory.heroSub || DEFAULT_HERO.sub,
        gradient: selectedCategory.heroGradient || DEFAULT_HERO.gradient,
      }
    : DEFAULT_HERO;
  const selectedLabel = selectedCategory?.name;

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-screen-xl pb-24 pt-20">

        {/* ── Hero Banner ── */}
        <section
          className="relative mx-4 mb-8 overflow-hidden rounded-3xl md:mx-8"
          style={{
            background: "var(--stitch-color-surface-container)",
            minHeight: "180px",
          }}
        >
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${hero.gradient}`} />
          {/* Decorative blobs */}
          <div
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--stitch-color-primary)" }}
          />
          <div
            className="absolute -bottom-8 left-1/3 h-48 w-48 rounded-full opacity-15 blur-2xl"
            style={{ background: "var(--stitch-color-secondary)" }}
          />

          <div className="relative flex items-center justify-between px-6 py-10 md:px-10">
            <div>
              {/* Breadcrumb */}
              <div className="mb-3 flex items-center gap-2 text-xs font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <Link href="/" className="hover:underline">Trang chủ</Link>
                <span className="material-symbols-outlined text-sm" aria-hidden>chevron_right</span>
                <Link href="/category" className="hover:underline">Danh mục</Link>
                {selectedLabel && (
                  <>
                    <span className="material-symbols-outlined text-sm" aria-hidden>chevron_right</span>
                    <span style={{ color: "var(--stitch-color-primary)" }}>{selectedLabel}</span>
                  </>
                )}
              </div>

              <h1
                className="text-3xl font-black italic tracking-tight md:text-4xl"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                {hero.headline}
              </h1>
              <p className="mt-2 max-w-md text-sm md:text-base" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                {hero.sub}
              </p>

              {/* Product count badge */}
              <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "var(--stitch-color-surface-container-high)" }}>
                <span className="material-symbols-outlined text-sm" style={{ color: "var(--stitch-color-primary)" }} aria-hidden>inventory_2</span>
                <span className="text-xs font-bold">
                  {products.length} sản phẩm
                </span>
              </div>
            </div>

            {/* Decorative icon */}
            {selected && (
              <div
                className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl md:flex"
                style={{ background: "color-mix(in srgb, var(--stitch-color-primary) 15%, transparent)" }}
              >
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{ color: "var(--stitch-color-primary)", fontVariationSettings: `"FILL" 1, "wght" 300, "GRAD" 0, "opsz" 48` }}
                  aria-hidden
                >
                  {iconForCategorySlug(selected)}
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="px-4 md:px-8">
          {/* ── Category Filter Chips ── */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Lọc theo danh mục
              </p>
              {selected && (
                <Link
                  href="/category"
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                  style={{
                    background: "var(--stitch-color-error-container)",
                    color: "var(--stitch-color-on-error-container)",
                  }}
                >
                  <span className="material-symbols-outlined text-sm" aria-hidden>close</span>
                  Xoá bộ lọc
                </Link>
              )}
            </div>

            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
              {/* All products chip */}
              <Link
                href="/category"
                className="flex h-11 min-w-max items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all duration-200 active:scale-95"
                style={{
                  background: !selected
                    ? "var(--stitch-color-primary)"
                    : "var(--stitch-color-surface-container-high)",
                  color: !selected
                    ? "var(--stitch-color-on-primary)"
                    : "var(--stitch-color-on-surface)",
                }}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden>apps</span>
                Tất cả
              </Link>

              {chips.map((c) => {
                const active = c.key === selected;
                return (
                  <Link
                    key={c.key}
                    href={`/category?category=${encodeURIComponent(c.key)}`}
                    className="flex h-11 min-w-max items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition-all duration-200 active:scale-95"
                    style={{
                      background: active
                        ? "var(--stitch-color-primary)"
                        : "var(--stitch-color-surface-container-high)",
                      color: active
                        ? "var(--stitch-color-on-primary)"
                        : "var(--stitch-color-on-surface)",
                      boxShadow: active ? "0 4px 14px color-mix(in srgb, var(--stitch-color-primary) 30%, transparent)" : "none",
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: `"FILL" ${active ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24` }}
                      aria-hidden
                    >
                      {c.icon}
                    </span>
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Product Grid ── */}
          <section>
            <div className="mb-6 flex items-end justify-between">
              <h2
                className="text-xl font-black italic tracking-tight"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                {selected && selectedLabel ? selectedLabel : "Tất cả sản phẩm"}
              </h2>
              <span className="text-xs font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                {products.length} kết quả
              </span>
            </div>

            {products.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-3xl py-20 text-center" style={{ background: "var(--stitch-color-surface-container)" }}>
                <span
                  className="material-symbols-outlined mb-4 text-6xl opacity-30"
                  style={{ fontVariationSettings: `"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 48` }}
                  aria-hidden
                >
                  inventory_2
                </span>
                <p className="text-lg font-bold">Không có sản phẩm</p>
                <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Danh mục này chưa có sản phẩm nào.
                </p>
                <Link
                  href="/category"
                  className="mt-6 rounded-2xl px-6 py-2.5 text-sm font-bold text-[var(--stitch-color-on-primary)] transition-all active:scale-95"
                  style={{ background: "var(--stitch-color-primary)" }}
                >
                  Xem tất cả sản phẩm
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <CategoryProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
