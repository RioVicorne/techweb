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

type PurchaseRow = {
  sku: string;
  title: string;
  image: string;
  unit_price: number;
  total_qty: number;
  last_order_code: string;
  last_purchased_at: string;
};

type SuggestedProduct = {
  id: string;
  title: string;
  price: string;
  img: string;
};

export function AccountClient() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [suggested, setSuggested] = useState<SuggestedProduct[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || "";
      const em = data.session?.user?.email || "";
      const meta = (data.session?.user?.user_metadata ?? {}) as Record<string, unknown>;
      if (!token) {
        router.replace(`/login?returnTo=${encodeURIComponent("/account")}`);
        return;
      }
      if (!cancelled) setEmail(em);
      if (!cancelled) {
        setFullName(String(meta.full_name ?? meta.name ?? ""));
        setPhone(String(meta.phone ?? ""));
      }
      try {
        const [ordersRes, purchasesRes, suggestedRes, countsRes] = await Promise.all([
          fetch("/api/account/orders", { method: "GET", headers: { authorization: `Bearer ${token}` } }),
          fetch("/api/account/purchases", { method: "GET", headers: { authorization: `Bearer ${token}` } }),
          fetch("/api/catalog/products", { method: "GET" }),
          fetch("/api/account/order-status-counts", { method: "GET", headers: { authorization: `Bearer ${token}` } }),
        ]);

        const ordersJson = (await ordersRes.json()) as { orders?: OrderRow[] };
        const purchasesJson = (await purchasesRes.json()) as { purchases?: PurchaseRow[] };
        const suggestedJson = (await suggestedRes.json()) as { products?: SuggestedProduct[] };
        const countsJson = (await countsRes.json()) as { counts?: Record<string, number> };

        if (!cancelled) {
          setOrders(Array.isArray(ordersJson.orders) ? ordersJson.orders : []);
          setPurchases(Array.isArray(purchasesJson.purchases) ? purchasesJson.purchases : []);
          setSuggested(Array.isArray(suggestedJson.products) ? suggestedJson.products.slice(0, 6) : []);
          setStatusCounts(countsJson.counts && typeof countsJson.counts === "object" ? countsJson.counts : {});
        }
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Section 1: Account / Edit */}
        <section
          className="rounded-3xl border p-6 md:p-8 lg:col-span-5"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          {/* Compact summary (tap to edit) */}
          {!editing ? (
            <button
              type="button"
              className="w-full text-left"
              onClick={() => {
                setSaveError(null);
                setEditing(true);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)",
                      border:
                        "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                    }}
                    aria-hidden
                  >
                    <span
                      className="text-lg font-black"
                      style={{ color: "var(--stitch-color-primary)", fontFamily: "var(--stitch-font-headline)" }}
                    >
                      {email ? email.trim().slice(0, 1).toUpperCase() : "R"}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div
                      className="line-clamp-1 text-base font-black text-white"
                      style={{ fontFamily: "var(--stitch-font-headline)" }}
                    >
                      {fullName ? fullName : "Tài khoản"}
                    </div>
                    <div className="mt-1 truncate text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      {email || "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)",
                      color: "var(--stitch-color-primary)",
                    }}
                    aria-hidden
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none">edit</span>
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                      color: "var(--stitch-color-primary)",
                      border:
                        "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                    }}
                    aria-label="Sign out"
                    title="Sign out"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await supabase.auth.signOut();
                      router.replace("/");
                    }}
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                      logout
                    </span>
                  </button>
                </div>
              </div>

            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                    Edit profile
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    {email}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    color: "var(--stitch-color-on-surface-variant)",
                    border:
                      "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                  }}
                  aria-label="Back"
                  title="Back"
                  onClick={() => {
                    setEditing(false);
                    setSaveError(null);
                  }}
                >
                  <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                    arrow_back
                  </span>
                </button>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)" }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Full name
                  </div>
                  <input
                    className="mt-2 w-full bg-transparent text-sm font-bold text-white outline-none"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)" }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Phone
                  </div>
                  <input
                    className="mt-2 w-full bg-transparent text-sm font-bold text-white outline-none"
                    placeholder="090..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {saveError ? (
                <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-error) 35%, transparent)", color: "var(--stitch-color-on-surface)" }}>
                  {saveError}
                </div>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                    color: "var(--stitch-color-on-primary-fixed, black)",
                  }}
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setSaveError(null);
                    try {
                      const { error } = await supabase.auth.updateUser({
                        data: { full_name: fullName.trim(), phone: phone.trim() },
                      });
                      if (error) throw error;
                      setEditing(false);
                    } catch (e) {
                      setSaveError(e instanceof Error ? e.message : "Không thể lưu");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold transition active:scale-[0.99]"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    color: "var(--stitch-color-on-surface-variant)",
                    border:
                      "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
                  }}
                  onClick={() => {
                    setEditing(false);
                    setSaveError(null);
                  }}
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Shipping status */}
        <section
          className="rounded-3xl border p-6 md:p-8 lg:col-span-7"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Trạng thái giao hàng
            </h2>
            <Link href="/checkout" className="text-sm font-bold transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
              Mua thêm
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { label: "Chờ xác nhận", icon: "hourglass_top", statuses: ["PENDING_PAYMENT", "PENDING_CONFIRMATION"] },
              { label: "Đang chuẩn bị", icon: "inventory_2", statuses: ["CONFIRMED", "PROCESSING", "PACKING"] },
              { label: "Đang giao", icon: "local_shipping", statuses: ["SHIPPING", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
              { label: "Đã giao", icon: "verified", statuses: ["DELIVERED", "COMPLETED"] },
            ].map((x) => (
              (() => {
                const n = x.statuses.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);
                return (
              <div
                key={x.label}
                className="rounded-2xl border p-3 text-center"
                style={{
                  background:
                    "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                  borderColor:
                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                }}
              >
                <div
                  className="relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background:
                      "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)",
                    color: "var(--stitch-color-primary)",
                  }}
                >
                  <span className="material-symbols-outlined text-[22px]" aria-hidden>
                    {x.icon}
                  </span>
                  {n > 0 ? (
                    <span
                      className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                      style={{ background: "var(--stitch-color-secondary)" }}
                      aria-label={`${n} đơn ${x.label}`}
                    >
                      {n > 99 ? "99+" : n}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] font-black leading-tight" style={{ color: "var(--stitch-color-on-surface)" }}>
                  {x.label}
                </div>
              </div>
                );
              })()
            ))}
          </div>

          {/* Section 3: Purchased / Suggested */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Sản phẩm đã mua
            </h3>

            {loading ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Loading...
              </p>
            ) : purchases.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Bạn chưa mua sản phẩm nào. Gợi ý cho bạn:
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {suggested.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${encodeURIComponent(p.id)}`}
                      className="overflow-hidden rounded-2xl border transition hover:opacity-95 active:scale-[0.99]"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                        borderColor:
                          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                      }}
                    >
                      <div className="aspect-square w-full" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.img} alt={p.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="line-clamp-1 text-sm font-bold text-white">{p.title}</div>
                        <div className="mt-1 text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                          {p.price} <span className="text-[10px] font-normal">VND</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {purchases.slice(0, 8).map((x) => (
                  <Link
                    key={x.sku}
                    href={`/product/${encodeURIComponent(x.sku)}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border p-4 transition hover:opacity-95 active:scale-[0.99]"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                        {x.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={x.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-black text-white">{x.title}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                          Mua gần nhất: {new Date(x.last_purchased_at).toLocaleDateString()} • SL: {x.total_qty}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                        {formatVndDisplay(Number(x.unit_price) || 0)} VND
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        Order {x.last_order_code}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Recent orders
            </h3>
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
                {orders.slice(0, 6).map((o) => (
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
        </section>
      </div>
    </main>
  );
}

