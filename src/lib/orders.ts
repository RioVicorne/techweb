import type { CartLine } from "@/context/cart-context";

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: OrderCustomer;
  lines: CartLine[];
  subtotalVnd: number;
  shippingVnd: number;
  totalVnd: number;
};

const STORAGE_KEY = "rioshop-orders-v1";

function safeParseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function createOrderId() {
  // short, readable, unique enough for demo/local checkout flows
  return `RS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function saveOrder(order: Order) {
  if (typeof window === "undefined") return;
  const existing = safeParseJson(window.localStorage.getItem(STORAGE_KEY));
  const list = Array.isArray(existing) ? (existing as Order[]) : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...list].slice(0, 50)));
}

export function getOrder(orderId: string): Order | null {
  if (typeof window === "undefined") return null;
  const existing = safeParseJson(window.localStorage.getItem(STORAGE_KEY));
  if (!Array.isArray(existing)) return null;
  const hit = (existing as Order[]).find((o) => o && typeof o === "object" && (o as Order).id === orderId);
  return hit ?? null;
}

