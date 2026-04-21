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
    PENDING_CONFIRMATION: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
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
    return (
      <p className="text-sm" style={{ color: "var(--stitch-color-error)" }}>
        {error ?? "Lỗi"}
      </p>
    );
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
          value={`${formatVndDisplay(stats.revenueVndLast30Days)} đ`}
          hint="Trừ đơn đã hủy"
          icon="payments"
        />
        <KpiCard
          title="Doanh thu tích lũy"
          value={`${formatVndDisplay(stats.revenueVndAllTime)} đ`}
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
        className="rounded-3xl border p-6 md:p-8"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
        }}
      >
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider opacity-80">
          <span className="material-symbols-outlined text-[20px]">analytics</span>
          Đơn theo trạng thái
        </h2>
        <ul className="mt-6 flex flex-col gap-3">
          {statusEntries.length === 0 ? (
            <li className="text-sm opacity-60">
              Chưa có đơn.
            </li>
          ) : (
            statusEntries.map(([st, n]) => (
              <li 
                key={st} 
                className="flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition-transform hover:scale-[1.01]"
                style={{
                  background:
                    "color-mix(in srgb, var(--stitch-color-surface-container-high) 84%, transparent)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ background: getStatusColor(st) }}
                  />
                  <span>{statusLabelVi(st)}</span>
                </div>
                <span className="tabular-nums opacity-80">{n}</span>
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
      className="group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: props.accent
          ? "linear-gradient(135deg, color-mix(in srgb, var(--stitch-color-error) 20%, transparent), color-mix(in srgb, var(--stitch-color-error) 8%, transparent))"
          : "var(--stitch-color-surface-container)",
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
      }}
    >
      <div 
        className="absolute -right-4 -top-4 rotate-12 opacity-[0.03] transition-transform group-hover:scale-125"
        style={{ fontSize: "120px" }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>
          {props.icon}
        </span>
      </div>

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ 
              background: props.accent 
                ? "var(--stitch-color-error-container)" 
                : "var(--stitch-color-secondary-container)",
              color: props.accent
                ? "var(--stitch-color-on-error-container)"
                : "var(--stitch-color-on-secondary-container)"
            }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              {props.icon}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
            {props.title}
          </p>
        </div>
        
        <div>
          <p className="text-2xl font-black tabular-nums tracking-tighter md:text-3xl" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            {props.value}
          </p>
          <p className="mt-1 text-xs opacity-60">
            {props.hint}
          </p>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING_CONFIRMATION": return "var(--stitch-color-warning)";
    case "CONFIRMED": return "var(--stitch-color-primary)";
    case "SHIPPING": return "var(--stitch-color-secondary)";
    case "COMPLETED": return "var(--stitch-color-success)";
    case "CANCELLED": return "var(--stitch-color-error)";
    default: return "var(--stitch-color-outline)";
  }
}
