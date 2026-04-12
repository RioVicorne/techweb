/** Valid order workflow statuses (aligned with OrdersClient / shop UI). */
export const ADMIN_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PROCESSING",
  "PACKING",
  "SHIPPING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export function isValidAdminOrderStatus(s: string): s is AdminOrderStatus {
  return (ADMIN_ORDER_STATUSES as readonly string[]).includes(s);
}
