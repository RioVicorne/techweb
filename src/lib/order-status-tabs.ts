export type OrderStatusTabDef = {
  key: string;
  label: string;
  icon: string;
  statuses: string[];
};

/** Tabs + status keys aligned with `/orders` filtering and order-status-counts API. */
export const ORDER_STATUS_TABS: OrderStatusTabDef[] = [
  { key: "pending", label: "Chờ xác nhận", icon: "hourglass_top", statuses: ["PENDING_CONFIRMATION"] },
  { key: "preparing", label: "Chờ lấy hàng", icon: "inventory_2", statuses: ["CONFIRMED"] },
  { key: "shipping", label: "Chờ giao hàng", icon: "local_shipping", statuses: ["SHIPPING"] },
  { key: "delivered", label: "Lịch sử đơn hàng", icon: "history", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Đã hủy", icon: "cancel", statuses: ["CANCELLED"] },
];

/** Tiến độ trong panel chi tiết đơn — cùng wording với tab. */
export const ORDER_PROGRESS_STEPS: Array<{ label: string; icon: string; key: string }> = [
  { label: "Chờ xác nhận", icon: "hourglass_top", key: "PENDING_CONFIRMATION" },
  { label: "Chờ lấy hàng", icon: "inventory_2", key: "CONFIRMED" },
  { label: "Chờ giao hàng", icon: "local_shipping", key: "SHIPPING" },
  { label: "Lịch sử đơn hàng", icon: "history", key: "COMPLETED" },
];

const ORDER_STATUS_CODE_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Chờ lấy hàng",
  SHIPPING: "Chờ giao hàng",
  COMPLETED: "Lịch sử đơn hàng",
  CANCELLED: "Đã hủy",
};

export function orderRowStatusLabel(status: string): string {
  return ORDER_STATUS_CODE_LABELS[status] ?? status;
}

export function orderStatusTabColor(tabKey: string): { fg: string; bg: string } {
  switch (tabKey) {
    case "pending":
      return { fg: "#f59e0b", bg: "color-mix(in srgb, #f59e0b 18%, transparent)" };
    case "preparing":
      return {
        fg: "var(--stitch-color-secondary)",
        bg: "color-mix(in srgb, var(--stitch-color-secondary) 18%, transparent)",
      };
    case "shipping":
      return { fg: "#3b82f6", bg: "color-mix(in srgb, #3b82f6 18%, transparent)" };
    case "delivered":
      return { fg: "#10b981", bg: "color-mix(in srgb, #10b981 18%, transparent)" };
    case "cancelled":
      return {
        fg: "var(--stitch-color-error)",
        bg: "color-mix(in srgb, var(--stitch-color-error) 18%, transparent)",
      };
    default:
      return {
        fg: "var(--stitch-color-primary)",
        bg: "color-mix(in srgb, var(--stitch-color-primary) 18%, transparent)",
      };
  }
}
