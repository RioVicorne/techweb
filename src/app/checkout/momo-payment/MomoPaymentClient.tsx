"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type OrderInfo = {
  id: string;
  order_code?: string | null;
  total_vnd?: number | null;
  payment_status?: string | null;
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  AWAITING_PAYMENT: "Đang chờ thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

export function MomoPaymentClient() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Thiếu orderId");
      return;
    }

    let cancelled = false;
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
        const json = (await res.json()) as { order?: OrderInfo };
        if (!res.ok || !json.order) throw new Error("Không tìm thấy đơn hàng");
        if (cancelled) return;
        setOrder(json.order);

        const ps = (json.order.payment_status || "").toUpperCase();
        if (ps === "PAID") {
          router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải thông tin đơn hàng");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (loading) {
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
          <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Đang tải...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor: "color-mix(in srgb, var(--stitch-color-error, #f87171) 20%, transparent)",
          }}
        >
          <h1 className="mb-2 text-xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Lỗi
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            {error}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold transition active:scale-95"
            style={{
              background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
              color: "var(--stitch-color-on-primary)",
            }}
          >
            Về cửa hàng
          </Link>
        </div>
      </main>
    );
  }

  const paymentStatus = (order?.payment_status || "AWAITING_PAYMENT").toUpperCase();
  const label = PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus;
  const orderCode = order?.order_code || order?.id || orderId;

  return (
    <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
      <div className="mb-6 text-center">
        <h1
          className="text-2xl font-black italic tracking-tighter text-white"
          style={{ fontFamily: "var(--stitch-font-headline)" }}
        >
          Thanh toán MoMo
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Hoàn tất thanh toán trong ứng dụng MoMo, trang sẽ tự cập nhật.
        </p>
      </div>

      <div
        className="rounded-3xl border p-6 text-center"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        }}
      >
        <div className="text-sm font-black uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Mã đơn
        </div>
        <div className="mt-2 text-2xl font-black tracking-tighter text-white">#{orderCode}</div>

        <div className="mt-6 text-sm font-black uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Trạng thái thanh toán
        </div>
        <div
          className="mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black"
          style={{
            background: "color-mix(in srgb, var(--stitch-color-secondary, var(--stitch-color-primary)) 15%, transparent)",
            color: "var(--stitch-color-secondary, var(--stitch-color-primary))",
          }}
        >
          <span className="material-symbols-outlined text-[18px] animate-pulse" aria-hidden>
            sync
          </span>
          {label}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.98]"
            style={{
              background: "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
              color: "var(--stitch-color-primary)",
            }}
          >
            <span className="material-symbols-outlined" aria-hidden>
              refresh
            </span>
            Tải lại trạng thái
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.98]"
            style={{
              background: "transparent",
              color: "var(--stitch-color-on-surface-variant)",
              border:
                "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
            }}
          >
            <span className="material-symbols-outlined" aria-hidden>
              store
            </span>
            Về cửa hàng
          </Link>
        </div>
      </div>
    </main>
  );
}

