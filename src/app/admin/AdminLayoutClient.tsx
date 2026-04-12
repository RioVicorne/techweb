"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/admin", label: "Tổng quan", icon: "dashboard" },
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
        className="shrink-0 border-b p-4 md:w-56 md:border-b-0 md:border-r"
        style={{
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 35%, transparent)",
          background:
            "color-mix(in srgb, var(--stitch-color-surface-container, var(--stitch-color-surface)) 100%, transparent)",
        }}
      >
        <p
          className="mb-4 text-sm font-semibold tracking-tight"
          style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}
        >
          RioTranShop · Admin
        </p>
        <nav className="flex flex-row flex-wrap gap-2 md:flex-col">
          {nav.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors"
                style={{
                  background: active
                    ? "color-mix(in srgb, var(--stitch-color-primary) 22%, transparent)"
                    : "transparent",
                  color: active
                    ? "var(--stitch-color-on-surface)"
                    : "var(--stitch-color-on-surface-variant)",
                }}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 flex flex-col gap-2 md:mt-8">
          <button
            type="button"
            onClick={() => void logout()}
            className="text-left text-xs underline"
            style={{ color: "var(--stitch-color-on-surface-variant)" }}
          >
            Đăng xuất admin
          </button>
          <Link href="/" className="text-xs underline" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            ← Cửa hàng
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 pb-28 md:p-8 md:pb-8">{children}</div>
    </div>
  );
}
