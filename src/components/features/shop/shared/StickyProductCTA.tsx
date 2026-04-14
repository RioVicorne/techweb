"use client";

import type { Product } from "@/data/products";
import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export function StickyProductCTA({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [toastOpen, setToastOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {toastOpen ? (
        <div
          className="pointer-events-none absolute -top-3 left-1/2 z-10 w-[min(360px,100%)] -translate-x-1/2 -translate-y-full rounded-2xl border px-4 py-2 text-center text-sm font-black"
          style={{
            background:
              "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 92%, transparent)",
            borderColor: "color-mix(in srgb, var(--stitch-color-primary) 35%, transparent)",
            color: "var(--stitch-color-on-surface)",
          }}
          role="status"
          aria-live="polite"
        >
          Đã thêm vào giỏ hàng
        </div>
      ) : null}

      <div
        className="rounded-3xl border p-4"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        }}
      >
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
          }}
          onClick={() => {
            addItem(product);
            setToastOpen(true);
            if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
            toastTimerRef.current = window.setTimeout(() => setToastOpen(false), 1600);
          }}
        >
          <span className="material-symbols-outlined shrink-0" aria-hidden>
            add_shopping_cart
          </span>
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Thêm vào giỏ</span>
        </button>

        <button
          type="button"
          className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold transition active:scale-[0.98]"
          style={{
            background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
            color: "var(--stitch-color-primary)",
            border:
              "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
          }}
          onClick={async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              const qs = new URLSearchParams();
              qs.set("returnTo", `/checkout?buyNow=${encodeURIComponent(product.id)}`);
              router.push(`/login?${qs.toString()}`);
              return;
            }
            router.push(`/checkout?buyNow=${encodeURIComponent(product.id)}`);
          }}
        >
          <span className="material-symbols-outlined shrink-0" aria-hidden>
            bolt
          </span>
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">Mua ngay</span>
        </button>
      </div>
      </div>
    </div>
  );
}

