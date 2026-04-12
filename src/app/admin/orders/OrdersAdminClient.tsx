"use client";

import { useCallback, useEffect, useState } from "react";
import { formatVndDisplay } from "@/data/products";
import { ADMIN_ORDER_STATUSES } from "@/lib/admin-allowlist";

type OrderRow = {
  id: string;
  order_code: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
  full_name: string;
  phone: string;
  first_item?: { title: string; image: string; qty: number } | null;
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

export function OrdersAdminClient() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = filter ? `?status=${encodeURIComponent(filter)}&limit=100` : "?limit=100";
    const res = await fetch(`/api/admin/orders${q}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setError("Không tải được danh sách đơn");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { orders: OrderRow[] };
    setOrders(json.orders ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Cập nhật thất bại");
      return;
    }
    await load();
  }

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  const renderOrderTable = (orderList: OrderRow[]) => (
    <div
      className="overflow-x-auto rounded-2xl border"
      style={{
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
      }}
    >
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr
            style={{
              background: "color-mix(in srgb, var(--stitch-color-surface-container) 80%, transparent)",
            }}
          >
            <th className="px-4 py-3 font-medium">Đơn</th>
            <th className="px-4 py-3 font-medium">Khách</th>
            <th className="px-4 py-3 font-medium">Tổng</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {orderList.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Không có đơn.
              </td>
            </tr>
          ) : (
            orderList.map((o) => {
              const currentIndex = (ADMIN_ORDER_STATUSES as readonly string[]).indexOf(o.status);
              const statusOptions = (ADMIN_ORDER_STATUSES as readonly string[]).filter((s, idx) => {
                if (s === "CANCELLED") return o.status !== "COMPLETED" && o.status !== "CANCELLED";
                return idx >= currentIndex;
              });

              return (
                <tr
                  key={o.id}
                  className="group border-t transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 15%, transparent)",
                  }}
                >
                  <td className="px-4 py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-black tracking-tight text-white">{o.order_code}</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-60">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {new Date(o.created_at).toLocaleDateString("vi-VN")}
                        <span className="opacity-40">|</span>
                        {new Date(o.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {o.first_item?.title ? (
                      <div className="mt-3 flex items-start gap-2">
                        {o.first_item.image && (
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={o.first_item.image} alt="" className="h-full w-full object-cover opacity-80" />
                          </div>
                        )}
                        <div className="line-clamp-2 text-xs opacity-70 leading-relaxed">
                          {o.first_item.title}
                          {o.first_item.qty > 1 ? <span className="ml-1 font-bold text-[var(--stitch-color-primary)]">×{o.first_item.qty}</span> : ""}
                        </div>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="font-bold text-white">{o.full_name}</div>
                      <div className="flex items-center gap-1.5 text-xs opacity-60">
                        <span className="material-symbols-outlined text-[14px]">phone</span>
                        {o.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="text-base font-black tabular-nums tracking-tight" style={{ color: "var(--stitch-color-primary)" }}>
                        {formatVndDisplay(Number(o.total ?? 0))}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">{o.currency || "VND"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <div className="flex flex-col gap-3">
                      <StatusBadge status={o.status} />
                      <div className="relative">
                        <select
                          disabled={updatingId === o.id || o.status === "COMPLETED" || o.status === "CANCELLED"}
                          value={o.status}
                          onChange={(e) => void patchStatus(o.id, e.target.value)}
                          className="w-full appearance-none rounded-xl border bg-white/5 py-2 pl-3 pr-8 text-xs font-bold outline-none transition-all hover:bg-white/10 disabled:opacity-50"
                          style={{
                            borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 30%, transparent)",
                          }}
                        >
                          <option value={o.status} disabled>{statusLabelVi(o.status)}</option>
                          {statusOptions.filter(s => s !== o.status).map((s) => (
                            <option key={s} value={s} className="bg-[var(--stitch-color-surface-container-high)] text-sm">
                              → {statusLabelVi(s)}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] opacity-40">
                          unfold_more
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1
          className="text-2xl font-semibold tracking-tight md:text-3xl"
          style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}
        >
          Xử lý đơn hàng
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Lọc theo trạng thái và cập nhật tiến độ xử lý.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] opacity-60">filter_list</span>
          <label className="text-xs font-black uppercase tracking-widest opacity-60">Trạng thái</label>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border bg-transparent px-4 py-2 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-[var(--stitch-color-primary)]/50"
          style={{
            borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 40%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
        >
          <option value="" className="bg-[var(--stitch-color-surface-container-high)]">Tất cả đơn hàng</option>
          {ADMIN_ORDER_STATUSES.map((s) => (
            <option key={s} value={s} className="bg-[var(--stitch-color-surface-container-high)]">
              {statusLabelVi(s)}
            </option>
          ))}
        </select>
        {loading && (
          <div className="ml-auto flex items-center gap-2 text-xs font-bold opacity-60">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--stitch-color-primary)] border-t-transparent" />
            Đang cập nhật...
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đang tải...
        </p>
      ) : (
        <div className="space-y-8">
          {renderOrderTable(activeOrders)}

          {cancelledOrders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}>
                Các đơn hàng đã huỷ
              </h2>
              {renderOrderTable(cancelledOrders)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  return (
    <div 
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm"
      style={{ 
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`
      }}
    >
      <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {statusLabelVi(status)}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING_CONFIRMATION": return "#f59e0b"; // amber
    case "CONFIRMED": return "var(--stitch-color-primary)";
    case "SHIPPING": return "#3b82f6"; // blue
    case "COMPLETED": return "#10b981"; // emerald
    case "CANCELLED": return "var(--stitch-color-error)";
    default: return "#94a3b8";
  }
}
