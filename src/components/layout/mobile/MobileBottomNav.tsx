"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/cart-context";
import {
  NAV_CATEGORY_MENU_MAX,
  iconForCategorySlug,
  type NavCategoryItem,
} from "@/lib/nav-category-fallback";

type NavItem = {
  href: string;
  label: string;
  icon: string; // material-symbols-outlined name
  match?: (pathname: string) => boolean;
  badge?: "cart";
};

const ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  {
    href: "/category",
    label: "Danh mục",
    icon: "grid_view",
    match: (p) => p.startsWith("/category"),
  },
  {
    href: "/contact",
    label: "Liên hệ",
    icon: "call",
    match: (p) => p.startsWith("/contact"),
  },
  {
    href: "/account",
    label: "Tài khoản",
    icon: "account_circle",
    match: (p) => p.startsWith("/account"),
  },
];

function isHiddenOn(pathname: string) {
  return pathname.startsWith("/checkout") || pathname.startsWith("/admin") || pathname.startsWith("/login");
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const { itemCount } = useCart();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [navCategories, setNavCategories] = useState<NavCategoryItem[]>([]);
  const categoryWrapRef = useRef<HTMLDivElement | null>(null);

  const categoryActive = useMemo(
    () => pathname.startsWith("/category"),
    [pathname],
  );

  const activeTabIndex = useMemo(() => {
    if (pathname === "/") return 0;
    if (pathname.startsWith("/category")) return 1;
    if (pathname.startsWith("/contact")) return 2;
    if (pathname.startsWith("/account")) return 3;
    return -1;
  }, [pathname]);

  useEffect(() => {
    setCategoryOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = categoryWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target))
        setCategoryOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setCategoryOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog/categories", { method: "GET" })
      .then((r) => r.json())
      .then((json: { categories?: NavCategoryItem[] }) => {
        if (cancelled || !Array.isArray(json.categories)) return;
        setNavCategories(json.categories.filter((c) => c.slug && c.name));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMenu = useMemo(() => {
    const src = navCategories;
    return src.slice(0, NAV_CATEGORY_MENU_MAX).map((c) => ({
      key: c.slug,
      label: c.name,
      icon: iconForCategorySlug(c.slug),
    }));
  }, [navCategories]);

  if (isHiddenOn(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
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
      <div className="relative mx-auto grid max-w-screen-md grid-cols-4 px-2 py-2">
        {activeTabIndex >= 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 top-2 rounded-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: "0.5rem",
              width: "calc((100% - 1rem) / 4)",
              transform: `translateX(calc(${activeTabIndex} * 100%))`,
              background:
                "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)",
            }}
          />
        ) : null}

        {ITEMS.map((it) => {
          const active = it.match ? it.match(pathname) : false;
          const showBadge = it.badge === "cart" && itemCount > 0;
          const tabTransition =
            "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform";
          const tabStateClass = active
            ? "scale-[1.03] opacity-100"
            : "scale-100 opacity-80";

          if (it.href === "/category") {
            return (
              <div key={it.label} className="relative z-10" ref={categoryWrapRef}>
                <button
                  type="button"
                  className={`group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${categoryActive ? "scale-[1.03] opacity-100" : "opacity-80"} active:scale-[0.98]`}
                  style={{
                    color: categoryActive
                      ? "var(--stitch-color-primary)"
                      : "var(--stitch-color-on-surface-variant)",
                  }}
                  aria-current={categoryActive ? "page" : undefined}
                  aria-haspopup="menu"
                  aria-expanded={categoryOpen}
                  onClick={() => setCategoryOpen((v) => !v)}
                >
                  <span className="relative">
                    <span
                      className="material-symbols-outlined text-[22px] leading-none"
                      aria-hidden
                    >
                      {it.icon}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold leading-none">
                    {it.label}
                  </span>
                </button>

                {categoryOpen ? (
                  <div
                    role="menu"
                    aria-label="Danh mục"
                    className="absolute bottom-full left-1/2 mb-2 w-[220px] -translate-x-1/2 overflow-hidden rounded-3xl border p-2 shadow-xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 92%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    <Link
                      role="menuitem"
                      href="/category"
                      className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold transition active:scale-[0.99]"
                      style={{
                        color: "var(--stitch-color-on-surface)",
                        background: "transparent",
                      }}
                      onClick={() => setCategoryOpen(false)}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        aria-hidden
                      >
                        grid_view
                      </span>
                      Tất cả sản phẩm
                    </Link>
                    <div
                      className="my-2 h-px"
                      style={{
                        background:
                          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                      }}
                    />
                    <div className="grid gap-1">
                      {categoryMenu.map((c) => (
                        <Link
                          key={c.key}
                          role="menuitem"
                          href={`/category?category=${encodeURIComponent(c.key)}`}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold transition active:scale-[0.99]"
                          style={{
                            color: "var(--stitch-color-on-surface)",
                            background:
                              "color-mix(in srgb, var(--stitch-color-surface-container-high, var(--stitch-color-surface-container)) 85%, transparent)",
                          }}
                          onClick={() => setCategoryOpen(false)}
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ color: "var(--stitch-color-primary)" }}
                            aria-hidden
                          >
                            {c.icon}
                          </span>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={it.label}
              href={it.href}
              prefetch
              className={`relative z-10 flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 ${tabTransition} ${tabStateClass} active:scale-[0.98]`}
              style={{
                color: active
                  ? "var(--stitch-color-primary)"
                  : "var(--stitch-color-on-surface-variant)",
              }}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <span
                  className="material-symbols-outlined text-[22px] leading-none"
                  aria-hidden
                >
                  {it.icon}
                </span>
                {showBadge ? (
                  <span
                    className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-[var(--stitch-color-on-secondary)]"
                    style={{ background: "var(--stitch-color-secondary)" }}
                    aria-label={`Có ${itemCount} sản phẩm trong giỏ`}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                ) : null}
              </span>
              <span className="text-[11px] font-bold leading-none">
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
