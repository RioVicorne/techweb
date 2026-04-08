import Image from "next/image";
import Link from "next/link";
import { HERO_IMG } from "@/components/features/home/shared/homeImages";
import { StarRow } from "@/components/ui/StarRow";
import type { CatalogProduct } from "@/lib/catalog";

export function HomeMobile({ products }: { products: CatalogProduct[] }) {
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
              href="#"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold transition-all active:scale-95"
              style={{
                background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                color: "var(--stitch-color-on-primary)",
              }}
            >
              Discover now
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
              Browse Gear
            </h2>
            <Link
              href="#"
              className="flex items-center gap-2 text-sm font-bold transition hover:underline"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              View All
              <span className="material-symbols-outlined text-sm" aria-hidden>
                open_in_new
              </span>
            </Link>
          </div>

          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: "storage", label: "Hardware", accent: "neutral" as const, categoryKey: "hardware" },
              { icon: "mouse", label: "mouse", accent: "primary" as const, categoryKey: "mouse" },
              { icon: "keyboard", label: "Peripherals", accent: "neutral" as const, categoryKey: "peripherals" },
              { icon: "videocam", label: "Streaming", accent: "neutral" as const, categoryKey: "streaming" },
              { icon: "headphones", label: "Audio", accent: "secondary" as const, categoryKey: "audio" },
            ].map((c) => {
              const isPri = c.accent === "primary";
              const isSec = c.accent === "secondary";
              return (
                <Link
                  key={c.label}
                  href={`/category?category=${encodeURIComponent(c.categoryKey)}`}
                  className="flex h-12 min-w-max items-center justify-center gap-2 rounded-2xl border px-4 transition-all active:scale-95"
                  style={{
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
                  }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{
                      color:
                        c.accent === "neutral"
                          ? "var(--stitch-color-on-surface-variant)"
                          : isSec
                            ? "var(--stitch-color-secondary)"
                            : "var(--stitch-color-primary)",
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
                Hot Deals
              </h2>
              <div
                className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black"
                style={{ background: "var(--stitch-color-secondary)", color: "white" }}
              >
                Ends in 04:22:10
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {products.slice(0, 2).map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-3xl p-4"
                style={{ background: "var(--stitch-color-surface-container)" }}
              >
                {"badge" in p && p.badge ? (
                  <div
                    className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black text-white"
                    style={{ background: "var(--stitch-color-secondary)" }}
                  >
                    {p.badge}
                  </div>
                ) : null}
                {"tag" in p && p.tag ? (
                  <div
                    className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-black text-white"
                    style={{ background: "var(--stitch-color-primary-dim, var(--stitch-color-primary))" }}
                  >
                    {p.tag}
                  </div>
                ) : null}

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
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <StarRow filled={p.stars} reviews={p.reviews} />
                      <Link
                        href={`/product/${p.id}`}
                        className="mt-1 block line-clamp-2 text-base font-bold leading-snug text-white"
                        style={{ fontFamily: "var(--stitch-font-headline)" }}
                      >
                        {p.title}
                      </Link>
                      <p className="mt-2 text-lg font-black" style={{ color: "var(--stitch-color-primary)" }}>
                        {p.price} <span className="text-xs font-normal">VND</span>
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

        <section className="mb-12">
          <h2
            className="mb-4 text-2xl font-black uppercase italic tracking-tighter text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            New Drops
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {products.slice(2).map((p) => (
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
                  <Image src={p.img} alt={p.title} fill className="object-cover" sizes="150px" unoptimized />
                </div>
                <p className="line-clamp-1 text-sm font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                  {p.title}
                </p>
                <p className="mt-2 text-base font-black" style={{ color: "var(--stitch-color-primary)" }}>
                  {p.price} <span className="text-[10px] font-normal">VND</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

