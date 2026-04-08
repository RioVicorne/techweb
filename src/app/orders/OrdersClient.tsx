"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatVndDisplay } from "@/data/products";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type OrderRow = {
  id?: string;
  order_code: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
  first_item?: { title: string; image: string; qty: number } | null;
};

type OrderDetail = {
  id: string;
  created_at: string;
  customer: { name: string; phone: string; email: string; address: string; note?: string };
  lines: unknown[];
  subtotal_vnd: number;
  shipping_vnd: number;
  total_vnd: number;
};

const STATUS_TABS: Array<{ key: string; label: string; icon: string; statuses: string[] }> = [
  { key: "pending", label: "Chờ xác nhận", icon: "hourglass_top", statuses: ["PENDING_PAYMENT", "PENDING_CONFIRMATION"] },
  { key: "preparing", label: "Đang chuẩn bị", icon: "inventory_2", statuses: ["CONFIRMED", "PROCESSING", "PACKING"] },
  { key: "shipping", label: "Đang giao", icon: "local_shipping", statuses: ["SHIPPING", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
  { key: "delivered", label: "Đã giao", icon: "verified", statuses: ["DELIVERED", "COMPLETED"] },
];

function statusLabel(s: string) {
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

function tabColor(tabKey: string) {
  // Keep vibrant, distinct colors for the timeline icons (mobile).
  switch (tabKey) {
    case "pending":
      return { fg: "var(--stitch-color-secondary, #f59e0b)", bg: "color-mix(in srgb, var(--stitch-color-secondary, #f59e0b) 18%, transparent)" };
    case "preparing":
      return { fg: "var(--stitch-color-tertiary, #8b5cf6)", bg: "color-mix(in srgb, var(--stitch-color-tertiary, #8b5cf6) 18%, transparent)" };
    case "shipping":
      return { fg: "var(--stitch-color-primary, #22c55e)", bg: "color-mix(in srgb, var(--stitch-color-primary, #22c55e) 18%, transparent)" };
    case "delivered":
      return { fg: "var(--stitch-color-success, #10b981)", bg: "color-mix(in srgb, var(--stitch-color-success, #10b981) 18%, transparent)" };
    default:
      return { fg: "var(--stitch-color-primary)", bg: "color-mix(in srgb, var(--stitch-color-primary) 18%, transparent)" };
  }
}

export function OrdersClient() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const tabKey = (params.get("tab") || "pending").trim();
  const orderId = (params.get("orderId") || "").trim();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const activeTab = useMemo(() => STATUS_TABS.find((t) => t.key === tabKey) ?? STATUS_TABS[0], [tabKey]);

  const filteredOrders = useMemo(() => {
    const allow = new Set(activeTab.statuses);
    return orders.filter((o) => allow.has(String(o.status || "")));
  }, [orders, activeTab.statuses]);

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
        const [ordersRes, countsRes] = await Promise.all([
          fetch("/api/account/orders", { method: "GET", headers: { authorization: `Bearer ${token}` } }),
          fetch("/api/account/order-status-counts", { method: "GET", headers: { authorization: `Bearer ${token}` } }),
        ]);
        const ordersJson = (await ordersRes.json()) as { orders?: OrderRow[] };
        const countsJson = (await countsRes.json()) as { counts?: Record<string, number> };
        if (!cancelled) {
          setOrders(Array.isArray(ordersJson.orders) ? ordersJson.orders : []);
          setCounts(countsJson.counts && typeof countsJson.counts === "object" ? countsJson.counts : {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!orderId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
        const json = (await res.json()) as { order?: unknown };
        if (!res.ok || !json.order) {
          if (!cancelled) setDetail(null);
          return;
        }
        if (!cancelled) setDetail(json.order as OrderDetail);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
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

            <div className="flex items-center justify-between gap-3 sm:grid sm:grid-cols-4">
            {STATUS_TABS.map((t) => {
              const n = t.statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
              const active = t.key === activeTab.key;
              const c = tabColor(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  className="relative rounded-2xl p-0 text-center transition active:scale-[0.99] sm:rounded-2xl sm:border sm:p-3"
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
                          className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
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
              <h2 className="text-base font-black text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                {activeTab.label}
              </h2>
              <Link href="/checkout" className="text-sm font-black transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
                Mua thêm
              </Link>
            </div>

            {loading ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải...
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
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
                          <div className="flex items-center justify-between gap-3">
                            <div className="truncate text-sm font-black text-white">RioShop</div>
                            <div className="text-xs font-black" style={{ color: "var(--stitch-color-primary)" }}>
                              {statusLabel(String(o.status || ""))}
                            </div>
                          </div>

                          <div className="mt-1 line-clamp-2 text-sm font-bold text-white">
                            {o.first_item?.title || o.order_code}
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                              {new Date(o.created_at).toLocaleString()}
                              {o.first_item?.qty ? ` • x${o.first_item.qty}` : ""}
                            </div>
                            <div className="text-sm font-black" style={{ color: "var(--stitch-color-on-surface)" }}>
                              {formatVndDisplay(Number(o.total) || 0)} {o.currency || "VND"}
                            </div>
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
                        Mã đơn: <span className="text-white">{o.order_code}</span>
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
            <h2 className="text-base font-black text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Chi tiết đơn
            </h2>
            {orderId ? (
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

          {!orderId ? (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Chọn một đơn hàng để xem tiến độ giao hàng và địa chỉ.
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
                <div className="mt-1 text-sm font-black text-white">{detail.id}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  {new Date(detail.created_at).toLocaleString()}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Tạm tính</span>
                  <span className="tabular-nums text-white">{formatVndDisplay(detail.subtotal_vnd)} VND</span>
                </div>
                <div className="mt-2 flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Vận chuyển</span>
                  <span className="tabular-nums text-white">
                    {detail.shipping_vnd === 0 ? "Miễn phí" : `${formatVndDisplay(detail.shipping_vnd)} VND`}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-base font-black">
                  <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                  <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                    {formatVndDisplay(detail.total_vnd)} VND
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Giao tới
                </div>
                <div className="mt-1 text-sm font-black text-white">{detail.customer?.name || "—"}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  {detail.customer?.phone ? `SĐT: ${detail.customer.phone}` : null}
                  {detail.customer?.phone && detail.customer?.email ? " • " : null}
                  {detail.customer?.email ? `Email: ${detail.customer.email}` : null}
                </div>
                <div className="mt-2 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Địa chỉ: <span className="text-white">{detail.customer?.address || "—"}</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border p-4"
                   style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)" }}>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Tiến độ
                </div>
                <div className="mt-3 grid gap-3">
                  {[
                    { label: "Chờ xác nhận", icon: "hourglass_top" },
                    { label: "Đang chuẩn bị", icon: "inventory_2" },
                    { label: "Đang giao", icon: "local_shipping" },
                    { label: "Đã giao", icon: "verified" },
                  ].map((s, idx) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{
                          background:
                            idx === 0
                              ? "color-mix(in srgb, var(--stitch-color-primary) 25%, transparent)"
                              : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                          color: "var(--stitch-color-primary)",
                          border:
                            "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
                        }}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden>
                          {s.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white">{s.label}</div>
                        <div className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                          {idx === 0 ? "Trạng thái hiện tại hiển thị theo hệ thống" : "—"}
                        </div>
                      </div>
                    </div>
                  ))}
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

