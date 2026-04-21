import type { CatalogProduct } from "@/lib/catalog";

/** Badge trái-trên, tag phải-trên — dùng chung cho mọi thẻ sản phẩm trên home. */
export function HomeProductCardBadges({ product }: { product: CatalogProduct }) {
  const badge = "badge" in product && product.badge ? product.badge : null;
  const tag = "tag" in product && product.tag ? product.tag : null;
  if (!badge && !tag) return null;
  return (
    <>
      {badge ? (
        <div
          className="absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-black text-[var(--stitch-color-on-secondary)]"
          style={{ background: "var(--stitch-color-secondary)" }}
        >
          {badge}
        </div>
      ) : null}
      {tag ? (
        <div
          className="absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-black text-[var(--stitch-color-on-primary)]"
          style={{ background: "var(--stitch-color-primary-dim, var(--stitch-color-primary))" }}
        >
          {tag}
        </div>
      ) : null}
    </>
  );
}
