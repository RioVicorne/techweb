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
  paymentMethod?: string;
  paymentStatus?: string;
  qrCodeUrl?: string | null;
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

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createOrderId() {
  const uuid = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replaceAll("-", "")
    : randomHex(16);
  return `RS${uuid.slice(0, 16).toUpperCase()}`;
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
