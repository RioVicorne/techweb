"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/admin", label: "Tổng quan", icon: "dashboard" },
  { href: "/admin/products", label: "Sản phẩm", icon: "shopping_bag" },
  { href: "/admin/orders", label: "Xử lý đơn", icon: "orders" },
  { href: "/admin/inventory", label: "Kho hàng", icon: "inventory_2" },
];

function navActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "guest" | "ready">("loading");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginRoute = pathname?.startsWith("/admin/login") ?? false;

  useEffect(() => {
    if (isLoginRoute) {
      setPhase("ready");
      return;
    }

    let cancelled = false;
    async function run() {
      const res = await fetch("/api/admin/auth/me", { credentials: "include" });
      if (res.status === 401 || res.status === 503) {
        if (!cancelled) {
          setPhase("guest");
          router.replace(`/admin/login?returnTo=${encodeURIComponent(pathname || "/admin")}`);
        }
        return;
      }
      if (!cancelled) setPhase("ready");
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [isLoginRoute, pathname, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (phase === "loading") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: "var(--stitch-color-surface)" }}
      >
        <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đang tải...
        </p>
      </div>
    );
  }

  if (phase === "guest") return null;

  return (
    <div
      className="flex min-h-dvh flex-col md:flex-row"
      style={{ background: "var(--stitch-color-surface)" }}
    >
      <aside
        className="shrink-0 border-b p-4 md:w-64 md:border-b-0 md:border-r md:p-5"
        style={{
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
          background:
            "var(--stitch-color-surface-container-low)",
        }}
      >
        <div className="flex items-center justify-between gap-3 md:block">
          <div className="flex flex-col gap-1 md:mb-8">
            <p
              className="text-lg font-black tracking-tighter uppercase italic"
              style={{
                fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))",
                color: "var(--stitch-color-primary)"
              }}
            >
              RioTranShop
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Admin control</p>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-90 md:hidden"
            style={{
              borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 40%, transparent)",
              color: "var(--stitch-color-on-surface)",
              background: "var(--stitch-color-surface-container)",
            }}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden>
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out md:block ${mobileMenuOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0 md:opacity-100"}`}
        >
          <div className="min-h-0">
            <nav className="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-1.5">
              {nav.map((item) => {
                const active = navActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-all duration-200 md:gap-3 md:px-4 md:py-2.5 md:text-sm"
                    style={{
                      background: active
                        ? "var(--stitch-color-secondary-container)"
                        : "transparent",
                      color: active
                        ? "var(--stitch-color-on-secondary-container)"
                        : "var(--stitch-color-on-surface-variant)",
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 md:text-[22px]"
                      style={{ fontVariationSettings: `"FILL" ${active ? 1 : 0}` }}
                    >
                      {item.icon}
                    </span>
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 flex flex-col gap-4 border-t pt-6 md:mt-12 md:pt-8" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 20%, transparent)" }}>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center gap-2 text-xs font-bold transition hover:opacity-80"
                style={{ color: "var(--stitch-color-error, #f87171)" }}
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Đăng xuất
              </button>
              <Link
                href="/"
                className="flex items-center gap-2 text-xs font-bold transition hover:opacity-80"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Về cửa hàng
              </Link>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 pb-28 md:p-10 md:pb-10">{children}</main>
    </div>
  );
}
