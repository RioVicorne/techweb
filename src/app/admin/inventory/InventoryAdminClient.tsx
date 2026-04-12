"use client";

import { useCallback, useEffect, useState } from "react";
import { formatVndDisplay } from "@/data/products";

type InvRow = {
  variantId: number;
  sku: string;
  variantName: string | null;
  price: number;
  isActive: boolean;
  productId: number;
  productName: string;
  productSlug: string;
  productStatus: string;
  quantityOnHand: number;
  reserved: number;
  available: number;
  imageUrl: string;
};

export function InventoryAdminClient() {
  const [rows, setRows] = useState<InvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/products?limit=200", {
      credentials: "include",
    });
    if (!res.ok) {
      setError("Không tải được kho hàng");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { products: InvRow[] };
    setRows(json.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-2xl font-semibold tracking-tight md:text-3xl"
          style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}
        >
          Quản lý kho
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Tồn theo biến thể (SKU), đã trừ hàng giữ chỗ.
        </p>
      </header>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đang tải...
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-3xl border"
          style={{
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
            background: "var(--stitch-color-surface-container-low)"
          }}
        >
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr
                style={{
                  background: "color-mix(in srgb, var(--stitch-color-surface-container) 80%, transparent)",
                }}
              >
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Sản phẩm</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">SKU / Biến thể</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Đơn giá</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Tồn kho</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60">Giữ chỗ</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest opacity-60 text-right">Khả dụng</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center opacity-40">
                    <span className="material-symbols-outlined text-[40px] block mb-2">inventory_2</span>
                    Không có dữ liệu biến thể.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.variantId}
                    className="group border-t transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 15%, transparent)",
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl p-1"
                          style={{
                            background: "var(--stitch-color-surface-container-high)",
                            border: "1px solid color-mix(in srgb, var(--stitch-color-outline-variant) 20%, transparent)"
                          }}
                        >
                          {r.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.imageUrl} alt="" className="h-full w-full rounded-xl object-contain" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center opacity-20">
                              <span className="material-symbols-outlined">image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-white leading-tight">{r.productName}</div>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                            <span 
                              className="rounded px-1.5 py-0.5" 
                              style={{ 
                                background: r.productStatus === 'ACTIVE' ? 'var(--stitch-color-primary-container)' : 'var(--stitch-color-error-container)',
                                color: r.productStatus === 'ACTIVE' ? 'var(--stitch-color-on-primary-container)' : 'var(--stitch-color-on-error-container)'
                              }}
                            >
                              {r.productStatus}
                            </span>
                            <span className="opacity-40">{r.productSlug}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="font-mono text-[11px] font-bold tracking-tight opacity-80">{r.sku}</div>
                      {r.variantName && (
                        <div className="mt-1 text-xs font-medium opacity-60">{r.variantName}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle tabular-nums font-bold">
                      {formatVndDisplay(r.price)} <span className="text-[10px] font-normal opacity-40">₫</span>
                    </td>
                    <td className="px-5 py-4 align-middle tabular-nums opacity-60 font-bold">{r.quantityOnHand}</td>
                    <td className="px-5 py-4 align-middle tabular-nums opacity-60 font-bold">{r.reserved}</td>
                    <td className="px-5 py-4 align-middle text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-black tabular-nums transition-all`}
                        style={{
                          background: r.available <= 0 
                            ? "var(--stitch-color-error-container)" 
                            : r.available <= 5 
                              ? "color-mix(in srgb, #f59e0b 20%, transparent)" 
                              : "color-mix(in srgb, var(--stitch-color-primary) 15%, transparent)",
                          color: r.available <= 0 
                            ? "var(--stitch-color-on-error-container)" 
                            : r.available <= 5 
                              ? "#f59e0b" 
                              : "var(--stitch-color-primary)"
                        }}
                      >
                        {r.available}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
