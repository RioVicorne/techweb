"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
  payment_method?: string | null;
  payment_status?: string | null;
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

function paymentStatusLabel(s: string) {
  const map: Record<string, string> = {
    UNPAID: "Chưa trả",
    AWAITING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã trả",
    REFUNDED: "Hoàn tiền",
  };
  return map[s] ?? s;
}

function paymentStatusColor(s: string) {
  switch (s) {
    case "PAID":
      return "var(--stitch-color-success)";
    case "AWAITING_PAYMENT":
      return "var(--stitch-color-warning)";
    case "REFUNDED":
      return "var(--stitch-color-on-surface-variant)";
    default:
      return "var(--stitch-color-on-surface-variant)";
  }
}

function PaymentMethodBadge({ method, status }: { method: string; status: string }) {
  const methodLabels: Record<string, string> = {
    BANK: "Chuyển khoản",
    MOMO: "MoMo",
    COD: "COD",
  };
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
        style={{
          background:
            "color-mix(in srgb, var(--stitch-color-surface-container-high) 70%, transparent)",
          color: "var(--stitch-color-on-surface-variant)",
          border:
            "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
        }}
      >
        {methodLabels[method] ?? method}
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
        style={{
          background: `color-mix(in srgb, ${paymentStatusColor(status)} 15%, transparent)`,
          color: paymentStatusColor(status),
          border: `1px solid color-mix(in srgb, ${paymentStatusColor(status)} 30%, transparent)`,
        }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: paymentStatusColor(status) }} />
        {paymentStatusLabel(status)}
      </span>
    </div>
  );
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
    const q = filter
      ? `?status=${encodeURIComponent(filter)}&limit=100`
      : "?limit=100";
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

  function applyOrderPatch(updated: {
    id: string;
    status?: string | null;
    payment_status?: string | null;
  }) {
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (o.id !== updated.id) return o;
        return {
          ...o,
          status: (updated.status ?? o.status) as string,
          payment_status: (updated.payment_status ?? o.payment_status) as string,
        };
      });
      // Nếu đang lọc theo status, order vừa đổi status có thể không còn thuộc filter.
      if (filter) return next.filter((o) => o.status === filter);
      return next;
    });
  }

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
    const j = (await res.json().catch(() => ({}))) as { order?: { id: string; status?: string; payment_status?: string } };
    if (j.order?.id) applyOrderPatch(j.order);
  }

  async function confirmBankPaidAndConfirmed(orderId: string) {
    setUpdatingId(orderId);
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "PAID", status: "CONFIRMED" }),
    });
    setUpdatingId(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Cập nhật thất bại");
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { order?: { id: string; status?: string; payment_status?: string } };
    if (j.order?.id) applyOrderPatch(j.order);
  }

  const renderOrderTable = (orderList: OrderRow[]) => (
    <div
      className="overflow-x-auto rounded-3xl border shadow-xl"
      style={{
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
        background:
          "color-mix(in srgb, var(--stitch-color-surface-container-low) 80%, transparent)",
      }}
    >
      <table className="w-full min-w-[900px] text-left text-sm border-collapse">
        <thead>
          <tr
            style={{
              background:
                "color-mix(in srgb, var(--stitch-color-surface-container-high) 85%, transparent)",
            }}
          >
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">
              Đơn hàng & Sản phẩm
            </th>
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">
              Khách hàng & Địa chỉ
            </th>
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">
              Thanh toán
            </th>
            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] opacity-40">
              Trạng thái
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)" }}>
          {orderList.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-12 text-center"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Không có đơn hàng nào trong mục này.
              </td>
            </tr>
          ) : (
            orderList.map((o) => {
              const currentIndex = (
                ADMIN_ORDER_STATUSES as readonly string[]
              ).indexOf(o.status);
              const statusOptions = (
                ADMIN_ORDER_STATUSES as readonly string[]
              ).filter((s, idx) => {
                if (s === "CANCELLED")
                  return o.status !== "COMPLETED" && o.status !== "CANCELLED";
                return idx >= currentIndex;
              });
              const isLocked =
                updatingId === o.id ||
                o.status === "COMPLETED" ||
                o.status === "CANCELLED";
              const nextStatuses = statusOptions.filter((s) => s !== o.status);
              const nextImmediate = nextStatuses[0] ?? "";

              return (
                <tr
                  key={o.id}
                  className="group transition-all"
                  style={{
                    background: "transparent",
                  }}
                >
                  {/* Cột 1: Thông tin đơn & Sản phẩm đại diện */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg tracking-tighter text-[var(--stitch-color-on-surface)]">
                          #{o.order_code}
                        </span>
                      </div>

                      {o.first_item?.title ? (
                        <div
                          className="flex items-center gap-3 rounded-2xl p-2 pr-4 ring-1"
                          style={{
                            background:
                              "color-mix(in srgb, var(--stitch-color-surface-container-high) 75%, transparent)",
                            boxShadow:
                              "inset 0 0 0 1px color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                          }}
                        >
                          {o.first_item.image && (
                            <div
                              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl"
                              style={{
                                background:
                                  "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 85%, transparent)",
                              }}
                            >
                              <Image
                                src={o.first_item.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-xs font-bold text-[var(--stitch-color-on-surface)]/90">
                              {o.first_item.title}
                            </div>
                            <div className="mt-0.5 text-[10px] font-black text-[var(--stitch-color-primary)]">
                              SỐ LƯỢNG: {o.first_item.qty}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold italic opacity-30">
                          Không có thông tin sản phẩm
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Cột 2: Khách hàng & Địa chỉ */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="text-sm font-black text-[var(--stitch-color-on-surface)]">
                          {o.full_name}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--stitch-color-primary)]">
                          <span className="material-symbols-outlined text-[14px]">
                            phone
                          </span>
                          {o.phone}
                        </div>
                      </div>

                      <div
                        className="space-y-1.5 border-l-2 pl-3"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
                        }}
                      >
                        <div className="flex items-start gap-1.5 text-xs leading-relaxed opacity-70">
                          <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">
                            location_on
                          </span>
                          <span className="line-clamp-2">
                            {o.address_line}
                            {o.city ? `, ${o.city}` : ""}
                          </span>
                        </div>
                        {o.note && (
                          <div className="flex items-start gap-1.5 text-[10px] leading-relaxed opacity-50 italic">
                            <span className="material-symbols-outlined text-[12px] mt-0.5 shrink-0">
                              comment
                            </span>
                            <span className="line-clamp-2">
                              Lưu ý: {o.note}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột 3: Thanh toán */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex min-h-[84px] flex-col items-end justify-between gap-3 text-right">
                      <div className="text-xl font-black tabular-nums tracking-tighter text-[var(--stitch-color-on-surface)]">
                        {formatVndDisplay(Number(o.total ?? 0))}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {o.payment_method ? (
                          <PaymentMethodBadge method={o.payment_method} status={o.payment_status ?? "UNPAID"} />
                        ) : (
                          <div className="text-[10px] font-black uppercase tracking-widest text-[var(--stitch-color-primary)] opacity-80">
                            đ
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--stitch-color-on-surface-variant)]">
                        {new Date(o.created_at).toLocaleDateString("vi-VN")}{" "}
                        {new Date(o.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {o.status !== "CANCELLED" &&
                      o.payment_method === "BANK" &&
                      o.payment_status === "AWAITING_PAYMENT" ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Xác nhận đơn ${o.order_code} đã thanh toán?`)) {
                              void confirmBankPaidAndConfirmed(o.id);
                            }
                          }}
                          className="mt-1 inline-flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider transition"
                          style={{
                            background:
                              "color-mix(in srgb, var(--stitch-color-success) 16%, transparent)",
                            color: "var(--stitch-color-success)",
                            border:
                              "1px solid color-mix(in srgb, var(--stitch-color-success) 30%, transparent)",
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]" aria-hidden>
                            check
                          </span>
                          Xác nhận đã trả
                        </button>
                      ) : null}
                    </div>
                  </td>

                  {/* Cột 4: Trạng thái & Thao tác */}
                  <td className="px-6 py-6 align-top">
                    <div className="flex flex-col gap-4">
                      <StatusBadge status={o.status} />

                      <div className="flex flex-col gap-2">
                        {statusOptions.length <= 1 ? (
                          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--stitch-color-on-surface)]/40">
                            Không còn bước tiếp theo
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {nextImmediate ? (
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => {
                                  if (isLocked) return;
                                  void patchStatus(o.id, nextImmediate);
                                }}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-2.5 py-2 text-[9px] font-black uppercase tracking-wide text-[var(--stitch-color-on-surface)] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:text-[10px] md:w-auto md:justify-start"
                                style={{
                                  borderColor:
                                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
                                  background:
                                    "color-mix(in srgb, var(--stitch-color-surface-container-high) 70%, transparent)",
                                  fontFamily: "var(--stitch-font-headline)",
                                }}
                                title={`Chuyển sang: ${statusLabelVi(nextImmediate)}`}
                              >
                                <span className="material-symbols-outlined text-[14px]" aria-hidden>
                                  check_box_outline_blank
                                </span>
                                <span className="min-w-0 truncate">{statusLabelVi(nextImmediate)}</span>
                              </button>
                            ) : (
                              <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--stitch-color-on-surface)]/40">
                                Không còn bước tiếp theo
                              </div>
                            )}

                            {nextImmediate === "CONFIRMED" ? (
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => {
                                  if (isLocked) return;
                                  if (confirm(`Hủy đơn ${o.order_code}?`)) {
                                    void patchStatus(o.id, "CANCELLED");
                                  }
                                }}
                                className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border text-[var(--stitch-color-on-surface-variant)] transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                                style={{
                                  borderColor:
                                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
                                  background:
                                    "color-mix(in srgb, var(--stitch-color-surface-container-high) 70%, transparent)",
                                }}
                                title="Hủy đơn"
                                aria-label="Hủy đơn"
                              >
                                <span className="material-symbols-outlined text-[18px]" aria-hidden>
                                  close
                                </span>
                              </button>
                            ) : null}
                          </div>
                        )}
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
          style={{
            fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))",
          }}
        >
          Xử lý đơn hàng
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--stitch-color-on-surface-variant)" }}
        >
          Lọc theo trạng thái và cập nhật tiến độ xử lý.
        </p>
      </header>

      <div
        className="flex flex-wrap items-center gap-4 rounded-3xl p-4"
        style={{
          background:
            "color-mix(in srgb, var(--stitch-color-surface-container-high) 70%, transparent)",
          border:
            "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] opacity-60">
            filter_list
          </span>
          <label className="text-xs font-black uppercase tracking-widest opacity-60">
            Trạng thái
          </label>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border bg-transparent px-4 py-2 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-[var(--stitch-color-primary)]/50"
          style={{
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant) 40%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
        >
          <option
            value=""
            className="bg-[var(--stitch-color-surface-container-high)]"
          >
            Tất cả đơn hàng
          </option>
          {ADMIN_ORDER_STATUSES.map((s) => (
            <option
              key={s}
              value={s}
              className="bg-[var(--stitch-color-surface-container-high)]"
            >
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

      {error ? (
        <p className="text-sm" style={{ color: "var(--stitch-color-error)" }}>
          {error}
        </p>
      ) : null}

      {loading ? (
        <p
          className="text-sm"
          style={{ color: "var(--stitch-color-on-surface-variant)" }}
        >
          Đang tải...
        </p>
      ) : (
        <div className="space-y-8">
          {orders.length === 0 ? (
            <div
              className="text-center text-sm"
              style={{ color: "var(--stitch-color-on-surface-variant)" }}
            >
              Không có đơn hàng nào.
            </div>
          ) : (
            ADMIN_ORDER_STATUSES.map((status) => {
              const ordersForStatus = orders.filter((o) => o.status === status);
              if (ordersForStatus.length === 0) return null;

              return (
                <div key={status} className="space-y-4">
                  <h2
                    className="text-xl font-bold tracking-tight"
                    style={{
                      fontFamily:
                        "var(--stitch-font-headline, var(--stitch-font-body))",
                    }}
                  >
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
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {statusLabelVi(status)}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING_CONFIRMATION":
      return "var(--stitch-color-warning)";
    case "CONFIRMED":
      return "var(--stitch-color-primary)";
    case "SHIPPING":
      return "var(--stitch-color-secondary)";
    case "COMPLETED":
      return "var(--stitch-color-success)";
    case "CANCELLED":
      return "var(--stitch-color-error)";
    default:
      return "var(--stitch-color-on-surface-variant)";
  }
}
