"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";

export function ShopHeader() {
  const { itemCount } = useCart();

  return (
    <header
      className="fixed top-0 z-50 w-full shadow-[0_0_20px_rgba(133,173,255,0.1)] backdrop-blur-xl"
      style={{
        background:
          "color-mix(in srgb, var(--stitch-color-background, var(--stitch-color-surface)) 80%, transparent)",
      }}
    >
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href="/"
            className="font-black italic tracking-tighter transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              fontSize: "1.5rem",
              color: "var(--stitch-color-primary)",
            }}
          >
            NEON KINETIC
          </Link>
          <nav
            className="hidden items-center gap-8 lg:flex"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              letterSpacing: "-0.02em",
            }}
          >
            <Link
              href="#"
              className="border-b-2 pb-1 font-bold transition-all duration-300"
              style={{
                color: "color-mix(in srgb, var(--stitch-color-primary) 90%, white)",
                borderColor: "var(--stitch-color-primary)",
              }}
            >
              PC
            </Link>
            {["Mobile", "Console", "Software"].map((label) => (
              <Link
                key={label}
                href="#"
                className="font-medium text-slate-400 transition-colors duration-300 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative hidden md:block">
            <input
              type="search"
              placeholder="Search tech..."
              className="w-52 rounded-full border-none py-2 pl-4 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--stitch-color-secondary)]"
              style={{
                background: "var(--stitch-color-surface-container)",
                color: "var(--stitch-color-on-surface)",
                caretColor: "var(--stitch-color-secondary)",
              }}
            />
            <span
              className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg"
              style={{ color: "var(--stitch-color-on-surface-variant)" }}
            >
              search
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/checkout"
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95"
              style={{
                background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                color: "var(--stitch-color-on-surface-variant)",
              }}
              aria-label="Giỏ hàng"
              title="Giỏ hàng"
            >
              <span className="material-symbols-outlined text-[22px] leading-none">shopping_cart</span>
              {itemCount > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: "var(--stitch-color-secondary)" }}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Login
            </button>
            <button
              type="button"
              className="rounded-full px-5 py-2 text-sm font-bold shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                color: "var(--stitch-color-on-primary)",
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
