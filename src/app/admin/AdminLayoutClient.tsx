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
        className="shrink-0 border-b p-5 md:w-64 md:border-b-0 md:border-r"
        style={{
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
          background:
            "var(--stitch-color-surface-container-low)",
        }}
      >
        <div className="mb-8 flex flex-col gap-1">
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

        <nav className="flex flex-row flex-wrap gap-1.5 md:flex-col">
          {nav.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
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
                  className="material-symbols-outlined text-[22px] transition-transform group-hover:scale-110"
                  style={{ fontVariationSettings: `"FILL" ${active ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 flex flex-col gap-4 border-t pt-8 md:mt-12" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 20%, transparent)" }}>
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
      </aside>
      <main className="min-w-0 flex-1 p-6 pb-28 md:p-10 md:pb-10">{children}</main>
    </div>
  );
}
