"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = (searchParams.get("returnTo") || "/admin").trim() || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const res = await fetch("/api/admin/auth/me", { credentials: "include" });
      if (res.ok && !cancelled) {
        router.replace(returnTo.startsWith("/") ? returnTo : "/admin");
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [router, returnTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Đăng nhập thất bại");
        setLoading(false);
        return;
      }
      router.replace(returnTo.startsWith("/") ? returnTo : "/admin");
      router.refresh();
    } catch {
      setError("Lỗi mạng, thử lại.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div
        className="rounded-2xl border p-8"
        style={{
          background: "var(--stitch-color-surface-container)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 30%, transparent)",
        }}
      >
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--stitch-font-headline, var(--stitch-font-body))" }}
        >
          Đăng nhập quản trị
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Tài khoản riêng cho khu vực admin — không dùng chung với tài khoản mua hàng.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Email admin
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--stitch-color-surface)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 45%, transparent)",
                color: "var(--stitch-color-on-surface)",
              }}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Mật khẩu
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                background: "var(--stitch-color-surface)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 45%, transparent)",
                color: "var(--stitch-color-on-surface)",
              }}
            />
          </div>

          {error ? (
            <p className="text-sm" style={{ color: "var(--stitch-color-error)" }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
            style={{
              background: "color-mix(in srgb, var(--stitch-color-primary) 35%, transparent)",
              color: "var(--stitch-color-on-surface)",
            }}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm">
        <Link href="/" className="underline" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          ← Về cửa hàng
        </Link>
      </p>
    </main>
  );
}
