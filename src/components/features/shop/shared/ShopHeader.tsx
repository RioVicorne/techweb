"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type CatalogProduct = { id: string; title: string; img: string; price: string };

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function ShopHeader() {
  const { itemCount } = useCart();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [authed, setAuthed] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const hits = useMemo(() => {
    const qn = norm(q);
    if (!qn) return [];
    return products
      .filter((p) => norm(p.title || "").includes(qn))
      .slice(0, 8);
  }, [products, q]);

  async function ensureProducts() {
    if (products.length > 0 || loadingProducts) return;
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/catalog/products", { method: "GET" });
      const json = (await res.json()) as { products?: CatalogProduct[] };
      setProducts(Array.isArray(json.products) ? json.products : []);
    } finally {
      setLoadingProducts(false);
    }
  }

  function submitSearch() {
    const qq = q.trim();
    if (!qq) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(qq)}`);
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

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
            RioShop
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
          {/* Mobile search */}
          <div className="relative md:hidden">
            <input
              type="search"
              placeholder="Tìm sản phẩm..."
              className="w-44 rounded-full border-none py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--stitch-color-secondary)]"
              style={{
                background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                color: "var(--stitch-color-on-surface)",
                caretColor: "var(--stitch-color-secondary)",
              }}
              value={q}
              onFocus={async () => {
                setOpen(true);
                await ensureProducts();
              }}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg"
              style={{ color: "var(--stitch-color-on-surface-variant)" }}
              aria-hidden
            >
              search
            </span>

            {open && q.trim() ? (
              <div
                className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border"
                style={{
                  background: "var(--stitch-color-surface-container)",
                  borderColor:
                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                }}
              >
                {hits.length === 0 ? (
                  <div className="px-4 py-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    Không tìm thấy sản phẩm.
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline) 8%, transparent)" }}>
                    {hits.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:opacity-95"
                        onClick={() => {
                          setOpen(false);
                          router.push(`/product/${encodeURIComponent(p.id)}`);
                        }}
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-xl" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.img} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-black text-white">{p.title}</div>
                          <div className="mt-0.5 text-xs font-black" style={{ color: "var(--stitch-color-primary)" }}>
                            {p.price} VND
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="relative hidden md:block">
            <div className="relative">
              <input
                type="search"
                placeholder="Tìm sản phẩm..."
                className="w-52 rounded-full border-none py-2 pl-4 pr-12 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--stitch-color-secondary)]"
                style={{
                  background: "var(--stitch-color-surface-container)",
                  color: "var(--stitch-color-on-surface)",
                  caretColor: "var(--stitch-color-secondary)",
                }}
                value={q}
                onFocus={async () => {
                  setOpen(true);
                  await ensureProducts();
                }}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSearch();
                  if (e.key === "Escape") setOpen(false);
                }}
              />

              <button
                type="button"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition active:scale-95"
                style={{
                  background:
                    "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)",
                  color: "var(--stitch-color-primary)",
                }}
                aria-label="Tìm kiếm"
                title="Tìm kiếm"
                onClick={submitSearch}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden>
                  search
                </span>
              </button>

              {open && q.trim() ? (
                <div
                  className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border"
                  style={{
                    background: "var(--stitch-color-surface-container)",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                  }}
                >
                  {hits.length === 0 ? (
                    <div className="px-4 py-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Không tìm thấy sản phẩm.
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline) 8%, transparent)" }}>
                      {hits.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:opacity-95"
                          onClick={() => {
                            setOpen(false);
                            router.push(`/product/${encodeURIComponent(p.id)}`);
                          }}
                        >
                          <div className="h-10 w-10 overflow-hidden rounded-xl" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.img} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-white">{p.title}</div>
                            <div className="mt-0.5 text-xs font-black" style={{ color: "var(--stitch-color-primary)" }}>
                              {p.price} VND
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
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
              className="hidden h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 md:flex"
              style={{
                background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                color: authed ? "var(--stitch-color-primary)" : "var(--stitch-color-on-surface-variant)",
                border:
                  "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
              }}
              aria-label={authed ? "Tài khoản" : "Đăng nhập"}
              title={authed ? "Tài khoản" : "Đăng nhập"}
              onClick={() => {
                router.push(authed ? "/account" : "/login");
              }}
            >
              <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                person
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

