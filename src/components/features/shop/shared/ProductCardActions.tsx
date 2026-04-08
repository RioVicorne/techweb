"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import type { Product } from "@/data/products";

export function ProductCardActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label="Thêm vào giỏ hàng"
        title="Thêm vào giỏ hàng"
        className="flex w-12 shrink-0 items-center justify-center rounded-xl py-3 text-white transition-all hover:bg-[var(--stitch-color-primary)] hover:text-[var(--stitch-color-on-primary)] active:scale-95"
        style={{
          background:
            "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
        }}
        onClick={() => addItem(product)}
      >
        <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
          add_shopping_cart
        </span>
      </button>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center justify-center rounded-xl py-3 font-bold text-white transition-all hover:bg-[var(--stitch-color-primary)] hover:text-[var(--stitch-color-on-primary)] active:scale-95"
        style={{
          background:
            "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
        }}
        onClick={() => {
          router.push(`/checkout?buyNow=${encodeURIComponent(product.id)}`);
        }}
      >
        Mua Ngay
      </button>
    </div>
  );
}

