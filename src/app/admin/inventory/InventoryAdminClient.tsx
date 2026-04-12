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
          className="overflow-x-auto rounded-2xl border"
          style={{
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
          }}
        >
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr
                style={{
                  background: "color-mix(in srgb, var(--stitch-color-surface-container) 80%, transparent)",
                }}
              >
                <th className="px-4 py-3 font-medium">Sản phẩm</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Giá</th>
                <th className="px-4 py-3 font-medium">Tồn</th>
                <th className="px-4 py-3 font-medium">Giữ</th>
                <th className="px-4 py-3 font-medium">Khả dụng</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Không có dữ liệu biến thể.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.variantId}
                    className="border-t"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 15%, transparent)",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                          style={{
                            background:
                              "color-mix(in srgb, var(--stitch-color-outline-variant) 20%, transparent)",
                          }}
                        >
                          {r.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote catalog URLs vary by host
                            <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <div className="font-medium leading-tight">{r.productName}</div>
                          {r.variantName ? (
                            <div className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                              {r.variantName}
                            </div>
                          ) : null}
                          <div className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                            {r.productSlug} · {r.productStatus}
                            {!r.isActive ? " · ngưng" : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-xs">{r.sku}</td>
                    <td className="px-4 py-3 align-top tabular-nums">{formatVndDisplay(r.price)} ₫</td>
                    <td className="px-4 py-3 align-top tabular-nums">{r.quantityOnHand}</td>
                    <td className="px-4 py-3 align-top tabular-nums">{r.reserved}</td>
                    <td className="px-4 py-3 align-top tabular-nums font-medium">
                      <span
                        className={r.available <= 5 ? "text-amber-600 dark:text-amber-400" : undefined}
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
