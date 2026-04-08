"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/cart-context";

type NavItem = {
  href: string;
  label: string;
  icon: string; // material-symbols-outlined name
  match?: (pathname: string) => boolean;
  badge?: "cart";
};

const ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/category", label: "Danh mục", icon: "grid_view", match: (p) => p.startsWith("/category") },
  { href: "/#contact", label: "Liên hệ", icon: "call" },
  { href: "/#account", label: "Tài khoản", icon: "account_circle" },
];

function isHiddenOn(pathname: string) {
  return pathname.startsWith("/checkout") || pathname.startsWith("/product");
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { itemCount } = useCart();

  if (isHiddenOn(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Bottom navigation"
      style={{
        background:
          "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 85%, transparent)",
        borderColor:
          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
        borderTopWidth: 1,
        backdropFilter: "blur(14px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto grid max-w-screen-md grid-cols-4 px-2 py-2">
        {ITEMS.map((it) => {
          const active = it.match ? it.match(pathname) : false;
          const showBadge = it.badge === "cart" && itemCount > 0;

          return (
            <Link
              key={it.label}
              href={it.href}
              className="relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition active:scale-[0.98]"
              style={{
                color: active ? "var(--stitch-color-primary)" : "var(--stitch-color-on-surface-variant)",
                background: active
                  ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)"
                  : "transparent",
              }}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                  {it.icon}
                </span>
                {showBadge ? (
                  <span
                    className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                    style={{ background: "var(--stitch-color-secondary)" }}
                    aria-label={`Có ${itemCount} sản phẩm trong giỏ`}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] font-bold leading-none">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

