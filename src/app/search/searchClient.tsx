"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  title: string;
  price: string;
  img: string;
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function SearchClient() {
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  const qn = useMemo(() => norm(q), [q]);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch("/api/catalog/products", { method: "GET" });
        const json = (await res.json()) as { products?: Product[] };
        if (!cancelled) setProducts(Array.isArray(json.products) ? json.products : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const hits = useMemo(() => {
    if (!qn) return [];
    return products
      .filter((p) => norm(p.title || "").includes(qn))
      .slice(0, 30);
  }, [products, qn]);

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Tìm kiếm
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Từ khóa: <span className="font-black text-white">{q || "—"}</span>
          </p>
        </div>
        <Link href="/" className="text-sm font-black transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
          Về trang chủ
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đang tải sản phẩm...
        </p>
      ) : !qn ? (
        <p className="mt-6 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Nhập từ khóa để tìm sản phẩm.
        </p>
      ) : hits.length === 0 ? (
        <p className="mt-6 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Không tìm thấy sản phẩm phù hợp.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {hits.map((p) => (
            <Link
              key={p.id}
              href={`/product/${encodeURIComponent(p.id)}`}
              className="overflow-hidden rounded-3xl border transition hover:opacity-95 active:scale-[0.99]"
              style={{
                background: "var(--stitch-color-surface-container)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <div className="aspect-square w-full" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-black text-white">{p.title}</div>
                <div className="mt-2 text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                  {p.price} <span className="text-[10px] font-normal">VND</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

