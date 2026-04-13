"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductCardActions } from "@/components/features/shop/shared/ProductCardActions";
import { StickyProductCTA } from "@/components/features/shop/shared/StickyProductCTA";
import { MetricCard } from "@/components/features/product/shared/MetricCard";
import { ProductHeroCarousel } from "@/components/features/product/shared/ProductHeroCarousel";
import { ProductReviewsSection } from "@/components/features/product/shared/ProductReviewsSection";

type RelatedProduct = {
  id: string;
  title: string;
  price: string;
  reviews: string;
  stars: number;
  img: string;
};

export function ProductDetailClient({ product, productId }: { product: Product; productId: number }) {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/catalog/products/${product.id}/related`);
        if (res.ok) {
          const data = await res.json();
          setRelatedProducts(data.products ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [product.id]);

  const metricLatency = "0.1ms";
  const metricSensor = "30K DPI";
  const metricBattery = "90 Hours";
  const metricBatteryPct = "90%";

  return (
    <>
      <main className="mx-auto max-w-screen-2xl px-5 pb-28 pt-24 md:px-12">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/"
                className="transition hover:text-[var(--stitch-color-primary)]"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Trang chủ
              </Link>
            </li>
            <li style={{ color: "var(--stitch-color-outline-variant, var(--stitch-color-outline))" }}>/</li>
            <li>
              <Link
                href="/category"
                className="transition hover:text-[var(--stitch-color-primary)]"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Sản phẩm
              </Link>
            </li>
            <li style={{ color: "var(--stitch-color-outline-variant, var(--stitch-color-outline))" }}>/</li>
            <li style={{ color: "var(--stitch-color-on-surface)" }} className="font-medium">
              {product.title}
            </li>
          </ol>
        </nav>

        {/* Product Hero */}
        <section className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Images */}
          <div className="relative overflow-hidden rounded-3xl">
            <ProductHeroCarousel images={[product.img]} alt={product.title} />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: "var(--stitch-color-secondary-container)",
                  color: "var(--stitch-color-on-secondary-container)",
                }}
              >
                Performance Series
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <h1
              className="line-clamp-2 text-3xl font-black italic leading-tight tracking-tighter text-white md:text-4xl"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              {product.title}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <p className="text-2xl font-black md:text-3xl" style={{ color: "var(--stitch-color-primary)" }}>
                {product.price} <span className="text-base font-normal">VND</span>
              </p>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-lg"
                    style={{
                      fontVariationSettings: "'FILL' 1",
                      color: i <= product.stars ? "var(--stitch-color-secondary)" : "var(--stitch-color-outline-variant, var(--stitch-color-outline))",
                    }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                {product.reviews} đánh giá
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Engineered for elite competitive play. Pure kinetic energy, tuned for dominance.
            </p>

            {/* CTA - Desktop */}
            <div className="mt-6 hidden max-w-md md:block">
              <ProductCardActions product={product} />
            </div>

            {/* CTA - Mobile */}
            <div className="mt-5 md:hidden">
              <StickyProductCTA product={product} />
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="mb-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <MetricCard icon="speed" label="Latency" value={metricLatency} />
            <MetricCard icon="precision_manufacturing" label="Sensor" value={metricSensor} />
            <MetricCard icon="battery_charging_full" label="Battery Life" value={metricBattery} sub={metricBatteryPct} />
          </div>
        </section>

        {/* Specs */}
        <section className="mb-10">
          <h2
            className="mb-4 text-2xl font-black italic tracking-tighter text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Thông số kỹ thuật
          </h2>

          <div className="overflow-hidden rounded-2xl" style={{ background: "var(--stitch-color-surface-container)" }}>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b" style={{ borderColor: "var(--stitch-color-outline-variant, var(--stitch-color-outline))" }}>
                  <td className="flex items-center gap-2 px-4 py-3 font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>tune</span>
                    Connectivity
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Wireless, low-latency link tuned for competitive response. Ready for streaming + high-performance rigs.
                  </td>
                </tr>
                <tr className="border-b" style={{ borderColor: "var(--stitch-color-outline-variant, var(--stitch-color-outline))" }}>
                  <td className="flex items-center gap-2 px-4 py-3 font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>build</span>
                    Switch Type
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Precision-tuned switch design with consistent tactile feedback for high APM gameplay.
                  </td>
                </tr>
                <tr>
                  <td className="flex items-center gap-2 px-4 py-3 font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>zoom_out_map</span>
                    Weight &amp; Dimensions
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Lightweight build with balanced dimensions for long sessions and ergonomic control.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="user-feedback" className="mb-12 scroll-mt-28">
          <h2
            className="mb-6 text-2xl font-black italic tracking-tighter text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Đánh giá từ khách hàng
          </h2>
          <ProductReviewsSection productId={productId} />
        </section>

        {/* Related Products */}
        <section className="mb-12">
          <h2
            className="mb-6 text-2xl font-black italic tracking-tighter text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Sản phẩm liên quan
          </h2>

          {loadingRelated ? (
            <div
              className="rounded-3xl p-8 text-center"
              style={{ background: "var(--stitch-color-surface-container)" }}
            >
              <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải sản phẩm liên quan...
              </p>
            </div>
          ) : relatedProducts.length === 0 ? (
            <div
              className="rounded-3xl p-8 text-center"
              style={{ background: "var(--stitch-color-surface-container)" }}
            >
              <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Chưa có sản phẩm liên quan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/product/${rp.id}`}
                  className="group overflow-hidden rounded-3xl transition hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "var(--stitch-color-surface-container)" }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={rp.img}
                      alt={rp.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-bold text-white transition-colors group-hover:text-[var(--stitch-color-primary)]">
                      {rp.title}
                    </p>
                    <p className="mt-1 text-base font-black" style={{ color: "var(--stitch-color-primary)" }}>
                      {rp.price} <span className="text-xs font-normal">VND</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
