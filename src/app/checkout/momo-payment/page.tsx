import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopHeader } from "@/components/features/shop/shared/ShopHeader";
import { MomoPaymentClient } from "./MomoPaymentClient";

export const metadata: Metadata = {
  title: "Thanh toán MoMo",
  description: "Thanh toán qua ví MoMo — RioShop",
};

export default function MomoPaymentPage() {
  return (
    <div className="min-h-screen">
      <ShopHeader />
      <Suspense
        fallback={
          <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
            <div
              className="rounded-3xl border p-10 text-center"
              style={{
                background: "var(--stitch-color-surface-container)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải...
              </p>
            </div>
          </main>
        }
      >
        <MomoPaymentClient />
      </Suspense>
    </div>
  );
}
