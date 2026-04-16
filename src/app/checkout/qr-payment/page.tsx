import { Suspense } from "react";
import type { Metadata } from "next";
import { QrPaymentClient } from "./QrPaymentClient";

export const metadata: Metadata = {
  title: "Thanh toán QR Code",
  description: "Quét mã QR để thanh toán đơn hàng — RioShop",
};

export default function QrPaymentPage() {
  return (
    <div className="min-h-screen">
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
        <QrPaymentClient />
      </Suspense>
    </div>
  );
}
