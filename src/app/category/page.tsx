import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { PRODUCTS } from "@/data/products";
import { ProductCardActions } from "@/components/features/shop/shared/ProductCardActions";
import { StarRow } from "@/components/ui/StarRow";

type CategoryChip = {
  key: string;
  label: string;
  icon: string;
};

const CHIPS: CategoryChip[] = [
  { key: "memory", label: "memory", icon: "memory" },
  { key: "hardware", label: "Hardware", icon: "storage" },
  { key: "mouse", label: "mouse", icon: "mouse" },
  { key: "peripherals", label: "Peripherals", icon: "keyboard" },
  { key: "streaming", label: "Streaming", icon: "videocam" },
  { key: "headset", label: "headset", icon: "headphones" },
  { key: "audio", label: "Audio", icon: "headphones" },
];

const CATEGORY_TO_PRODUCT_IDS: Record<string, string[]> = {
  mouse: ["apex-pro-optical-mouse"],
  headset: ["sonic-blast-v2-headset"],
  hardware: ["apex-pro-optical-mouse", "steam-wallet-gift-card"],
  peripherals: ["apex-pro-optical-mouse", "elite-fusion-controller"],
  streaming: ["steam-wallet-gift-card"],
  memory: ["steam-wallet-gift-card"],
  audio: ["sonic-blast-v2-headset"],
};

function pickProductsForCategory(categoryKey?: string | null): Product[] {
  const key = (categoryKey ?? "").toLowerCase();
  if (!key || !CATEGORY_TO_PRODUCT_IDS[key]) return [...PRODUCTS];
  const ids = new Set(CATEGORY_TO_PRODUCT_IDS[key]);
  return PRODUCTS.filter((p) => ids.has(p.id));
}

export default async function CategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const selected = sp.category ?? "";
  const products = pickProductsForCategory(selected);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-screen-2xl px-5 pb-20 pt-28 md:px-12">
        <section className="mb-8 rounded-3xl p-5" style={{ background: "var(--stitch-color-surface-container-low)" }}>
          <div className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-primary)" }}>
            GRAPHICS VAULT | CYBERPULSE
          </div>
          <h1 className="mb-1 text-3xl font-black italic leading-tight" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            GRAPHICS VAULT
          </h1>
          <p style={{ color: "var(--stitch-color-on-surface-variant)" }} className="text-sm">
            High Performance
          </p>
        </section>

        {/* Chips */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Quick filters
            </div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-2" style={{ background: "var(--stitch-color-surface-container)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                tune
              </span>
              <span className="text-xs font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Filter
              </span>
            </div>
          </div>

          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {CHIPS.map((c) => {
              const active = c.key === selected.toLowerCase();
              return (
                <Link
                  key={c.key}
                  href={`/category?category=${encodeURIComponent(c.key)}`}
                  className="flex h-12 min-w-max items-center justify-center gap-2 rounded-2xl px-4 transition-all active:scale-95"
                  style={{
                    background: active
                      ? "color-mix(in srgb, var(--stitch-color-secondary-container) 35%, transparent)"
                      : "var(--stitch-color-surface-container-high)",
                    border: active
                      ? "1px solid color-mix(in srgb, var(--stitch-color-secondary) 25%, transparent)"
                      : "1px solid transparent",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{
                      color: active ? "var(--stitch-color-secondary)" : "var(--stitch-color-on-surface-variant)",
                    }}
                    aria-hidden
                  >
                    {c.icon}
                  </span>
                  <span className="text-sm font-bold">{c.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Product list */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-black italic tracking-tighter" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Products
            </h2>
            <div className="text-xs font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              {products.length} items
            </div>
          </div>

          <div className="space-y-4">
            {products.map((p) => {
              const subtitle =
                p.id === "apex-pro-optical-mouse"
                  ? "Engineered for elite competitive play"
                  : p.id === "sonic-blast-v2-headset"
                    ? "Aero-Kinetic comfort with ultra-low latency"
                    : p.id === "elite-fusion-controller"
                      ? "Performance Series — precision control"
                      : "Digital storefront for next-generation gaming";

              return (
                <div
                  key={p.id}
                  className="rounded-3xl p-4"
                  style={{ background: "var(--stitch-color-surface-container)", border: "0" }}
                >
                  <div className="flex gap-4">
                    <div
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl"
                      style={{ background: "var(--stitch-color-surface-container-low)" }}
                    >
                      <Image src={p.img} alt={p.title} fill className="object-cover" sizes="96px" unoptimized />
                    </div>

                    <div className="min-w-0 flex-1">
                      {("badge" in p && p.badge) || ("tag" in p && p.tag) ? (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {"badge" in p && p.badge ? (
                            <span className="rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ background: "var(--stitch-color-secondary)" }}>
                              {p.badge}
                            </span>
                          ) : null}
                          {"tag" in p && p.tag ? (
                            <span className="rounded-full px-3 py-1 text-[10px] font-black text-white" style={{ background: "var(--stitch-color-primary-dim, var(--stitch-color-primary))" }}>
                              {p.tag}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <StarRow filled={p.stars} reviews={p.reviews} />
                      <Link href={`/product/${p.id}`} className="block line-clamp-1 text-base font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                        {p.title}
                      </Link>
                      <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        {subtitle}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xl font-black" style={{ color: "var(--stitch-color-primary)" }}>
                          {p.price} <span className="text-[11px] font-normal">VND</span>
                        </p>
                      </div>
                    </div>

                    <div className="w-[150px] shrink-0">
                      <ProductCardActions product={p} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

