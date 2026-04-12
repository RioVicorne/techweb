"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { HeaderSearch } from "@/components/features/shop/shared/HeaderSearch";
import {
  NAV_CATEGORY_MENU_MAX,
  type NavCategoryItem,
} from "@/lib/nav-category-fallback";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type CatalogProduct = { id: string; title: string; img: string; price: string };
type NavCategory = NavCategoryItem;



function CategoryNavDropdownUI({
  categories,
  activeCategorySlug,
}: {
  categories: NavCategory[];
  activeCategorySlug: string;
}) {
  const pathname = usePathname() || "/";
  const navActiveSlug = activeCategorySlug.toLowerCase();
  const isNavCategoryActive = (slug: string) =>
    pathname === "/category" && navActiveSlug === slug.toLowerCase();
  const list = categories.slice(0, NAV_CATEGORY_MENU_MAX);
  const activeAny = pathname === "/category";

  return (
    <div className="group relative">
      <Link
        href="/category"
        className={`inline-flex items-center gap-1 rounded-md pb-1 font-bold transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] ${
          activeAny ? "border-b-2 text-white" : "text-slate-400"
        }`}
        style={
          activeAny
            ? {
                borderColor: "var(--stitch-color-primary)",
                color: "color-mix(in srgb, var(--stitch-color-primary) 90%, white)",
              }
            : undefined
        }
        aria-haspopup="menu"
        aria-expanded={undefined}
      >
        Danh mục
        <span className="material-symbols-outlined text-base leading-none" aria-hidden>
          expand_more
        </span>
      </Link>

      <div
        role="menu"
        aria-label="Danh sách danh mục"
        className="invisible absolute left-0 top-[calc(100%+10px)] z-50 w-64 translate-y-1 overflow-hidden rounded-2xl border p-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        style={{
          background:
            "color-mix(in srgb, var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container)) 94%, transparent)",
          borderColor:
            "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Link
          role="menuitem"
          href="/category"
          className={`flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] ${
            navActiveSlug ? "text-[var(--stitch-color-on-surface)]" : "text-[var(--stitch-color-primary)]"
          }`}
        >
          Tất cả danh mục
        </Link>
        <div
          className="my-1 h-px"
          style={{
            background:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
          }}
        />
        <div className="grid gap-1">
          {list.map((c) => {
            const active = isNavCategoryActive(c.slug);
            return (
              <Link
                key={c.slug}
                role="menuitem"
                href={`/category?category=${encodeURIComponent(c.slug)}`}
                className="flex min-h-[44px] items-center rounded-xl px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
                style={{
                  color: active ? "var(--stitch-color-primary)" : "var(--stitch-color-on-surface)",
                  background: active
                    ? "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)"
                    : "transparent",
                }}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeaderCategoryNav({ categories }: { categories: NavCategory[] }) {
  const searchParams = useSearchParams();
  return (
    <CategoryNavDropdownUI
      categories={categories}
      activeCategorySlug={searchParams.get("category") ?? ""}
    />
  );
}

function HeaderCategoryNavFallback({ categories }: { categories: NavCategory[] }) {
  return <CategoryNavDropdownUI categories={categories} activeCategorySlug="" />;
}

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
  const pathname = usePathname() || "/";
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [authed, setAuthed] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog/categories", { method: "GET" })
      .then((r) => r.json())
      .then((json: { categories?: NavCategory[] }) => {
        if (cancelled || !Array.isArray(json.categories)) return;
        setNavCategories(json.categories.filter((c) => c.slug && c.name));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
            className="hidden items-center gap-6 lg:flex"
            aria-label="Danh mục"
            style={{
              fontFamily: "var(--stitch-font-headline)",
              letterSpacing: "-0.02em",
            }}
          >
            <Link
              href="/"
              className={`rounded-md pb-1 font-medium transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] ${
                pathname === "/" ? "border-b-2 font-bold text-white" : "text-slate-400"
              }`}
              style={
                pathname === "/"
                  ? {
                      borderColor: "var(--stitch-color-primary)",
                      color: "color-mix(in srgb, var(--stitch-color-primary) 90%, white)",
                    }
                  : undefined
              }
            >
              Trang chủ
            </Link>
            <Suspense fallback={<HeaderCategoryNavFallback categories={navCategories} />}>
              <HeaderCategoryNav categories={navCategories} />
            </Suspense>
            {[
              {
                href: "/category",
                label: "Sản phẩm",
                match: (p: string) => p.startsWith("/category") || p.startsWith("/product"),
              },
              { href: "/orders", label: "Đơn hàng", match: (p: string) => p.startsWith("/orders") },
              { href: "/#contact", label: "Liên hệ", match: () => false },
            ].map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`rounded-md pb-1 font-medium transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] ${
                    active ? "border-b-2 font-bold text-white" : "text-slate-400"
                  }`}
                  style={
                    active
                      ? {
                          borderColor: "var(--stitch-color-primary)",
                          color: "color-mix(in srgb, var(--stitch-color-primary) 90%, white)",
                        }
                      : undefined
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <HeaderSearch
            variant="mobile"
            q={q}
            setQ={setQ}
            open={open}
            setOpen={setOpen}
            hits={hits}
            router={router}
            ensureProducts={ensureProducts}
            submitSearch={submitSearch}
          />
          <HeaderSearch
            variant="desktop"
            q={q}
            setQ={setQ}
            open={open}
            setOpen={setOpen}
            hits={hits}
            router={router}
            ensureProducts={ensureProducts}
            submitSearch={submitSearch}
          />
          <div className="flex items-center gap-3">
            <Link
              href="/checkout"
              className="relative flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)]"
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
              className="hidden h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--stitch-color-secondary)] md:flex"
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

