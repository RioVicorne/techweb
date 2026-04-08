"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type PaymentMethodId = "COD" | "MOMO" | "BANK" | "CARD";

const METHODS: Array<{
  id: PaymentMethodId;
  title: string;
  desc: string;
  icon: string;
  accent: "primary" | "secondary" | "neutral";
}> = [
  { id: "COD", title: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt khi nhận.", icon: "local_shipping", accent: "neutral" },
  { id: "MOMO", title: "Ví MoMo", desc: "Xác nhận nhanh qua MoMo.", icon: "payments", accent: "secondary" },
  { id: "BANK", title: "Chuyển khoản ngân hàng", desc: "Chuyển khoản theo hướng dẫn.", icon: "account_balance", accent: "neutral" },
  { id: "CARD", title: "Thẻ (Stripe)", desc: "Thanh toán bằng thẻ quốc tế.", icon: "credit_card", accent: "primary" },
];

function isPaymentMethodId(x: string | null): x is PaymentMethodId {
  return x === "COD" || x === "MOMO" || x === "BANK" || x === "CARD";
}

export function PaymentMethodClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const buyNow = sp.get("buyNow");
  const initial = useMemo(() => {
    const fromQuery = sp.get("pm");
    return isPaymentMethodId(fromQuery) ? fromQuery : ("COD" as const);
  }, [sp]);

  const [selected, setSelected] = useState<PaymentMethodId>(initial);

  const backHref = useMemo(() => {
    const params = new URLSearchParams();
    if (buyNow) params.set("buyNow", buyNow);
    params.set("pm", selected);
    return `/checkout?${params.toString()}`;
  }, [buyNow, selected]);

  return (
    <main className="mx-auto max-w-screen-lg px-6 pb-28 pt-28 md:px-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Phương thức thanh toán
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Chọn 1 phương thức để tiếp tục thanh toán.
          </p>
        </div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition active:scale-95"
          style={{ background: "var(--stitch-color-surface-container)", color: "var(--stitch-color-primary)" }}
        >
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Quay lại
        </Link>
      </div>

      <section className="space-y-3">
        {METHODS.map((m) => {
          const active = selected === m.id;
          const accentColor =
            m.accent === "secondary"
              ? "var(--stitch-color-secondary)"
              : m.accent === "primary"
                ? "var(--stitch-color-primary)"
                : "var(--stitch-color-on-surface-variant)";

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.id)}
              className="w-full rounded-3xl border p-4 text-left transition active:scale-[0.99]"
              style={{
                background: active
                  ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)"
                  : "var(--stitch-color-surface-container)",
                borderColor: active
                  ? "color-mix(in srgb, var(--stitch-color-primary) 25%, transparent)"
                  : "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-black text-white">
                    <span className="material-symbols-outlined" style={{ color: accentColor }} aria-hidden>
                      {m.icon}
                    </span>
                    {m.title}
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    {m.desc}
                  </p>
                </div>
                <span className="material-symbols-outlined" style={{ color: active ? "var(--stitch-color-secondary)" : "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                  {active ? "radio_button_checked" : "radio_button_unchecked"}
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="w-full rounded-full px-5 py-3 text-sm font-extrabold text-white transition active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
          }}
        >
          Xác nhận phương thức
        </button>
      </div>
    </main>
  );
}

