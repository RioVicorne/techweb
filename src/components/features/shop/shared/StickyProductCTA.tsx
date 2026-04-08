"use client";

import type { Product } from "@/data/products";
import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export function StickyProductCTA({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl"
      style={{
        background:
          "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 85%, transparent)",
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold text-white transition active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
          }}
          onClick={() => addItem(product)}
        >
          <span className="material-symbols-outlined" aria-hidden>
            add_shopping_cart
          </span>
          ADD TO CART
        </button>

        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition active:scale-[0.98]"
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
          <span className="material-symbols-outlined" aria-hidden>
            bolt
          </span>
          BUY NOW
        </button>
      </div>
    </div>
  );
}

