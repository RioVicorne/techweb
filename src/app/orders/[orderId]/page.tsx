import { Suspense } from "react";
import { OrderDetailClient } from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const id = String(orderId || "");

  return (
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
      <OrderDetailClient orderId={id} />
    </Suspense>
  );
}

