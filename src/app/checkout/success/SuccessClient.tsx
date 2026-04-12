"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatVndDisplay } from "@/data/products";
import { getOrder, type Order } from "@/lib/orders";

type ServerOrderRow = {
  id: string;
  created_at: string;
  customer: Order["customer"];
  lines: Order["lines"];
  subtotal_vnd: number;
  shipping_vnd: number;
  total_vnd: number;
};

export function SuccessClient() {
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";

  const localOrder = useMemo(() => (orderId ? getOrder(orderId) : null), [orderId]);
  const [serverOrder, setServerOrder] = useState<Order | null>(null);
  // Avoid a 1-frame "not found" flash before the first effect runs.
  const [loading, setLoading] = useState<boolean>(() => Boolean(orderId) && !localOrder);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!orderId) return;
      // If we already have a local order, don't block UI with a fetch.
      // We'll still try to fetch in the background to replace with canonical server data.
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
        const json = (await res.json()) as { order?: unknown };
        if (!res.ok || !json.order) return;
        const o = json.order as Partial<ServerOrderRow>;
        if (
          !o.id ||
          !o.created_at ||
          !o.customer ||
          !o.lines ||
          typeof o.subtotal_vnd !== "number" ||
          typeof o.shipping_vnd !== "number" ||
          typeof o.total_vnd !== "number"
        ) {
          return;
        }
        const mapped: Order = {
          id: o.id,
          createdAt: o.created_at,
          customer: o.customer,
          lines: o.lines,
          subtotalVnd: o.subtotal_vnd,
          shippingVnd: o.shipping_vnd,
          totalVnd: o.total_vnd,
        };
        if (!cancelled) setServerOrder(mapped);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const order = serverOrder ?? localOrder;

  return (
    <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
      <div
        className="rounded-3xl border p-10 text-center"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        }}
      >
        <span
          className="material-symbols-outlined mb-4 text-5xl"
          style={{ color: "var(--stitch-color-tertiary, var(--stitch-color-secondary))" }}
        >
          check_circle
        </span>

        <h1 className="mb-2 text-xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
          Đặt hàng thành công
        </h1>

        {!order && loading ? (
          <p className="mb-8 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Đang tải thông tin đơn hàng...
          </p>
        ) : order ? (
          <>
            <p className="mb-6 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Cảm ơn bạn, <span className="font-semibold text-white">{order.customer.name}</span>. Mã đơn hàng của bạn là{" "}
              <span className="font-black" style={{ color: "var(--stitch-color-primary)" }}>
                {order.id}
              </span>
              .
            </p>

            <div
              className="mx-auto mb-8 max-w-md rounded-2xl border p-5 text-left"
              style={{
                background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <span>Tạm tính</span>
                <span className="tabular-nums text-white">{formatVndDisplay(order.subtotalVnd)} VND</span>
              </div>
              <div className="mt-2 flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <span>Vận chuyển</span>
                <span className="tabular-nums text-white">
                  {order.shippingVnd === 0 ? "Miễn phí" : `${formatVndDisplay(order.shippingVnd)} VND`}
                </span>
              </div>
              <div className="mt-3 flex justify-between text-base font-black">
                <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                  {formatVndDisplay(order.totalVnd)} VND
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="mb-8 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Không tìm thấy đơn hàng để hiển thị. Vui lòng kiểm tra lại đường dẫn hoặc đặt hàng lại.
          </p>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold transition active:scale-95"
            style={{
              background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
              color: "var(--stitch-color-on-primary)",
            }}
          >
            Tiếp tục mua sắm
          </Link>
          <Link
            href={
              orderId
                ? `/orders?tab=pending&orderId=${encodeURIComponent(orderId)}`
                : "/orders"
            }
            className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold transition active:scale-95"
            style={{
              background: "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
              color: "var(--stitch-color-primary)",
            }}
          >
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </main>
  );
}

