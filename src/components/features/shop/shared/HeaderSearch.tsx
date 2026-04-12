"use client";

import type { KeyboardEvent } from "react";

type SearchProduct = { id: string; title: string; img: string; price: string };

type RouterLike = { push: (href: string) => void };

function SearchHitsDropdown({
  hits,
  onPick,
}: {
  hits: SearchProduct[];
  onPick: (id: string) => void;
}) {
  return (
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
              onClick={() => onPick(p.id)}
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
  );
}

export function HeaderSearch({
  variant,
  q,
  setQ,
  open,
  setOpen,
  hits,
  router,
  ensureProducts,
  submitSearch,
}: {
  variant: "mobile" | "desktop";
  q: string;
  setQ: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  hits: SearchProduct[];
  router: RouterLike;
  ensureProducts: () => Promise<void>;
  submitSearch: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submitSearch();
    if (e.key === "Escape") setOpen(false);
  };

  const onPick = (id: string) => {
    setOpen(false);
    router.push(`/product/${encodeURIComponent(id)}`);
  };

  const showDropdown = open && q.trim();

  if (variant === "mobile") {
    return (
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
          onKeyDown={onKeyDown}
        />
        <span
          className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg"
          style={{ color: "var(--stitch-color-on-surface-variant)" }}
          aria-hidden
        >
          search
        </span>

        {showDropdown ? <SearchHitsDropdown hits={hits} onPick={onPick} /> : null}
      </div>
    );
  }

  return (
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
          onKeyDown={onKeyDown}
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

        {showDropdown ? <SearchHitsDropdown hits={hits} onPick={onPick} /> : null}
      </div>
    </div>
  );
}
