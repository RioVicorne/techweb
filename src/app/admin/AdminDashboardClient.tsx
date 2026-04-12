"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatVndDisplay } from "@/data/products";

type Stats = {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  revenueVndAllTime: number;
  revenueVndLast30Days: number;
  lowStockCount: number;
  lowStockThreshold: number;
};

function statusLabelVi(s: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: "Chờ thanh toán",
    PENDING_CONFIRMATION: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang xử lý",
    PACKING: "Đang đóng gói",
    SHIPPING: "Đang giao",
    IN_TRANSIT: "Đang vận chuyển",
    OUT_FOR_DELIVERY: "Sắp giao",
    DELIVERED: "Đã giao",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
  };
  return map[s] ?? s;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats", {
        credentials: "include",
      });
      if (!res.ok) {
        if (!cancelled) setError(res.status === 403 ? "Không có quyền" : "Không tải được dữ liệu");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as Stats;
      if (!cancelled) setStats(json);
      setLoading(false);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusEntries = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.ordersByStatus).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  if (loading) {
    return (
      <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
        Đang tải số liệu...
      </p>
    );
  }

  if (error || !stats) {
    return <p className="text-sm text-red-500">{error ?? "Lỗi"}</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1
          className="text-2xl font-semibold tracking-tight md:text-3xl"
          style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}
        >
          Tổng quan
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Theo dõi đơn hàng, doanh thu và tồn kho.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng đơn"
          value={String(stats.totalOrders)}
          hint="Mọi trạng thái"
          icon="receipt_long"
        />
        <KpiCard
          title="Doanh thu 30 ngày"
          value={`${formatVndDisplay(stats.revenueVndLast30Days)} ₫`}
          hint="Trừ đơn đã hủy"
          icon="payments"
        />
        <KpiCard
          title="Doanh thu tích lũy"
          value={`${formatVndDisplay(stats.revenueVndAllTime)} ₫`}
          hint="Trừ đơn đã hủy"
          icon="account_balance_wallet"
        />
        <KpiCard
          title="SKU tồn thấp"
          value={String(stats.lowStockCount)}
          hint={`≤ ${stats.lowStockThreshold} khả dụng`}
          icon="warning"
          accent
        />
      </section>

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
        }}
      >
        <h2 className="text-sm font-semibold">Đơn theo trạng thái</h2>
        <ul className="mt-4 space-y-2">
          {statusEntries.length === 0 ? (
            <li className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Chưa có đơn.
            </li>
          ) : (
            statusEntries.map(([st, n]) => (
              <li key={st} className="flex items-center justify-between gap-3 text-sm">
                <span>{statusLabelVi(st)}</span>
                <span className="tabular-nums font-medium">{n}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{
            background: "color-mix(in srgb, var(--stitch-color-primary) 22%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
        >
          <span className="material-symbols-outlined text-[20px]">orders</span>
          Xử lý đơn
        </Link>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
          style={{
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 40%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
        >
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          Quản lý kho
        </Link>
      </div>
    </div>
  );
}

function KpiCard(props: {
  title: string;
  value: string;
  hint: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-4 md:p-5"
      style={{
        background: props.accent
          ? "color-mix(in srgb, var(--stitch-color-error, #ef4444) 12%, transparent)"
          : "var(--stitch-color-surface-container)",
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          {props.title}
        </p>
        <span className="material-symbols-outlined text-[22px]" style={{ opacity: 0.85 }}>
          {props.icon}
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold tabular-nums md:text-2xl">{props.value}</p>
      <p className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
        {props.hint}
      </p>
    </div>
  );
}
