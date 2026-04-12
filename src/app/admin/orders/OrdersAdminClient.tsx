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

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Trạng thái
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 40%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
        >
          <option value="">Tất cả</option>
          {ADMIN_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabelVi(s)}
            </option>
          ))}
        </select>
      </div>

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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Không có đơn.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const statusOptions = (ADMIN_ORDER_STATUSES as readonly string[]).includes(o.status)
                    ? ADMIN_ORDER_STATUSES
                    : [...ADMIN_ORDER_STATUSES, o.status];
                  return (
                  <tr
                    key={o.id}
                    className="border-t"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 15%, transparent)",
                    }}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{o.order_code}</div>
                      <div className="text-xs tabular-nums" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        {new Date(o.created_at).toLocaleString("vi-VN")}
                      </div>
                      {o.first_item?.title ? (
                        <div className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                          {o.first_item.title}
                          {o.first_item.qty > 1 ? ` ×${o.first_item.qty}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div>{o.full_name}</div>
                      <div className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        {o.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums">
                      {formatVndDisplay(Number(o.total ?? 0))} {o.currency || "VND"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        disabled={updatingId === o.id}
                        value={o.status}
                        onChange={(e) => void patchStatus(o.id, e.target.value)}
                        className="max-w-[200px] rounded-lg border px-2 py-1.5 text-xs md:text-sm"
                        style={{
                          background: "var(--stitch-color-surface-container)",
                          borderColor:
                            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 40%, transparent)",
                        }}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {statusLabelVi(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
