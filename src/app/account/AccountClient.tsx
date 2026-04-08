"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { formatVndDisplay } from "@/data/products";

type OrderRow = {
  order_code: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
};

export function AccountClient() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || "";
      const em = data.session?.user?.email || "";
      if (!token) {
        router.replace(`/login?returnTo=${encodeURIComponent("/account")}`);
        return;
      }
      if (!cancelled) setEmail(em);
      try {
        const res = await fetch("/api/account/orders", {
          method: "GET",
          headers: { authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { orders?: OrderRow[] };
        if (!cancelled) setOrders(Array.isArray(json.orders) ? json.orders : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
      <div
        className="rounded-3xl border p-6 md:p-8"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-2xl font-black italic tracking-tighter text-white"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              Account
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              {email ? `Signed in as ${email}` : "Signed in"}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition active:scale-95"
            style={{
              background:
                "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
              color: "var(--stitch-color-primary)",
              border:
                "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
            }}
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/");
            }}
          >
            Sign out
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
            Recent orders
          </h2>

          {loading ? (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Loading...
            </p>
          ) : orders.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              No orders yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.map((o) => (
                <Link
                  key={o.order_code}
                  href={`/checkout/success?orderId=${encodeURIComponent(o.order_code)}`}
                  className="block rounded-2xl border p-4 transition hover:opacity-95 active:scale-[0.99]"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white">{o.order_code}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                        {formatVndDisplay(Number(o.total) || 0)} {o.currency || "VND"}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        {o.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

