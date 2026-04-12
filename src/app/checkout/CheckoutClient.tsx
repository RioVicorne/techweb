"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCart } from "@/context/cart-context";
import type { CartLine } from "@/context/cart-context";
import { formatVndDisplay, parseDisplayPriceToVnd } from "@/data/products";
import { createOrderId, saveOrder, type OrderCustomer } from "@/lib/orders";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

const inputStyle: CSSProperties = {
  background: "var(--stitch-color-surface-container)",
  borderColor:
    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
  color: "var(--stitch-color-on-surface)",
};

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lines, subtotalVnd, setQty, removeLine, clearCart } = useCart();
  const buyNowId = searchParams.get("buyNow");
  const paymentMethodId = searchParams.get("pm") || "COD";
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [buyNowLine, setBuyNowLine] = useState<CartLine | null>(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [buyNowResolved, setBuyNowResolved] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileCustomer, setProfileCustomer] = useState<OrderCustomer | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const cartLines = lines.length > 0 ? lines : buyNowLine ? [buyNowLine] : [];
  const cartSubtotalVnd =
    lines.length > 0 ? subtotalVnd : buyNowLine ? buyNowLine.priceVnd * buyNowLine.qty : 0;

  type VoucherDef = {
    code: string;
    title: string;
    subtitle: string;
    kind: "PERCENT" | "AMOUNT" | "FREESHIP";
    value: number; // percent 0-100, or amount VND
    minSubtotalVnd?: number;
    maxDiscountVnd?: number;
  };

  const availableVouchers = useMemo<VoucherDef[]>(
    () => [
      {
        code: "FREESHIP",
        title: "FREESHIP",
        subtitle: "Miễn phí vận chuyển",
        kind: "FREESHIP",
        value: 0,
      },
      {
        code: "-50K",
        title: "-50K",
        subtitle: "Giảm 50K đơn từ 499K",
        kind: "AMOUNT",
        value: 50_000,
        minSubtotalVnd: 499_000,
      },
      {
        code: "VIP10",
        title: "VIP10",
        subtitle: "Giảm 10% (tối đa 200K)",
        kind: "PERCENT",
        value: 10,
        maxDiscountVnd: 200_000,
      },
    ],
    []
  );

  const shippingOffers = useMemo(() => availableVouchers.filter((v) => v.kind === "FREESHIP"), [availableVouchers]);
  const discountVouchers = useMemo(
    () => availableVouchers.filter((v) => v.kind === "PERCENT" || v.kind === "AMOUNT"),
    [availableVouchers]
  );

  const [appliedShippingOffer, setAppliedShippingOffer] = useState<VoucherDef | null>(null);
  const [appliedDiscountVoucher, setAppliedDiscountVoucher] = useState<VoucherDef | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function guard() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        const qs = new URLSearchParams();
        qs.set("returnTo", `/checkout?${searchParams.toString()}`);
        router.replace(`/login?${qs.toString()}`);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
        const fullName = String(meta.full_name ?? meta.name ?? "").trim();
        const phone = String(meta.phone ?? "").trim();
        const email = String(user?.email ?? "").trim();
        const addr = (meta.shipping_address ?? {}) as Record<string, unknown>;
        const street = String(addr.street ?? "").trim();
        const ward = String(addr.ward ?? "").trim();
        const district = String(addr.district ?? "").trim();
        const province = String(addr.province ?? "").trim();
        const address = [street, ward, district, province].filter(Boolean).join(", ");
        if (!cancelled) {
          setProfileCustomer({
            name: fullName,
            phone,
            email,
            address,
          });
        }
      } catch {
        // ignore; we'll validate on submit
      }
    }
    guard();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadBuyNow() {
      if (!buyNowId || lines.length > 0) return;
      if (!cancelled) {
        setBuyNowLoading(true);
        setBuyNowResolved(false);
      }
      try {
        const res = await fetch(`/api/catalog/products/${encodeURIComponent(buyNowId)}`);
        if (!res.ok) {
          if (!cancelled) setBuyNowLine(null);
          return;
        }
        const json = (await res.json()) as { product?: { id: string; title: string; price: string; img: string } };
        const p = json.product;
        if (!p || !p.id) {
          if (!cancelled) setBuyNowLine(null);
          return;
        }
        if (cancelled) return;
        setBuyNowLine({
          productId: p.id,
          title: p.title,
          priceDisplay: p.price,
          priceVnd: parseDisplayPriceToVnd(p.price),
          image: p.img,
          qty: 1,
        });
      } catch {
        if (!cancelled) setBuyNowLine(null);
      } finally {
        if (!cancelled) {
          setBuyNowLoading(false);
          setBuyNowResolved(true);
        }
      }
    }
    loadBuyNow();
    return () => {
      cancelled = true;
    };
  }, [buyNowId, lines.length]);

  const setCartQty = (productId: string, qty: number) => {
    if (lines.length > 0) return setQty(productId, qty);
    setBuyNowLine((prev) => {
      if (!prev || prev.productId !== productId) return prev;
      const q = Math.floor(qty);
      if (q <= 0) return null;
      return { ...prev, qty: Math.min(99, q) };
    });
  };

  const removeCartLine = (productId: string) => {
    if (lines.length > 0) return removeLine(productId);
    setBuyNowLine((prev) => (prev?.productId === productId ? null : prev));
  };

  const clearAll = () => {
    setBuyNowLine(null);
    clearCart();
  };

  const [deliveryMethod, setDeliveryMethod] = useState<"STANDARD" | "HYPERSONIC">("STANDARD");
  const shippingVnd = useMemo(() => {
    if (deliveryMethod === "HYPERSONIC") return 45_000;
    return cartSubtotalVnd >= 2_000_000 ? 0 : 30_000;
  }, [deliveryMethod, cartSubtotalVnd]);

  const discountVoucherVnd = useMemo(() => {
    const v = appliedDiscountVoucher;
    if (!v) return 0;
    if (typeof v.minSubtotalVnd === "number" && cartSubtotalVnd < v.minSubtotalVnd) return 0;
    if (v.kind === "AMOUNT") return Math.min(v.value, cartSubtotalVnd);
    const raw = Math.floor((cartSubtotalVnd * v.value) / 100);
    const capped = typeof v.maxDiscountVnd === "number" ? Math.min(raw, v.maxDiscountVnd) : raw;
    return Math.max(0, Math.min(capped, cartSubtotalVnd));
  }, [appliedDiscountVoucher, cartSubtotalVnd]);

  const shippingDiscountVnd = useMemo(() => {
    const v = appliedShippingOffer;
    if (!v) return 0;
    // default: cap freeship at 45K (matches current HYPERSONIC fee)
    return Math.max(0, Math.min(shippingVnd, 45_000));
  }, [appliedShippingOffer, shippingVnd]);

  const totalVnd = Math.max(0, cartSubtotalVnd + shippingVnd - discountVoucherVnd - shippingDiscountVnd);

  useEffect(() => {
    // If cart changes and voucher no longer qualifies, keep it applied but show error.
    if (!appliedDiscountVoucher) return;
    if (typeof appliedDiscountVoucher.minSubtotalVnd === "number" && cartSubtotalVnd < appliedDiscountVoucher.minSubtotalVnd) {
      setVoucherError(`Voucher ${appliedDiscountVoucher.code} áp dụng cho đơn từ ${formatVndDisplay(appliedDiscountVoucher.minSubtotalVnd)} VND.`);
      return;
    }
    setVoucherError(null);
  }, [appliedDiscountVoucher, cartSubtotalVnd]);

  const paymentLabel =
    paymentMethodId === "MOMO"
      ? "Ví MoMo"
      : paymentMethodId === "BANK"
        ? "Chuyển khoản"
        : paymentMethodId === "CARD"
          ? "Thẻ (Stripe)"
          : "COD";

  // Prevent a brief "empty cart" flash when we clear cart state during a successful submit.
  if (placing) {
    return (
      <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined mb-4 text-5xl"
            style={{ color: "var(--stitch-color-on-surface-variant)" }}
            aria-hidden
          >
            hourglass_top
          </span>
          <h1
            className="mb-2 text-xl font-bold text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Đang xử lý đơn hàng...
          </h1>
          <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Vui lòng chờ trong giây lát.
          </p>
        </div>
      </main>
    );
  }

  if (cartLines.length === 0) {
    const shouldWaitForHydration = !hydrated;
    const shouldWaitForBuyNow = Boolean(buyNowId) && lines.length === 0 && (buyNowLoading || !buyNowResolved);
    if (shouldWaitForHydration || shouldWaitForBuyNow) {
      return (
        <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
          <div
            className="rounded-3xl border p-10 text-center"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            <span
              className="material-symbols-outlined mb-4 text-5xl"
              style={{ color: "var(--stitch-color-on-surface-variant)" }}
              aria-hidden
            >
              hourglass_top
            </span>
            <h1 className="mb-2 text-xl font-bold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Đang tải giỏ hàng...
            </h1>
            <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Vui lòng chờ trong giây lát.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-screen-lg px-6 pb-20 pt-28 md:px-12">
        <div
          className="rounded-3xl border p-10 text-center"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <span
            className="material-symbols-outlined mb-4 text-5xl"
            style={{ color: "var(--stitch-color-on-surface-variant)" }}
          >
            shopping_cart
          </span>
          <h1
            className="mb-2 text-xl font-bold text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Giỏ hàng trống
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Thêm sản phẩm từ HOT DEALS để tiếp tục thanh toán.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold text-white transition active:scale-95"
            style={{
              background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
            }}
          >
            Về cửa hàng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-32 pt-28 md:px-12">
      <nav className="mb-8 hidden flex-wrap items-center gap-2 text-sm md:flex" aria-label="Breadcrumb">
        <Link href="/" className="font-medium transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
          Trang chủ
        </Link>
        <span style={{ color: "var(--stitch-color-on-surface-variant)" }}>/</span>
        <span style={{ color: "var(--stitch-color-on-surface-variant)" }}>Thanh toán</span>
      </nav>

      <div className="mb-8 hidden md:block">
        <h1
          className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-white md:text-3xl"
          style={{ fontFamily: "var(--stitch-font-headline)" }}
        >
          <span className="h-0.5 w-10" style={{ background: "var(--stitch-color-secondary)" }} />
          Thanh toán
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Hoàn tất thông tin giao hàng — cùng phong cách RioShop / Stitch tokens.
        </p>
      </div>

      <div className="mb-8 md:hidden">
        <h1 className="text-2xl font-black italic tracking-tighter text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
          CYBERPULSE <span style={{ color: "var(--stitch-color-primary)" }}>|</span> Secure Checkout
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Order Summary + Shipping Logistics — powered by MoMo-ready design tokens.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start">
        <section
          className="order-2 rounded-3xl border p-6 sm:p-8 lg:order-1 lg:col-span-7"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <h2
            className="mb-6 text-lg font-bold text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Thiết lập thanh toán
          </h2>
          <form
            id="checkout-form"
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (placing) return;
              setSubmitError(null);
              setPlacing(true);
              try {
                // Load customer info from Account profile (user_metadata).
                let customer = profileCustomer;
                if (!customer) {
                  const { data: userData } = await supabase.auth.getUser();
                  const user = userData.user;
                  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
                  const fullName = String(meta.full_name ?? meta.name ?? "").trim();
                  const phone = String(meta.phone ?? "").trim();
                  const email = String(user?.email ?? "").trim();
                  const addr = (meta.shipping_address ?? {}) as Record<string, unknown>;
                  const street = String(addr.street ?? "").trim();
                  const ward = String(addr.ward ?? "").trim();
                  const district = String(addr.district ?? "").trim();
                  const province = String(addr.province ?? "").trim();
                  const address = [street, ward, district, province].filter(Boolean).join(", ");
                  customer = { name: fullName, phone, email, address };
                }

                if (!customer?.name || !customer.address) {
                  throw new Error("Bạn chưa thiết lập họ tên / địa chỉ giao hàng. Vui lòng cập nhật ở trang Tài khoản.");
                }
                if (!customer.phone && !customer.email) {
                  throw new Error("Bạn chưa có SĐT hoặc Email trong tài khoản. Vui lòng cập nhật ở trang Tài khoản.");
                }
                if (cartLines.length === 0) {
                  throw new Error("Giỏ hàng trống.");
                }

                // 1) Prefer creating an order in Supabase (server-side). If not configured, fallback to local storage.
                let orderId = "";
                try {
                  const { data: sessionData } = await supabase.auth.getSession();
                  const accessToken = sessionData.session?.access_token || "";
                  if (!accessToken) throw new Error("Bạn cần đăng nhập để thanh toán.");

                  const res = await fetch("/api/orders", {
                    method: "POST",
                    headers: {
                      "content-type": "application/json",
                      authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                      customer,
                      lines: cartLines,
                      subtotalVnd: cartSubtotalVnd,
                      shippingVnd,
                      totalVnd,
                    }),
                  });
                  const json = (await res.json()) as { orderId?: string; error?: string };
                  if (!res.ok || !json.orderId) throw new Error(json.error || "Không thể tạo đơn hàng.");
                  orderId = json.orderId;
                } catch {
                  orderId = createOrderId();
                }

                // Always keep a local copy for UI fallback.
                saveOrder({
                  id: orderId,
                  createdAt: new Date().toISOString(),
                  customer,
                  lines: cartLines,
                  subtotalVnd: cartSubtotalVnd,
                  shippingVnd,
                  totalVnd,
                });

                // 2) Try Stripe Checkout if configured; otherwise go to success immediately.
                try {
                  const res = await fetch("/api/stripe/checkout-session", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ orderId }),
                  });
                  const json = (await res.json()) as { url?: string; error?: string };
                  if (res.ok && json.url) {
                    clearAll();
                    window.location.href = json.url;
                    return;
                  }
                } catch {
                  // ignore stripe failure and continue to success page
                }

                router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
                // Clear cart after navigation is initiated to avoid a UI flash on this page.
                clearAll();
              } catch (err) {
                setSubmitError(err instanceof Error ? err.message : "Đặt hàng thất bại. Vui lòng thử lại.");
              } finally {
                setPlacing(false);
              }
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Phương thức thanh toán
              </label>
              <Link
                href={`/checkout/payment?${new URLSearchParams({
                  ...(buyNowId ? { buyNow: buyNowId } : {}),
                  pm: paymentMethodId,
                }).toString()}`}
                className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition active:scale-[0.99]"
                style={{
                  ...inputStyle,
                  borderColor:
                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
                }}
              >
                <span className="min-w-0 truncate text-white">{paymentLabel}</span>
                <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                  chevron_right
                </span>
              </Link>
            </div>

            {/* Voucher */}
            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                Voucher
              </label>

              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition active:scale-[0.99]"
                style={{
                  ...inputStyle,
                  borderColor:
                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
                }}
                aria-expanded={voucherOpen}
                aria-controls="voucher-panel"
                onClick={() => setVoucherOpen((v) => !v)}
              >
                <span className="min-w-0 truncate text-white">
                  {(() => {
                    const parts = [
                      appliedDiscountVoucher ? `${appliedDiscountVoucher.title} — ${appliedDiscountVoucher.subtitle}` : null,
                      appliedShippingOffer ? `${appliedShippingOffer.title} — ${appliedShippingOffer.subtitle}` : null,
                    ].filter(Boolean) as string[];
                    return parts.length ? parts.join(" + ") : "Chọn voucher / freeship";
                  })()}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                  aria-hidden
                >
                  {voucherOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {voucherOpen ? (
                <div
                  id="voucher-panel"
                  className="mt-3 rounded-2xl border p-4"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 15%, transparent)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Chọn voucher / freeship
                    </div>
                    <button
                      type="button"
                      className="rounded-full px-3 py-1 text-xs font-black transition active:scale-[0.99]"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                        color: "var(--stitch-color-on-surface-variant)",
                        border:
                          "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                      }}
                      onClick={() => setVoucherOpen(false)}
                    >
                      Xong
                    </button>
                  </div>

                  <div className="grid gap-2">
                    {discountVouchers.map((v) => {
                      const active = appliedDiscountVoucher?.code === v.code;
                      const disabled = typeof v.minSubtotalVnd === "number" ? cartSubtotalVnd < v.minSubtotalVnd : false;
                      return (
                        <button
                          key={v.code}
                          type="button"
                          className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] disabled:opacity-50"
                          style={{
                            background: active
                              ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)"
                              : "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                            borderColor: active
                              ? "color-mix(in srgb, var(--stitch-color-primary) 25%, transparent)"
                              : "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                          }}
                          disabled={disabled}
                          onClick={() => {
                            if (active) {
                              setAppliedDiscountVoucher(null);
                              setVoucherError(null);
                              return;
                            }

                            setAppliedDiscountVoucher(v);
                            if (typeof v.minSubtotalVnd === "number" && cartSubtotalVnd < v.minSubtotalVnd) {
                              setVoucherError(`Voucher ${v.code} áp dụng cho đơn từ ${formatVndDisplay(v.minSubtotalVnd)} VND.`);
                            } else {
                              setVoucherError(null);
                            }
                          }}
                          title={
                            disabled && typeof v.minSubtotalVnd === "number"
                              ? `Đơn tối thiểu ${formatVndDisplay(v.minSubtotalVnd)} VND`
                              : v.subtitle
                          }
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-black text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                              {v.title}
                            </div>
                            <div className="mt-0.5 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                              {v.subtitle}
                            </div>
                          </div>
                          <span
                            className="material-symbols-outlined shrink-0"
                            style={{
                              color: active ? "var(--stitch-color-primary)" : "var(--stitch-color-on-surface-variant)",
                            }}
                            aria-hidden
                          >
                            {active ? "radio_button_checked" : "radio_button_unchecked"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="my-4 h-px"
                    style={{
                      background:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                    }}
                  />

                  <div className="grid gap-2">
                    {shippingOffers.map((v) => {
                      const active = appliedShippingOffer?.code === v.code;
                      return (
                        <button
                          key={v.code}
                          type="button"
                          className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition active:scale-[0.99]"
                          style={{
                            background: active
                              ? "color-mix(in srgb, var(--stitch-color-secondary-container, var(--stitch-color-secondary)) 18%, transparent)"
                              : "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                            borderColor: active
                              ? "color-mix(in srgb, var(--stitch-color-secondary) 22%, transparent)"
                              : "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                          }}
                          onClick={() => {
                            if (active) {
                              setAppliedShippingOffer(null);
                              return;
                            }
                            setAppliedShippingOffer(v);
                          }}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-black text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                              {v.title}
                            </div>
                            <div className="mt-0.5 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                              {v.subtitle}
                            </div>
                          </div>
                          <span
                            className="material-symbols-outlined shrink-0"
                            style={{
                              color: active ? "var(--stitch-color-secondary)" : "var(--stitch-color-on-surface-variant)",
                            }}
                            aria-hidden
                          >
                            {active ? "radio_button_checked" : "radio_button_unchecked"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {voucherError ? (
                    <div className="mt-3 text-sm font-medium" style={{ color: "var(--stitch-color-secondary)" }}>
                      {voucherError}
                    </div>
                  ) : appliedDiscountVoucher || appliedShippingOffer ? (
                    <div className="mt-3 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Đã áp dụng{" "}
                      <span className="text-white">
                        {[appliedDiscountVoucher?.code, appliedShippingOffer?.code].filter(Boolean).join(" + ")}
                      </span>
                      {" — "}
                      {(discountVoucherVnd + shippingDiscountVnd) > 0 ? (
                        <>
                          giảm{" "}
                          <span style={{ color: "var(--stitch-color-primary)" }}>
                            {formatVndDisplay(discountVoucherVnd + shippingDiscountVnd)} VND
                          </span>
                        </>
                      ) : (
                        <>đã áp dụng</>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Desktop delivery protocol (same state as mobile) */}
            <div
              className="hidden rounded-3xl p-4 md:block"
              style={{ background: "var(--stitch-color-surface-container)" }}
            >
              <h3
                className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
                  local_shipping
                </span>
                Delivery Protocol
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("HYPERSONIC")}
                  className="w-full rounded-2xl p-3 text-left transition active:scale-[0.99]"
                  style={{
                    background:
                      deliveryMethod === "HYPERSONIC"
                        ? "color-mix(in srgb, var(--stitch-color-secondary-container) 35%, transparent)"
                        : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    border:
                      deliveryMethod === "HYPERSONIC"
                        ? "1px solid color-mix(in srgb, var(--stitch-color-secondary) 25%, transparent)"
                        : "1px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Hyper-Sonic Courier</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "var(--stitch-color-secondary)" }}>
                        +{formatVndDisplay(45_000)} VND
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        color:
                          deliveryMethod === "HYPERSONIC"
                            ? "var(--stitch-color-secondary)"
                            : "var(--stitch-color-on-surface-variant)",
                      }}
                      aria-hidden
                    >
                      {deliveryMethod === "HYPERSONIC" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Next cycle delivery before 06:00.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("STANDARD")}
                  className="w-full rounded-2xl p-3 text-left transition active:scale-[0.99]"
                  style={{
                    background:
                      deliveryMethod === "STANDARD"
                        ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 25%, transparent)"
                        : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    border:
                      deliveryMethod === "STANDARD"
                        ? "1px solid color-mix(in srgb, var(--stitch-color-primary) 25%, transparent)"
                        : "1px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Standard Orbital</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "var(--stitch-color-secondary)" }}>
                        FREE
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        color:
                          deliveryMethod === "STANDARD"
                            ? "var(--stitch-color-secondary)"
                            : "var(--stitch-color-on-surface-variant)",
                      }}
                      aria-hidden
                    >
                      {deliveryMethod === "STANDARD" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    {cartSubtotalVnd >= 2_000_000
                      ? "3-5 cycles deployment (free)."
                      : "3-5 cycles deployment (+30,000 VND if needed)."}
                  </p>
                </button>
              </div>
            </div>

            {/* Mobile delivery protocol (Stitch: Delivery Protocol + trust badges) */}
            <div className="rounded-3xl p-4 md:hidden" style={{ background: "var(--stitch-color-surface-container)" }}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-secondary)" }} aria-hidden>
                  local_shipping
                </span>
                Delivery Protocol
              </h3>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("HYPERSONIC")}
                  className="w-full rounded-2xl p-3 text-left transition active:scale-[0.99]"
                  style={{
                    background:
                      deliveryMethod === "HYPERSONIC"
                        ? "color-mix(in srgb, var(--stitch-color-secondary-container) 35%, transparent)"
                        : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    border:
                      deliveryMethod === "HYPERSONIC"
                        ? "1px solid color-mix(in srgb, var(--stitch-color-secondary) 25%, transparent)"
                        : "1px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Hyper-Sonic Courier</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "var(--stitch-color-secondary)" }}>
                        +{formatVndDisplay(45_000)} VND
                      </p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: deliveryMethod === "HYPERSONIC" ? "var(--stitch-color-secondary)" : "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                      {deliveryMethod === "HYPERSONIC" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Next cycle delivery before 06:00.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("STANDARD")}
                  className="w-full rounded-2xl p-3 text-left transition active:scale-[0.99]"
                  style={{
                    background:
                      deliveryMethod === "STANDARD"
                        ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 25%, transparent)"
                        : "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                    border:
                      deliveryMethod === "STANDARD"
                        ? "1px solid color-mix(in srgb, var(--stitch-color-primary) 25%, transparent)"
                        : "1px solid transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Standard Orbital</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: "var(--stitch-color-secondary)" }}>
                        FREE
                      </p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: deliveryMethod === "STANDARD" ? "var(--stitch-color-secondary)" : "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                      {deliveryMethod === "STANDARD" ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    {cartSubtotalVnd >= 2_000_000 ? "3-5 cycles deployment (free)." : "3-5 cycles deployment (+30,000 VND if needed)."}
                  </p>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))", color: "var(--stitch-color-on-surface-variant)" }}>
                  256-BIT SSL
                </span>
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))", color: "var(--stitch-color-on-surface-variant)" }}>
                  ENCRYPTED
                </span>
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest" style={{ background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))", color: "var(--stitch-color-on-surface-variant)" }}>
                  PCI-DSS
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placing}
              className="mt-2 hidden w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98] sm:w-auto sm:px-12 md:block"
              style={{
                background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
              }}
            >
              {placing ? "Đang đặt hàng..." : "Đặt hàng"}
            </button>
            {submitError ? (
              <p className="text-sm font-medium" style={{ color: "var(--stitch-color-secondary)" }}>
                {submitError}
              </p>
            ) : null}
          </form>
        </section>

        {/* Mobile order summary card (Stitch: Order Summary + expand) */}
        <div className="order-1 mb-8 md:hidden">
          <div
            className="rounded-3xl border p-5"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="flex items-center gap-3 text-lg font-black" style={{ fontFamily: "var(--stitch-font-headline)", color: "var(--stitch-color-on-surface)" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-primary)" }} aria-hidden>
                    shopping_cart
                  </span>
                  Order Summary
                </h2>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  {cartLines.length} items
                </p>
              </div>
              <div className="text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                {formatVndDisplay(totalVnd)} <span className="text-[11px] font-normal">VND</span>
              </div>
            </div>

            <details>
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4 rounded-2xl p-3" style={{ background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))" }}>
                  <span className="text-sm font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    View items
                  </span>
                  <span className="material-symbols-outlined" style={{ color: "var(--stitch-color-on-surface-variant)" }} aria-hidden>
                    expand_more
                  </span>
                </div>
              </summary>

              <ul className="mt-4 space-y-3">
                {cartLines.map((line) => (
                  <li key={line.productId} className="flex gap-4">
                    <div
                      className="relative h-16 w-16 overflow-hidden rounded-2xl"
                      style={{ background: "var(--stitch-color-surface-container-low, var(--stitch-color-surface))" }}
                    >
                      <Image src={line.image} alt="" fill className="object-cover" sizes="64px" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-semibold text-white" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                        {line.title}
                      </p>
                      <p className="mt-1 text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                        {formatVndDisplay(line.priceVnd)} <span className="text-xs font-normal">VND</span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div
                          className="inline-flex items-center rounded-lg border"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                          }}
                        >
                          <button
                            type="button"
                            className="px-2.5 py-1 text-sm font-bold transition hover:opacity-80"
                            style={{ color: "var(--stitch-color-on-surface)" }}
                            onClick={() => setCartQty(line.productId, line.qty - 1)}
                            aria-label="Giảm số lượng"
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-bold text-white">{line.qty}</span>
                          <button
                            type="button"
                            className="px-2.5 py-1 text-sm font-bold transition hover:opacity-80"
                            style={{ color: "var(--stitch-color-on-surface)" }}
                            onClick={() => setCartQty(line.productId, line.qty + 1)}
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-medium underline-offset-2 transition hover:underline"
                          style={{ color: "var(--stitch-color-on-surface-variant)" }}
                          onClick={() => removeCartLine(line.productId)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-black tabular-nums text-white">
                      {formatVndDisplay(line.priceVnd * line.qty)} <span className="text-[10px] font-normal">VND</span>
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-2 rounded-2xl p-3" style={{ background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))" }}>
                <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Tạm tính</span>
                  <span className="tabular-nums text-white">{formatVndDisplay(cartSubtotalVnd)} VND</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Phí vận chuyển</span>
                  <span className="tabular-nums text-white">
                    {shippingVnd === 0 ? "Miễn phí" : `${formatVndDisplay(shippingVnd)} VND`}
                  </span>
                </div>
                {discountVoucherVnd > 0 ? (
                  <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    <span>Giảm giá</span>
                    <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                      -{formatVndDisplay(discountVoucherVnd)} VND
                    </span>
                  </div>
                ) : null}
                {shippingDiscountVnd > 0 ? (
                  <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    <span>Freeship</span>
                    <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                      -{formatVndDisplay(shippingDiscountVnd)} VND
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-base font-black">
                  <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                  <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                    {formatVndDisplay(totalVnd)} VND
                  </span>
                </div>
              </div>
            </details>
          </div>
        </div>

        <aside
          className="hidden lg:block lg:sticky lg:top-28 lg:col-span-5"
        >
          <div
            className="rounded-3xl border p-6 sm:p-8"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            <h2
              className="mb-6 text-lg font-bold text-white"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              Đơn hàng
            </h2>
            <ul className="space-y-5">
              {cartLines.map((line) => (
                <li key={line.productId} className="flex gap-4">
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-low, var(--stitch-color-surface))",
                    }}
                  >
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="line-clamp-2 font-semibold text-white"
                      style={{ fontFamily: "var(--stitch-font-headline)" }}
                    >
                      {line.title}
                    </p>
                    <p className="mt-0.5 text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                      {line.priceDisplay} <span className="text-xs font-normal">VND</span>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div
                        className="inline-flex items-center rounded-lg border"
                        style={{
                          borderColor:
                            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                        }}
                      >
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm font-bold transition hover:opacity-80"
                          style={{ color: "var(--stitch-color-on-surface)" }}
                          onClick={() => setCartQty(line.productId, line.qty - 1)}
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-bold text-white">{line.qty}</span>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm font-bold transition hover:opacity-80"
                          style={{ color: "var(--stitch-color-on-surface)" }}
                          onClick={() => setCartQty(line.productId, line.qty + 1)}
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-medium underline-offset-2 transition hover:underline"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                        onClick={() => removeCartLine(line.productId)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-white">
                    {formatVndDisplay(line.priceVnd * line.qty)} <span className="text-[10px] font-normal">VND</span>
                  </p>
                </li>
              ))}
            </ul>

            <div
              className="mt-8 space-y-3 border-t pt-6"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <span>Tạm tính</span>
                <span className="tabular-nums text-white">{formatVndDisplay(cartSubtotalVnd)} VND</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <span>Phí vận chuyển</span>
                <span className="tabular-nums text-white">
                  {shippingVnd === 0 ? "Miễn phí" : `${formatVndDisplay(shippingVnd)} VND`}
                </span>
              </div>
              {discountVoucherVnd > 0 ? (
                <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Giảm giá</span>
                  <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                    -{formatVndDisplay(discountVoucherVnd)} VND
                  </span>
                </div>
              ) : null}
              {shippingDiscountVnd > 0 ? (
                <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  <span>Freeship</span>
                  <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                    -{formatVndDisplay(shippingDiscountVnd)} VND
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-black">
                <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                  {formatVndDisplay(totalVnd)} VND
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              {deliveryMethod === "STANDARD"
                ? "Đơn từ 2.000.000 VND được miễn phí giao hàng tiêu chuẩn."
                : "Hyper-Sonic Courier ưu tiên xử lý nhanh để giảm độ trễ."}
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA (Stitch-like bottom action bar) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background:
            "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 85%, transparent)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="submit"
            form="checkout-form"
            disabled={placing}
            className="flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
            }}
          >
            {placing ? "Đang đặt hàng..." : "Đặt hàng"}
          </button>
        </div>
      </div>
    </main>
  );
}
