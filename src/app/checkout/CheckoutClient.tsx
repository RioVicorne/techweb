"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { useCart } from "@/context/cart-context";
import { formatVndDisplay } from "@/data/products";

const inputClass =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--stitch-color-secondary)]";

const inputStyle: CSSProperties = {
  background: "var(--stitch-color-surface-container)",
  borderColor:
    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
  color: "var(--stitch-color-on-surface)",
};

export function CheckoutClient() {
  const { lines, subtotalVnd, setQty, removeLine } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const shippingVnd = useMemo(() => (subtotalVnd >= 2_000_000 ? 0 : 30_000), [subtotalVnd]);
  const totalVnd = subtotalVnd + shippingVnd;

  if (lines.length === 0) {
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

  if (submitted) {
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
            style={{ color: "var(--stitch-color-tertiary, var(--stitch-color-secondary))" }}
          >
            check_circle
          </span>
          <h1
            className="mb-2 text-xl font-bold text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Đã nhận đơn hàng (demo)
          </h1>
          <p className="mb-8 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Cảm ơn bạn, {form.name || "khách hàng"}. Đây là giao diện minh họa — chưa kết nối cổng thanh
            toán.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-8 py-3 text-sm font-bold transition active:scale-95"
            style={{
              background: "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
              color: "var(--stitch-color-primary)",
            }}
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link href="/" className="font-medium transition hover:underline" style={{ color: "var(--stitch-color-primary)" }}>
          Trang chủ
        </Link>
        <span style={{ color: "var(--stitch-color-on-surface-variant)" }}>/</span>
        <span style={{ color: "var(--stitch-color-on-surface-variant)" }}>Thanh toán</span>
      </nav>

      <div className="mb-10">
        <h1
          className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-tighter text-white md:text-3xl"
          style={{ fontFamily: "var(--stitch-font-headline)" }}
        >
          <span className="h-0.5 w-10" style={{ background: "var(--stitch-color-secondary)" }} />
          Thanh toán
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Hoàn tất thông tin giao hàng — cùng phong cách NEON KINETIC / Stitch tokens.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <section
          className="rounded-3xl border p-6 sm:p-8 lg:col-span-7"
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
            Thông tin giao hàng
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Họ và tên
              </label>
              <input
                required
                className={inputClass}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoComplete="name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Số điện thoại
                </label>
                <input
                  required
                  type="tel"
                  className={inputClass}
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Email
                </label>
                <input
                  required
                  type="email"
                  className={inputClass}
                  style={inputStyle}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Địa chỉ
              </label>
              <input
                required
                className={inputClass}
                style={inputStyle}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                autoComplete="street-address"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                style={inputStyle}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] sm:w-auto sm:px-12"
              style={{
                background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
              }}
            >
              Đặt hàng
            </button>
          </form>
        </section>

        <aside
          className="lg:sticky lg:top-28 lg:col-span-5"
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
              {lines.map((line) => (
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
                          onClick={() => setQty(line.productId, line.qty - 1)}
                          aria-label="Giảm số lượng"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-bold text-white">{line.qty}</span>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm font-bold transition hover:opacity-80"
                          style={{ color: "var(--stitch-color-on-surface)" }}
                          onClick={() => setQty(line.productId, line.qty + 1)}
                          aria-label="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-medium underline-offset-2 transition hover:underline"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                        onClick={() => removeLine(line.productId)}
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
                <span className="tabular-nums text-white">{formatVndDisplay(subtotalVnd)} VND</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                <span>Phí vận chuyển</span>
                <span className="tabular-nums text-white">
                  {shippingVnd === 0 ? "Miễn phí" : `${formatVndDisplay(shippingVnd)} VND`}
                </span>
              </div>
              <div className="flex justify-between text-base font-black">
                <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                  {formatVndDisplay(totalVnd)} VND
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Đơn từ 2.000.000 VND được miễn phí giao hàng tiêu chuẩn (demo).
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
