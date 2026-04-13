import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductCardActions } from "@/components/features/shop/shared/ProductCardActions";
import { StickyProductCTA } from "@/components/features/shop/shared/StickyProductCTA";
import { MetricCard } from "@/components/features/product/shared/MetricCard";
import { ProductHeroCarousel } from "@/components/features/product/shared/ProductHeroCarousel";

export function ProductPageView({ product }: { product: Product }) {
  const metricLatency = "0.1ms";
  const metricSensor = "30K DPI";
  const metricBattery = "90 Hours";
  const metricBatteryPct = "90%";

  return (
    <>
      <main className="mx-auto max-w-screen-2xl px-5 pb-28 pt-24 md:px-12">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
            style={{ background: "var(--stitch-color-surface-container)", color: "var(--stitch-color-primary)" }}
          >
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Quay lại
          </Link>
        </div>

        <section className="relative mb-6 overflow-hidden rounded-3xl">
          <ProductHeroCarousel images={[product.img]} alt={product.title} />
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: "var(--stitch-color-secondary-container)",
                  color: "var(--stitch-color-on-secondary-container)",
                }}
              >
                {product.id === "apex-pro-optical-mouse" ? "bolt NEW TECH" : "Performance Series"}
              </span>
            </div>
        </section>

        <section className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1
                className="mt-3 line-clamp-2 text-3xl font-black italic leading-tight tracking-tighter text-white"
                style={{ fontFamily: "var(--stitch-font-headline)" }}
              >
                {product.title}
              </h1>
              <p className="mt-2 text-xl font-black" style={{ color: "var(--stitch-color-primary)" }}>
                {product.price} <span className="text-sm font-normal">đ</span>
              </p>
              <p className="mt-3 text-sm font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Engineered for elite competitive play. Pure kinetic energy, tuned for dominance.
              </p>

              <div className="mt-4 md:hidden">
                <StickyProductCTA product={product} />
              </div>

              <div className="mt-5 hidden max-w-md md:block">
                <ProductCardActions product={product} />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <MetricCard icon="speed" label="Latency" value={metricLatency} />
            <MetricCard icon="precision_manufacturing" label="Sensor" value={metricSensor} />
            <MetricCard icon="battery_charging_full" label="Battery Life" value={metricBattery} sub={metricBatteryPct} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Thông số kỹ thuật
          </h2>

          <div className="space-y-3">
            <details className="group rounded-3xl p-4" style={{ background: "var(--stitch-color-surface-container)" }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
                  <span className="material-symbols-outlined mr-2" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
                    tune
                  </span>
                  Connectivity
                </span>
                <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                  expand_more
                </span>
              </summary>
              <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Wireless, low-latency link tuned for competitive response. Ready for streaming + high-performance rigs.
              </div>
            </details>

            <details className="group rounded-3xl p-4" style={{ background: "var(--stitch-color-surface-container)" }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-sm font-bold">
                  <span className="material-symbols-outlined mr-2" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
                    build
                  </span>
                  Switch Type
                </span>
                <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                  expand_more
                </span>
              </summary>
              <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Precision-tuned switch design with consistent tactile feedback for high APM gameplay.
              </div>
            </details>

            <details className="group rounded-3xl p-4" style={{ background: "var(--stitch-color-surface-container)" }}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="text-sm font-bold">
                  <span className="material-symbols-outlined mr-2" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
                    zoom_out_map
                  </span>
                  Weight &amp; Dimensions
                </span>
                <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                  expand_more
                </span>
              </summary>
              <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Lightweight build with balanced dimensions for long sessions and ergonomic control.
              </div>
            </details>
          </div>
        </section>

        <section id="user-feedback" className="mb-10 scroll-mt-28">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Đánh giá từ người dùng
            </h2>
            <Link
              href="#user-feedback"
              className="min-h-[44px] text-sm font-bold transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] rounded"
              style={{ color: "var(--stitch-color-primary)" }}
            >
              Xem tất cả đánh giá
            </Link>
          </div>

          <div className="space-y-4">
            {[
              {
                name: "J.D",
                role: "Verified Operator",
                quote:
                  "The tactile feedback is unlike anything else. I've shaved 20ms off my reaction time in CS2. Pure kinetic energy.",
              },
              {
                name: "M0rtal_K",
                role: "Pro Circuit",
                quote: "Lightweight but feels premium. Software suite is robust. Best mouse for claw grippers.",
              },
            ].map((r) => (
              <div key={r.name} className="rounded-3xl p-4" style={{ background: "var(--stitch-color-surface-container)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{r.name}</span>
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-black"
                        style={{
                          background: "color-mix(in srgb, var(--stitch-color-secondary) 20%, transparent)",
                          color: "var(--stitch-color-on-surface-variant)",
                        }}
                      >
                        {r.role}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-sm"
                          style={{
                            fontVariationSettings: "'FILL' 1",
                            color: "var(--stitch-color-secondary)",
                          }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  “{r.quote}”
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Mobile CTAs are rendered near the price block above. */}
    </>
  );
}

