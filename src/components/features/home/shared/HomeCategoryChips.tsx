import Link from "next/link";
import {
  accentForCategorySlug,
  iconForCategorySlug,
  type CategoryChipAccent,
} from "@/lib/nav-category-fallback";

export type HomeCategoryChipItem = { slug: string; name: string };

function chipStyles(accent: CategoryChipAccent) {
  const isPri = accent === "primary";
  const isSec = accent === "secondary";
  return {
    background: isSec
      ? "color-mix(in srgb, var(--stitch-color-secondary-container) 20%, transparent)"
      : isPri
        ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 18%, transparent)"
        : "color-mix(in srgb, var(--stitch-color-surface-container-high) 90%, transparent)",
    borderColor: isSec
      ? "color-mix(in srgb, var(--stitch-color-secondary) 20%, transparent)"
      : isPri
        ? "color-mix(in srgb, var(--stitch-color-primary) 20%, transparent)"
        : "transparent",
    iconColor:
      accent === "neutral"
        ? "var(--stitch-color-on-surface-variant)"
        : isSec
          ? "var(--stitch-color-secondary)"
          : "var(--stitch-color-primary)",
  };
}

export function HomeCategoryChips({
  categories,
  variant,
}: {
  categories: HomeCategoryChipItem[];
  variant: "mobile" | "desktop";
}) {
  if (variant === "mobile") {
    return (
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {categories.map((c) => {
          const accent = accentForCategorySlug(c.slug);
          const st = chipStyles(accent);
          const icon = iconForCategorySlug(c.slug);
          return (
            <Link
              key={c.slug}
              href={`/category?category=${encodeURIComponent(c.slug)}`}
              className="flex h-12 min-h-[44px] min-w-max items-center justify-center gap-2 rounded-2xl border px-4 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
              style={{
                background: st.background,
                borderColor: st.borderColor,
              }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: st.iconColor }} aria-hidden>
                {icon}
              </span>
              <span className="text-sm font-bold">{c.name}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-4">
      {categories.map((c) => {
        const accent = accentForCategorySlug(c.slug);
        const isPri = accent === "primary";
        const isSec = accent === "secondary";
        const icon = iconForCategorySlug(c.slug);
        return (
          <Link
            key={c.slug}
            href={`/category?category=${encodeURIComponent(c.slug)}`}
            className="flex h-32 w-64 min-h-[44px] flex-shrink-0 items-center justify-center gap-4 rounded-2xl border transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
            style={{
              background: isSec
                ? "color-mix(in srgb, var(--stitch-color-secondary-container) 20%, transparent)"
                : isPri
                  ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)"
                  : "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
              borderColor: isSec
                ? "color-mix(in srgb, var(--stitch-color-secondary) 20%, transparent)"
                : isPri
                  ? "color-mix(in srgb, var(--stitch-color-primary) 20%, transparent)"
                  : "transparent",
            }}
          >
            <span
              className="material-symbols-outlined text-4xl"
              style={{
                color:
                  accent === "neutral"
                    ? "var(--stitch-color-on-surface-variant)"
                    : isSec
                      ? "var(--stitch-color-secondary)"
                      : "var(--stitch-color-primary)",
              }}
              aria-hidden
            >
              {icon}
            </span>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              {c.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
