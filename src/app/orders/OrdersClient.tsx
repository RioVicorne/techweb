"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatVndDisplay } from "@/data/products";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import {
  ORDER_PROGRESS_STEPS,
  ORDER_STATUS_TABS,
  orderRowStatusLabel,
  orderStatusTabColor,
} from "@/lib/order-status-tabs";
import { useLiveOrderTime } from "@/hooks/useLiveOrderTime";

const ORDERS_CACHE_TTL_MS = 15_000;
const ORDER_DETAIL_CACHE_TTL_MS = 15_000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type OrderRow = {
  id?: string;
  order_code: string;
  created_at: string;
  updated_at?: string | null;
  status: string;
  total: number;
  currency: string;
  first_item?: { title: string; image: string; qty: number } | null;
};

type OrderDetail = {
  id: string;
  created_at: string;
  status: string;
  customer: { name: string; phone: string; email: string; address: string; note?: string };
  lines: unknown[];
  subtotal_vnd: number;
  shipping_vnd: number;
  total_vnd: number;
};

type OrdersSummaryCacheValue = {
  orders: OrderRow[];
  counts: Record<string, number>;
};

type OrderDetailCacheValue = {
  order: OrderDetail | null;
};

const ordersSummaryCache = new Map<string, CacheEntry<OrdersSummaryCacheValue>>();
const ordersSummaryInFlight = new Map<string, Promise<OrdersSummaryCacheValue>>();

const orderDetailCache = new Map<string, CacheEntry<OrderDetailCacheValue>>();
const orderDetailInFlight = new Map<string, Promise<OrderDetailCacheValue>>();

function getCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function fetchOrdersSummary(token: string): Promise<OrdersSummaryCacheValue> {
  const cacheKey = token;
  const cached = getCachedValue(ordersSummaryCache, cacheKey);
  if (cached) return cached;

  const inFlight = ordersSummaryInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const req = (async () => {
    const res = await fetch("/api/account/orders-summary", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Failed to load orders summary (${res.status})`);
    }

    const json = (await res.json()) as {
      orders?: OrderRow[];
      counts?: Record<string, number>;
    };

    const value: OrdersSummaryCacheValue = {
      orders: Array.isArray(json.orders) ? json.orders : [],
      counts: json.counts && typeof json.counts === "object" ? json.counts : {},
    };

    setCachedValue(ordersSummaryCache, cacheKey, value, ORDERS_CACHE_TTL_MS);
    return value;
  })().finally(() => {
    ordersSummaryInFlight.delete(cacheKey);
  });

  ordersSummaryInFlight.set(cacheKey, req);
  return req;
}

async function fetchOrderDetail(token: string, orderId: string): Promise<OrderDetailCacheValue> {
  const cacheKey = `${token}:${orderId}`;
  const cached = getCachedValue(orderDetailCache, cacheKey);
  if (cached) return cached;

  const inFlight = orderDetailInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const req = (async () => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });

    if (res.status === 404) {
      const value: OrderDetailCacheValue = { order: null };
      setCachedValue(orderDetailCache, cacheKey, value, ORDER_DETAIL_CACHE_TTL_MS);
      return value;
    }

    if (!res.ok) {
      throw new Error(`Failed to load order detail (${res.status})`);
    }

    const json = (await res.json()) as { order?: unknown };
    const value: OrderDetailCacheValue = {
      order: json.order ? (json.order as OrderDetail) : null,
    };

    setCachedValue(orderDetailCache, cacheKey, value, ORDER_DETAIL_CACHE_TTL_MS);
    return value;
  })().finally(() => {
    orderDetailInFlight.delete(cacheKey);
  });

  orderDetailInFlight.set(cacheKey, req);
  return req;
}

function OrderCreatedAtLabel({ iso }: { iso: string }) {
  const label = useLiveOrderTime(iso);
  return <>{label}</>;
}

function orderEventTimeIso(order: OrderRow): string {
  if (order.status === "CANCELLED") {
    const cancelledAt = String(order.updated_at ?? "").trim();
    if (cancelledAt) return cancelledAt;
  }
  return order.created_at;
}

export function OrdersClient() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const tabKeyRaw = (params.get("tab") || "").trim();
  const orderId = (params.get("orderId") || "").trim();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const activeTab = useMemo(
    () => (tabKeyRaw ? ORDER_STATUS_TABS.find((t) => t.key === tabKeyRaw) ?? null : null),
    [tabKeyRaw],
  );

  const filteredOrders = useMemo(() => {
    if (!activeTab) return [];
    const allow = new Set(activeTab.statuses);
    return orders.filter((o) => allow.has(String(o.status || "")));
  }, [orders, activeTab]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token || "";
        if (!token) {
          router.replace(`/login?returnTo=${encodeURIComponent("/orders")}`);
          return;
        }

        const summary = await fetchOrdersSummary(token);
        if (!cancelled) {
          setOrders(summary.orders);
          setCounts(summary.counts);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setCounts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!orderId || !activeTab) {
        setDetail(null);
        setDetailLoading(false);
        return;
      }

      setDetailLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token || "";
        if (!token) {
          if (!cancelled) setDetail(null);
          return;
        }

        const detailResult = await fetchOrderDetail(token, orderId);
        if (!cancelled) {
          setDetail(detailResult.order);
        }
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId, activeTab, supabase]);

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Đơn hàng của bạn
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Theo dõi tiến độ giao hàng theo từng trạng thái.
          </p>
        </div>
        <Link href="/account" className="text-sm font-black transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
          Về tài khoản
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <section
          className="rounded-3xl border p-4 md:p-6 lg:col-span-7"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <div className="relative">
            {/* Mobile: icon-only status rail (Shopee/TikTok-like) */}
            <div
              className="absolute left-6 right-6 top-5 h-[2px] sm:hidden"
              style={{
                background:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 22%, transparent)",
              }}
              aria-hidden
            />

            <div className="flex items-center justify-between gap-2 sm:grid sm:grid-cols-5 sm:gap-3">
            {ORDER_STATUS_TABS.map((t) => {
              const n = t.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
              const active = t.key === activeTab?.key;
              const c = orderStatusTabColor(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  className="relative min-w-0 rounded-2xl p-0 text-center transition active:scale-[0.99] sm:rounded-2xl sm:border sm:p-3"
                  style={{
                    background: "transparent",
                    borderColor: active
                      ? "color-mix(in srgb, var(--stitch-color-primary) 45%, transparent)"
                      : "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                  }}
                  aria-pressed={active}
                  onClick={() => {
                    const sp = new URLSearchParams(params.toString());
                    sp.set("tab", t.key);
                    sp.delete("orderId");
                    router.push(`/orders?${sp.toString()}`);
                  }}
                >
                  {/* Mobile: circle icon only */}
                  <div className="sm:hidden">
                    <div
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        background: active ? c.bg : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                        color: c.fg,
                        border: active
                          ? `1px solid color-mix(in srgb, ${c.fg} 45%, transparent)`
                          : "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                      }}
                      aria-hidden
                    >
                      <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                    </div>
                  </div>

                  {/* Desktop/tablet: original card with label + count */}
                  <div className="hidden sm:block">
                    <div
                      className="relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background:
                          "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)",
                        color: "var(--stitch-color-primary)",
                      }}
                    >
                      <span className="material-symbols-outlined text-[22px]" aria-hidden>
                        {t.icon}
                      </span>
                      {n > 0 ? (
                        <span
                          className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-[var(--stitch-color-on-surface)]"
                          style={{ background: "var(--stitch-color-secondary)" }}
                          aria-label={`${n} đơn ${t.label}`}
                        >
                          {n > 99 ? "99+" : n}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="text-[11px] font-black leading-tight"
                      style={{ color: "var(--stitch-color-on-surface)" }}
                    >
                      {t.label}
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-black text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                {activeTab ? activeTab.label : "Đơn hàng"}
              </h2>
              <Link href="/checkout" className="text-sm font-black transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
                Mua thêm
              </Link>
            </div>

            {loading ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải...
              </p>
            ) : !activeTab ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Chọn một tab trạng thái phía trên để xem danh sách đơn đầy đủ.
              </p>
            ) : filteredOrders.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Chưa có đơn nào trong trạng thái này.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredOrders.map((o) => (
                  <button
                    key={o.order_code}
                    type="button"
                    className="w-full rounded-3xl border p-4 text-left transition hover:opacity-95 active:scale-[0.99]"
                    style={{
                      background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                      borderColor:
                        o.order_code === orderId
                          ? "color-mix(in srgb, var(--stitch-color-primary) 45%, transparent)"
                          : "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                    }}
                    onClick={() => {
                      const sp = new URLSearchParams(params.toString());
                      sp.set("orderId", o.order_code);
                      router.push(`/orders?${sp.toString()}`);
                    }}
                  >
                    <div className="flex w-full gap-3">
                      <div
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border"
                        style={{
                          background: "var(--stitch-color-surface-container-low)",
                          borderColor:
                            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                        }}
                      >
                        {o.first_item?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.first_item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center opacity-60">
                            <span className="material-symbols-outlined" aria-hidden>
                              inventory_2
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 truncate text-sm font-black text-[var(--stitch-color-on-surface)]">RioShop</div>
                          <div
                            className="shrink-0 text-right text-xs font-black leading-tight"
                            style={{ color: String(o.status || "") === "COMPLETED" ? "var(--stitch-color-success)" : "var(--stitch-color-primary)" }}
                          >
                            {orderRowStatusLabel(String(o.status || ""))}
                          </div>
                        </div>

                        <div className="mt-1 line-clamp-2 text-sm font-bold text-[var(--stitch-color-on-surface)]">
                          {o.first_item?.title || o.order_code}
                        </div>

                        <div className="mt-1 flex items-end justify-between gap-3">
                          <div className="min-w-0 text-xs leading-snug" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                            <OrderCreatedAtLabel iso={orderEventTimeIso(o)} />
                            {o.first_item?.qty ? ` • x${o.first_item.qty}` : ""}
                          </div>
                          <div
                            className="shrink-0 text-right text-sm font-black tabular-nums leading-tight"
                            style={{ color: "var(--stitch-color-on-surface)" }}
                          >
                            {formatVndDisplay(Number(o.total) || 0)} đ
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-4 rounded-2xl border px-4 py-3"
                      style={{
                        background:
                          "color-mix(in srgb, var(--stitch-color-secondary-container, var(--stitch-color-surface-container)) 55%, transparent)",
                        borderColor:
                          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-black" style={{ color: "var(--stitch-color-on-surface)" }}>
                            Ngày giao hàng dự kiến: —
                          </div>
                          <div className="mt-1 truncate text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                            Theo dõi đơn để xem tiến độ cập nhật mới nhất.
                          </div>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                          chevron_right
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-3">
                      <div className="text-xs font-black" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        Mã đơn: <span className="text-[var(--stitch-color-on-surface)]">{o.order_code}</span>
                      </div>
                      <span
                        className="inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-black transition active:scale-[0.99]"
                        style={{
                          background:
                            "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                          color: "var(--stitch-color-primary)",
                          border:
                            "1px solid color-mix(in srgb, var(--stitch-color-primary) 35%, transparent)",
                        }}
                      >
                        Theo dõi đơn
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside
          className="rounded-3xl border p-4 md:p-6 lg:col-span-5"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-black text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Chi tiết đơn
            </h2>
            {orderId && activeTab ? (
              <button
                type="button"
                className="text-sm font-black transition hover:underline"
                style={{ color: "var(--stitch-color-primary)" }}
                onClick={() => {
                  const sp = new URLSearchParams(params.toString());
                  sp.delete("orderId");
                  router.push(`/orders?${sp.toString()}`);
                }}
              >
                Đóng
              </button>
            ) : null}
          </div>

          {!activeTab ? (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Chọn tab trạng thái bên trái trước; sau đó chọn một đơn để xem chi tiết đầy đủ (tiến độ, địa chỉ, tổng tiền).
            </p>
          ) : !orderId ? (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Chọn một đơn hàng trong danh sách để xem tiến độ giao hàng và địa chỉ.
            </p>
          ) : detailLoading ? (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Đang tải chi tiết...
            </p>
          ) : detail ? (
            <>
              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Mã đơn
                </div>
                <div className="mt-1 text-sm font-black text-[var(--stitch-color-on-surface)]">{detail.id}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <OrderCreatedAtLabel iso={detail.created_at} />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Tạm tính</span>
                  <span className="tabular-nums text-[var(--stitch-color-on-surface)]">{formatVndDisplay(detail.subtotal_vnd)} đ</span>
                </div>
                <div className="mt-2 flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Vận chuyển</span>
                  <span className="tabular-nums text-[var(--stitch-color-on-surface)]">
                    {detail.shipping_vnd === 0 ? "Miễn phí" : `${formatVndDisplay(detail.shipping_vnd)} đ`}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-base font-black">
                  <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                  <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                    {formatVndDisplay(detail.total_vnd)} đ
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Giao tới
                </div>
                <div className="mt-1 text-sm font-black text-[var(--stitch-color-on-surface)]">{detail.customer?.name || "—"}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  {detail.customer?.phone ? `SĐT: ${detail.customer.phone}` : null}
                  {detail.customer?.phone && detail.customer?.email ? " • " : null}
                  {detail.customer?.email ? `Email: ${detail.customer.email}` : null}
                </div>
                <div className="mt-2 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Địa chỉ: <span className="text-[var(--stitch-color-on-surface)]">{detail.customer?.address || "—"}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Tiến độ
                </div>
                <div className="mt-3 grid gap-3">
                  {ORDER_PROGRESS_STEPS.map((s, idx) => {
                    // Simple logic: if progress is further, show as completed
                    const statusChain = ["PENDING_CONFIRMATION", "CONFIRMED", "SHIPPING", "COMPLETED"];
                    const currentIdx = statusChain.indexOf(detail.status);
                    const isPassed = currentIdx >= idx;
                    const isCancelled = detail.status === "CANCELLED";

                    return (
                      <div key={s.label} className="flex items-center gap-3" style={{ opacity: isCancelled && idx > 0 ? 0.3 : 1 }}>
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                          style={{
                            background: isPassed 
                              ? "color-mix(in srgb, var(--stitch-color-primary) 25%, transparent)"
                              : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                            color: isPassed ? "var(--stitch-color-primary)" : "var(--stitch-color-on-surface-variant)",
                            border: "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]" aria-hidden>
                            {isPassed ? "check_circle" : s.icon}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black text-[var(--stitch-color-on-surface)]">
                            {s.label}
                          </div>
                          <div className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                            {detail.status === s.key ? "Trạng thái hiện tại" : isPassed ? "Đã hoàn thành" : "Chờ xử lý"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {detail.status === "CANCELLED" && (
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background: "var(--stitch-color-error-container)",
                          color: "var(--stitch-color-on-error-container)",
                          border: "1px solid var(--stitch-color-error)",
                        }}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden>cancel</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-[var(--stitch-color-on-surface)]">Đã hủy</div>
                        <div className="text-xs opacity-60">Đơn hàng đã được quản trị viên hủy</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Không tìm thấy đơn hàng.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}

