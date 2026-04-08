"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";
import { parseDisplayPriceToVnd } from "@/data/products";

export type CartLine = {
  productId: string;
  title: string;
  priceDisplay: string;
  priceVnd: number;
  image: string;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalVnd: number;
  addItem: (product: Product) => void;
  setQty: (productId: string, qty: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "neon-kinetic-cart-v1";

function isCartLine(x: unknown): x is CartLine {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.productId === "string" &&
    typeof o.title === "string" &&
    typeof o.priceDisplay === "string" &&
    typeof o.priceVnd === "number" &&
    typeof o.image === "string" &&
    typeof o.qty === "number" &&
    o.qty >= 1 &&
    Number.isFinite(o.priceVnd)
  );
}

function parseStored(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCartLine);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setLines(parseStored(JSON.parse(s)));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* quota / private mode */
    }
  }, [lines, ready]);

  const addItem = useCallback((product: Product) => {
    const priceVnd = parseDisplayPriceToVnd(product.price);
    setLines((prev) => {
      const hit = prev.find((l) => l.productId === product.id);
      if (hit) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          priceDisplay: product.price,
          priceVnd,
          image: product.img,
          qty: 1,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const q = Math.floor(qty);
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.productId !== productId);
      const capped = Math.min(99, q);
      return prev.map((l) => (l.productId === productId ? { ...l, qty: capped } : l));
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const subtotalVnd = useMemo(
    () => lines.reduce((sum, l) => sum + l.priceVnd * l.qty, 0),
    [lines],
  );

  const value = useMemo(
    () => ({ lines, itemCount, subtotalVnd, addItem, setQty, removeLine, clearCart }),
    [lines, itemCount, subtotalVnd, addItem, setQty, removeLine, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
