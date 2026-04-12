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
  address_line?: string;
  city?: string;
  note?: string;
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
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!openStatusMenuId) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest("[data-status-menu-root='true']")) {
        setOpenStatusMenuId(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenStatusMenuId(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openStatusMenuId]);

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

  const renderOrderTable = (orderList: OrderRow[]) => (
    <div
      className="overflow-x-auto rounded-3xl border shadow-xl"
      style={{
        borderColor: "rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <table className="w-full min-w-[900px] text-left text-sm border-collapse">
        <thead>
          <tr
            style={{
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">Đơn hàng & Sản phẩm</th>
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">Khách hàng & Địa chỉ</th>
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">Thanh toán</th>
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {orderList.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Không có đơn hàng nào trong mục này.
              </td>
            </tr>
          ) : (
            orderList.map((o) => {
              const currentIndex = (ADMIN_ORDER_STATUSES as readonly string[]).indexOf(o.status);
              const statusOptions = (ADMIN_ORDER_STATUSES as readonly string[]).filter((s, idx) => {
                if (s === "CANCELLED") return o.status !== "COMPLETED" && o.status !== "CANCELLED";
                return idx >= currentIndex;
              });
              const isLocked = updatingId === o.id || o.status === "COMPLETED" || o.status === "CANCELLED";
              const nextStatuses = statusOptions.filter((s) => s !== o.status);
              const isOpen = openStatusMenuId === o.id && !isLocked;

              return (
                <tr
                  key={o.id}
                  className="group transition-all hover:bg-white/[0.04]"
                >
                  {/* Cột 1: Thông tin đơn & Sản phẩm đại diện */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg tracking-tighter text-white">#{o.order_code}</span>
                      </div>

                      {o.first_item?.title ? (
                        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2 pr-4 ring-1 ring-white/10">
                          {o.first_item.image && (
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/20">
                              <img src={o.first_item.image} alt="" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-xs font-bold text-white/90">
                              {o.first_item.title}
                            </div>
                            <div className="mt-0.5 text-[10px] font-black text-[var(--stitch-color-primary)]">
                              SỐ LƯỢNG: {o.first_item.qty}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold italic opacity-30">Không có thông tin sản phẩm</div>
                      )}
                    </div>
                  </td>

                  {/* Cột 2: Khách hàng & Địa chỉ */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="text-sm font-black text-white">{o.full_name}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--stitch-color-primary)]">
                          <span className="material-symbols-outlined text-[14px]">phone</span>
                          {o.phone}
                        </div>
                      </div>

                      <div className="space-y-1.5 border-l-2 border-white/10 pl-3">
                        <div className="flex items-start gap-1.5 text-xs leading-relaxed opacity-70">
                          <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">location_on</span>
                          <span className="line-clamp-2">
                            {o.address_line}{o.city ? `, ${o.city}` : ""}
                          </span>
                        </div>
                        {o.note && (
                          <div className="flex items-start gap-1.5 text-[10px] leading-relaxed opacity-50 italic">
                            <span className="material-symbols-outlined text-[12px] mt-0.5 shrink-0">comment</span>
                            <span className="line-clamp-2">Lưu ý: {o.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột 3: Thanh toán */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex min-h-[84px] flex-col items-end justify-between gap-3 text-right">
                      <div className="text-xl font-black tabular-nums tracking-tighter text-white">
                        {formatVndDisplay(Number(o.total ?? 0))}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--stitch-color-primary)] opacity-80">
                        {o.currency || "VND"} • Trả trước
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                        {new Date(o.created_at).toLocaleDateString("vi-VN")} {new Date(o.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </td>

                  {/* Cột 4: Trạng thái & Thao tác */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-4">
                      <StatusBadge status={o.status} />
                      
                      <div className="relative" data-status-menu-root="true">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => setOpenStatusMenuId((prev) => (prev === o.id ? null : o.id))}
                          className="group/menu flex w-full items-center justify-between gap-2 rounded-2xl border bg-white/5 py-2 pl-3 pr-3 text-left text-[10px] font-black uppercase tracking-wide outline-none transition-all hover:bg-white/10 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-35"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            fontFamily: "var(--stitch-font-headline)",
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: getStatusColor(o.status) }}
                              aria-hidden
                            />
                            {statusLabelVi(o.status)}
                          </span>
                          <span className="material-symbols-outlined text-[16px] opacity-55 transition group-hover/menu:opacity-100">
                            {isOpen ? "expand_less" : "expand_more"}
                          </span>
                        </button>

                        {isOpen ? (
                          <div
                            className="absolute right-0 z-20 mt-2 w-full min-w-[170px] overflow-hidden rounded-2xl border bg-[#14171d] p-1.5 shadow-2xl backdrop-blur"
                            style={{ borderColor: "rgba(255,255,255,0.14)" }}
                          >
                            {nextStatuses.length === 0 ? (
                              <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-white/40">
                                Không còn bước tiếp theo
                              </div>
                            ) : (
                              nextStatuses.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-wide text-white/85 transition hover:bg-white/10"
                                  onClick={() => {
                                    setOpenStatusMenuId(null);
                                    void patchStatus(o.id, s);
                                  }}
                                >
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ background: getStatusColor(s) }}
                                    aria-hidden
                                  />
                                  {statusLabelVi(s)}
                                </button>
                              ))
                            )}
                          </div>
                        ) : null}
                      </div>

                      {updatingId === o.id && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--stitch-color-primary)] animate-pulse">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ĐANG CẬP NHẬT...
                        </div>
                      )}
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
          {orders.length === 0 ? (
            <div className="text-center text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Không có đơn hàng nào.
            </div>
          ) : (
            ADMIN_ORDER_STATUSES.map((status) => {
              const ordersForStatus = orders.filter((o) => o.status === status);
              if (ordersForStatus.length === 0) return null;

              return (
                <div key={status} className="space-y-4">
                  <h2 className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}>
                    {statusLabelVi(status)}
                  </h2>
                  {renderOrderTable(ordersForStatus)}
                </div>
              );
            })
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
