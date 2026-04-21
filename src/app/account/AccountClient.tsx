"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { ORDER_STATUS_TABS, orderStatusTabColor, orderRowStatusLabel } from "@/lib/order-status-tabs";
import { formatVndDisplay } from "@/data/products";

type OrderRow = {
  order_code: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
};

type PurchaseRow = {
  sku: string;
  title: string;
  image: string;
  unit_price: number;
  total_qty: number;
  last_order_code: string;
  last_purchased_at: string;
};

type SuggestedProduct = {
  id: string;
  title: string;
  price: string;
  img: string;
};

type ShippingAddress = {
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  street: string;
};

type ServerOrderRow = {
  id: string;
  created_at: string;
  customer: { name: string; phone: string; email: string; address: string; note?: string };
  lines: unknown[];
  subtotal_vnd: number;
  shipping_vnd: number;
  total_vnd: number;
};

type OrderDetail = {
  orderId: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  subtotalVnd: number;
  shippingVnd: number;
  totalVnd: number;
};

type AccountOverviewValue = {
  orders: OrderRow[];
  counts: Record<string, number>;
  purchases: PurchaseRow[];
};

type AccountOrderDetailValue = {
  order: OrderDetail | null;
};

type SuggestedProductsValue = {
  products: SuggestedProduct[];
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const ACCOUNT_OVERVIEW_CACHE_TTL_MS = 15_000;
const ACCOUNT_ORDER_DETAIL_CACHE_TTL_MS = 15_000;
const SUGGESTED_PRODUCTS_CACHE_TTL_MS = 60_000;

type LocationOption = { code: string; name: string };
type VnAddressDataset = {
  provinces: LocationOption[];
  getDistrictsByProvinceCode: (provinceCode: string) => LocationOption[];
  getWardsByDistrictCode: (districtCode: string) => LocationOption[];
};

let vnAddressDataPromise: Promise<VnAddressDataset> | null = null;

async function loadVnAddressDataset(): Promise<VnAddressDataset> {
  if (!vnAddressDataPromise) {
    vnAddressDataPromise = import("pc-vn").then((mod) => {
      const dataset = mod.default ?? mod;
      return {
        provinces: dataset.getProvinces() as LocationOption[],
        getDistrictsByProvinceCode: (provinceCode: string) =>
          (dataset.getDistrictsByProvinceCode(provinceCode) as LocationOption[]) ?? [],
        getWardsByDistrictCode: (districtCode: string) =>
          (dataset.getWardsByDistrictCode(districtCode) as LocationOption[]) ?? [],
      };
    });
  }

  return vnAddressDataPromise;
}

const overviewCache = new Map<string, CacheEntry<AccountOverviewValue>>();
const overviewInFlight = new Map<string, Promise<AccountOverviewValue>>();

const orderDetailCache = new Map<string, CacheEntry<AccountOrderDetailValue>>();
const orderDetailInFlight = new Map<string, Promise<AccountOrderDetailValue>>();

const suggestedCache = new Map<string, CacheEntry<SuggestedProductsValue>>();
const suggestedInFlight = new Map<string, Promise<SuggestedProductsValue>>();

function getCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function setCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

async function fetchOverview(token: string): Promise<AccountOverviewValue> {
  const cacheKey = token;
  const cached = getCachedValue(overviewCache, cacheKey);
  if (cached) return cached;

  const inFlight = overviewInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const req = (async () => {
    const overviewRes = await fetch("/api/account/overview", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });

    if (!overviewRes.ok) {
      throw new Error(`Failed to load account overview (${overviewRes.status})`);
    }

    const overviewJson = (await overviewRes.json()) as {
      orders?: OrderRow[];
      counts?: Record<string, number>;
      purchases?: PurchaseRow[];
    };

    const value: AccountOverviewValue = {
      orders: Array.isArray(overviewJson.orders) ? overviewJson.orders : [],
      purchases: Array.isArray(overviewJson.purchases) ? overviewJson.purchases : [],
      counts: overviewJson.counts && typeof overviewJson.counts === "object" ? overviewJson.counts : {},
    };

    setCachedValue(overviewCache, cacheKey, value, ACCOUNT_OVERVIEW_CACHE_TTL_MS);
    return value;
  })().finally(() => {
    overviewInFlight.delete(cacheKey);
  });

  overviewInFlight.set(cacheKey, req);
  return req;
}

async function fetchSuggestedProducts(): Promise<SuggestedProductsValue> {
  const cacheKey = "products";
  const cached = getCachedValue(suggestedCache, cacheKey);
  if (cached) return cached;

  const inFlight = suggestedInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const req = (async () => {
    const suggestedRes = await fetch("/api/catalog/products", { method: "GET" });
    if (!suggestedRes.ok) {
      throw new Error(`Failed to load suggested products (${suggestedRes.status})`);
    }

    const suggestedJson = (await suggestedRes.json()) as { products?: SuggestedProduct[] };
    const value: SuggestedProductsValue = {
      products: Array.isArray(suggestedJson.products) ? suggestedJson.products.slice(0, 6) : [],
    };

    setCachedValue(suggestedCache, cacheKey, value, SUGGESTED_PRODUCTS_CACHE_TTL_MS);
    return value;
  })().finally(() => {
    suggestedInFlight.delete(cacheKey);
  });

  suggestedInFlight.set(cacheKey, req);
  return req;
}

async function fetchSelectedOrder(token: string, selectedOrderId: string): Promise<AccountOrderDetailValue> {
  const cacheKey = `${token}:${selectedOrderId}`;
  const cached = getCachedValue(orderDetailCache, cacheKey);
  if (cached) return cached;

  const inFlight = orderDetailInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const req = (async () => {
    const res = await fetch(`/api/orders/${encodeURIComponent(selectedOrderId)}`, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });

    if (res.status === 404) {
      const value: AccountOrderDetailValue = { order: null };
      setCachedValue(orderDetailCache, cacheKey, value, ACCOUNT_ORDER_DETAIL_CACHE_TTL_MS);
      return value;
    }

    if (!res.ok) {
      throw new Error(`Failed to load selected order (${res.status})`);
    }

    const json = (await res.json()) as { order?: unknown };
    const o = json.order as Partial<ServerOrderRow> | undefined;

    if (
      !o?.id ||
      !o.created_at ||
      !o.customer ||
      typeof o.subtotal_vnd !== "number" ||
      typeof o.shipping_vnd !== "number" ||
      typeof o.total_vnd !== "number"
    ) {
      const value: AccountOrderDetailValue = { order: null };
      setCachedValue(orderDetailCache, cacheKey, value, ACCOUNT_ORDER_DETAIL_CACHE_TTL_MS);
      return value;
    }

    const value: AccountOrderDetailValue = {
      order: {
        orderId: String(o.id),
        createdAt: String(o.created_at),
        customerName: String(o.customer.name ?? ""),
        phone: String(o.customer.phone ?? ""),
        email: String(o.customer.email ?? ""),
        address: String(o.customer.address ?? ""),
        subtotalVnd: Number(o.subtotal_vnd),
        shippingVnd: Number(o.shipping_vnd),
        totalVnd: Number(o.total_vnd),
      },
    };

    setCachedValue(orderDetailCache, cacheKey, value, ACCOUNT_ORDER_DETAIL_CACHE_TTL_MS);
    return value;
  })().finally(() => {
    orderDetailInFlight.delete(cacheKey);
  });

  orderDetailInFlight.set(cacheKey, req);
  return req;
}

export function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    provinceCode: "",
    districtCode: "",
    wardCode: "",
    street: "",
  });
  const [vnAddressData, setVnAddressData] = useState<VnAddressDataset | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [suggested, setSuggested] = useState<SuggestedProduct[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const selectedOrderId = (searchParams.get("orderId") || "").trim();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);

  const loyaltyPoints = useMemo(() => {
    // Heuristic points: 10 points per purchased item quantity
    return purchases.reduce((sum, x) => sum + (Number(x.total_qty) || 0) * 10, 0);
  }, [purchases]);

  const loyaltyTierTarget = 500;
  const loyaltyProgress = Math.max(0, Math.min(1, loyaltyPoints / loyaltyTierTarget));
  const loyaltyRemaining = Math.max(0, loyaltyTierTarget - loyaltyPoints);

  const vouchers = useMemo(
    () => [
      { code: "FREESHIP", desc: "Miễn phí vận chuyển" },
      { code: "-50K", desc: "Giảm 50K đơn từ 499K" },
      { code: "VIP10", desc: "Giảm 10% (thành viên)" },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || "";
      const em = data.session?.user?.email || "";
      const meta = (data.session?.user?.user_metadata ?? {}) as Record<string, unknown>;
      if (!token) {
        router.replace(`/login?returnTo=${encodeURIComponent("/account")}`);
        return;
      }
      if (!cancelled) setEmail(em);
      if (!cancelled) {
        setFullName(String(meta.full_name ?? meta.name ?? ""));
        setPhone(String(meta.phone ?? ""));
      }
      try {
        const overview = await fetchOverview(token);

        let suggestedArr: SuggestedProduct[] = [];
        if (overview.purchases.length === 0) {
          try {
            const suggested = await fetchSuggestedProducts();
            suggestedArr = suggested.products;
          } catch {
            suggestedArr = [];
          }
        }

        if (!cancelled) {
          setOrders(overview.orders);
          setPurchases(overview.purchases);
          setSuggested(suggestedArr);
          setStatusCounts(overview.counts);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setPurchases([]);
          setSuggested([]);
          setStatusCounts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Defer the (potentially heavy) address normalization/mapping work off the route transition path.
      setTimeout(() => {
        if (cancelled) return;

        void (async () => {
          try {
            const dataset = await loadVnAddressDataset();
            if (cancelled) return;
            setVnAddressData(dataset);

            const normalize = (s: string) =>
              s
                .trim()
                .toLowerCase()
                .replaceAll("thành phố", "")
                .replaceAll("tỉnh", "")
                .replaceAll("quận", "")
                .replaceAll("huyện", "")
                .replaceAll("thị xã", "")
                .replaceAll("phường", "")
                .replaceAll("xã", "")
                .replaceAll("thị trấn", "")
                .replaceAll(/\s+/g, " ")
                .trim();

            const provinces = dataset.provinces;
            const addr = meta.shipping_address as
              | Partial<{
                  province_code: string;
                  district_code: string;
                  ward_code: string;
                  province: string;
                  district: string;
                  ward: string;
                  street: string;
                }>
              | undefined;

            const provinceCode =
              String(addr?.province_code ?? "") ||
              (() => {
                const byName = String(addr?.province ?? "");
                if (!byName) return "";
                const n = normalize(byName);
                const hit =
                  provinces.find((p) => normalize(p.name) === n) ??
                  provinces.find(
                    (p) => normalize(p.name).includes(n) || n.includes(normalize(p.name)),
                  );
                return hit?.code ?? "";
              })();

            const districts = provinceCode ? dataset.getDistrictsByProvinceCode(provinceCode) : [];

            const districtCode =
              String(addr?.district_code ?? "") ||
              (() => {
                const byName = String(addr?.district ?? "");
                if (!byName || !districts.length) return "";
                const n = normalize(byName);
                const hit =
                  districts.find((d) => normalize(d.name) === n) ??
                  districts.find(
                    (d) => normalize(d.name).includes(n) || n.includes(normalize(d.name)),
                  );
                return hit?.code ?? "";
              })();

            const wards = districtCode ? dataset.getWardsByDistrictCode(districtCode) : [];

            const wardCode =
              String(addr?.ward_code ?? "") ||
              (() => {
                const byName = String(addr?.ward ?? "");
                if (!byName || !wards.length) return "";
                const n = normalize(byName);
                const hit =
                  wards.find((w) => normalize(w.name) === n) ??
                  wards.find((w) => normalize(w.name).includes(n) || n.includes(normalize(w.name)));
                return hit?.code ?? "";
              })();

            if (!cancelled) {
              setShippingAddress({
                provinceCode,
                districtCode,
                wardCode,
                street: String(addr?.street ?? ""),
              });
            }
          } catch {
            // best-effort; ignore mapping errors
          }
        })();
      }, 0);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedOrderId) {
        setSelectedOrder(null);
        return;
      }

      setSelectedOrderLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token || "";
        if (!token) {
          if (!cancelled) setSelectedOrder(null);
          return;
        }

        const selected = await fetchSelectedOrder(token, selectedOrderId);
        if (!cancelled) setSelectedOrder(selected.order);
      } catch {
        if (!cancelled) setSelectedOrder(null);
      } finally {
        if (!cancelled) setSelectedOrderLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId, supabase]);

  const provinces = useMemo(() => vnAddressData?.provinces ?? [], [vnAddressData]);

  const selectedProvince = useMemo(
    () => provinces.find((p) => p.code === shippingAddress.provinceCode) ?? null,
    [provinces, shippingAddress.provinceCode]
  );

  const districts = useMemo(() => {
    if (!vnAddressData || !shippingAddress.provinceCode) return [];
    return vnAddressData.getDistrictsByProvinceCode(shippingAddress.provinceCode);
  }, [vnAddressData, shippingAddress.provinceCode]);

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.code === shippingAddress.districtCode) ?? null,
    [districts, shippingAddress.districtCode]
  );

  const wards = useMemo(() => {
    if (!vnAddressData || !shippingAddress.districtCode) return [];
    return vnAddressData.getWardsByDistrictCode(shippingAddress.districtCode);
  }, [vnAddressData, shippingAddress.districtCode]);

  const selectedWard = useMemo(
    () => wards.find((w) => w.code === shippingAddress.wardCode) ?? null,
    [wards, shippingAddress.wardCode]
  );

  const shippingAddressDisplay = useMemo(() => {
    const parts = [
      shippingAddress.street.trim(),
      selectedWard?.name?.trim() ?? "",
      selectedDistrict?.name?.trim() ?? "",
      selectedProvince?.name?.trim() ?? "",
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "";
  }, [
    shippingAddress.street,
    selectedWard?.name,
    selectedDistrict?.name,
    selectedProvince?.name,
  ]);

  const filteredOrders = orders;

  return (
    <main className="mx-auto max-w-screen-2xl px-6 pb-20 pt-28 md:px-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="grid gap-6 lg:col-span-5">
          {/* Section 1: Account / Edit */}
          <section
            className="h-fit rounded-3xl border p-6 md:p-8"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            {/* Compact summary (tap to edit) */}
            {!editing ? (
              <div
                role="button"
                tabIndex={0}
                className="w-full cursor-pointer text-left"
                onClick={() => {
                  setSaveError(null);
                  setEditing(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSaveError(null);
                    setEditing(true);
                  }
                }}
                aria-label="Open profile editor"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        background:
                          "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 22%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                      }}
                      aria-hidden
                    >
                      <span
                        className="text-lg font-black"
                        style={{ color: "var(--stitch-color-primary)", fontFamily: "var(--stitch-font-headline)" }}
                      >
                        {email ? email.trim().slice(0, 1).toUpperCase() : "R"}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div
                        className="line-clamp-1 text-base font-black text-[var(--stitch-color-on-surface)]"
                        style={{ fontFamily: "var(--stitch-font-headline)" }}
                      >
                        {fullName ? fullName : "Tài khoản"}
                      </div>
                      <div
                        className="mt-1 truncate text-xs"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                      >
                        {email || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background:
                          "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)",
                        color: "var(--stitch-color-primary)",
                      }}
                      aria-hidden
                    >
                      <span className="material-symbols-outlined text-[22px] leading-none">edit</span>
                    </div>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                        color: "var(--stitch-color-primary)",
                        border:
                          "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                      }}
                      aria-label="Sign out"
                      title="Sign out"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await supabase.auth.signOut();
                        router.replace("/");
                      }}
                    >
                      <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                        logout
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1
                      className="text-2xl font-black italic tracking-tighter text-[var(--stitch-color-on-surface)]"
                      style={{ fontFamily: "var(--stitch-font-headline)" }}
                    >
                      Chỉnh sửa thông tin
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      {email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-95"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                      color: "var(--stitch-color-on-surface-variant)",
                      border:
                        "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 25%, transparent)",
                    }}
                    aria-label="Back"
                    title="Back"
                    onClick={() => {
                      setEditing(false);
                      setSaveError(null);
                    }}
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                      arrow_back
                    </span>
                  </button>
                </div>

                <div className="grid gap-3">
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                    }}
                  >
                    <div
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--stitch-color-on-surface-variant)" }}
                    >
                      Full name
                    </div>
                    <input
                      className="mt-2 w-full bg-transparent text-sm font-bold text-[var(--stitch-color-on-surface)] outline-none"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                    }}
                  >
                    <div
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: "var(--stitch-color-on-surface-variant)" }}
                    >
                      Phone
                    </div>
                    <input
                      className="mt-2 w-full bg-transparent text-sm font-bold text-[var(--stitch-color-on-surface)] outline-none"
                      placeholder="090..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {saveError ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: "color-mix(in srgb, var(--stitch-color-error) 35%, transparent)",
                      color: "var(--stitch-color-on-surface)",
                    }}
                  >
                    {saveError}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold text-[var(--stitch-color-on-surface)] transition active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                      color: "var(--stitch-color-on-primary)",
                    }}
                    disabled={saving}
                    onClick={async () => {
                      setSaving(true);
                      setSaveError(null);
                      try {
                        const { error } = await supabase.auth.updateUser({
                          data: {
                            full_name: fullName.trim(),
                            phone: phone.trim(),
                          },
                        });
                        if (error) throw error;
                        setEditing(false);
                      } catch (e) {
                        setSaveError(e instanceof Error ? e.message : "Không thể lưu");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold transition active:scale-[0.99]"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                      color: "var(--stitch-color-on-surface-variant)",
                      border:
                        "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
                    }}
                    onClick={() => {
                      setEditing(false);
                      setSaveError(null);
                    }}
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Shipping status (desktop: left column with account) */}
          <section
            className="rounded-3xl border p-6 md:p-8"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                Trạng thái giao hàng
              </h2>
              <Link
                href="/checkout"
                className="text-sm font-bold transition hover:underline"
                style={{ color: "var(--stitch-color-primary)" }}
              >
                Mua thêm
              </Link>
            </div>

            <div className="relative mt-5">
              <div
                className="absolute left-6 right-6 top-5 h-[2px] sm:hidden"
                style={{
                  background:
                    "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 22%, transparent)",
                }}
                aria-hidden
              />

              <div className="flex items-center justify-between gap-2 sm:grid sm:grid-cols-5 sm:gap-3">
                {ORDER_STATUS_TABS.map((t) => {
                  const n = t.statuses.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);
                  const c = orderStatusTabColor(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className="relative min-w-0 rounded-2xl p-0 text-center transition active:scale-[0.99] sm:flex sm:h-full sm:flex-col sm:items-center sm:rounded-2xl sm:border sm:p-3"
                      style={{
                        background: "transparent",
                        borderColor:
                          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                      }}
                      aria-pressed={false}
                      aria-label={`Xem đơn hàng: ${t.label}`}
                      onClick={() => router.push(`/orders?tab=${encodeURIComponent(t.key)}`)}
                    >
                      <div className="sm:hidden">
                        <div
                          className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            background:
                              "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                            color: c.fg,
                            border:
                              "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                          }}
                          aria-hidden
                        >
                          <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                        </div>
                      </div>

                      <div className="hidden sm:flex sm:h-full sm:flex-col">
                        <div
                          className="relative mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            background:
                              "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)",
                            color: "var(--stitch-color-primary)",
                          }}
                        >
                          <span className="material-symbols-outlined text-[22px]" aria-hidden>
                            {t.icon}
                          </span>
                          {n > 0 ? (
                            <span
                              className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-black text-[var(--stitch-color-on-surface)]"
                              style={{ background: "var(--stitch-color-secondary)" }}
                              aria-label={`${n} đơn ${t.label}`}
                            >
                              {n > 99 ? "99+" : n}
                            </span>
                          ) : null}
                        </div>
                        <div
                          className="mt-auto text-[11px] font-black leading-tight"
                          style={{ color: "var(--stitch-color-on-surface)" }}
                        >
                          {t.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div id="order-detail" className="mt-5">
              {selectedOrderLoading ? (
                <div
                  className="rounded-2xl border p-4 text-sm"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                    color: "var(--stitch-color-on-surface-variant)",
                  }}
                >
                  Đang tải thông tin đơn hàng...
                </div>
              ) : selectedOrder ? (
                
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div
                        className="text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                      >
                        Đơn hàng bạn vừa xem
                      </div>
                      <div className="mt-1 truncate text-sm font-black text-[var(--stitch-color-on-surface)]">
                        {selectedOrder.orderId}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                        color: "var(--stitch-color-primary)",
                        border:
                          "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
                      }}
                      aria-label="Đóng"
                      title="Đóng"
                      onClick={() => {
                        router.replace("/account#recent-orders");
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden>
                        close
                      </span>
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      <span>Tạm tính</span>
                      <span className="tabular-nums text-[var(--stitch-color-on-surface)]">{formatVndDisplay(selectedOrder.subtotalVnd)} đ</span>
                    </div>
                    <div className="flex justify-between" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      <span>Vận chuyển</span>
                      <span className="tabular-nums text-[var(--stitch-color-on-surface)]">
                        {selectedOrder.shippingVnd === 0 ? "Miễn phí" : `${formatVndDisplay(selectedOrder.shippingVnd)} đ`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-black">
                      <span style={{ color: "var(--stitch-color-on-surface)" }}>Tổng cộng</span>
                      <span className="tabular-nums" style={{ color: "var(--stitch-color-primary)" }}>
                        {formatVndDisplay(selectedOrder.totalVnd)} đ
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border p-3 text-left"
                       style={{
                         borderColor:
                           "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                       }}>
                    <div className="text-xs font-black text-[var(--stitch-color-on-surface)]">{selectedOrder.customerName || "—"}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      {selectedOrder.phone ? `SĐT: ${selectedOrder.phone}` : null}
                      {selectedOrder.phone && selectedOrder.email ? " • " : null}
                      {selectedOrder.email ? `Email: ${selectedOrder.email}` : null}
                    </div>
                    <div className="mt-2 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Địa chỉ: <span className="text-[var(--stitch-color-on-surface)]">{selectedOrder.address || "—"}</span>
                    </div>
                  </div>
                </div>
              ) : selectedOrderId ? (
                <div
                  className="rounded-2xl border p-4 text-sm"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                    color: "var(--stitch-color-on-surface-variant)",
                  }}
                >
                  Không tìm thấy đơn hàng <span className="font-black text-[var(--stitch-color-on-surface)]">{selectedOrderId}</span>.
                </div>
              ) : null}
            </div>

            {/* Address (icon summary -> expand editor) */}
            <div
              className="mt-6 rounded-2xl border p-4"
              style={{
                background: "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--stitch-color-on-surface-variant)" }}
                  >
                    Địa chỉ giao hàng
                  </div>
                  <div className="mt-1 text-sm font-bold text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                    {shippingAddressDisplay || "Chưa thiết lập"}
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition active:scale-[0.99]"
                  style={{
                    background:
                      "color-mix(in srgb, var(--stitch-color-primary-container, var(--stitch-color-primary)) 20%, transparent)",
                    color: "var(--stitch-color-primary)",
                    border:
                      "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                  }}
                  aria-label={editingAddress ? "Close address editor" : "Edit shipping address"}
                  title={editingAddress ? "Đóng" : "Chỉnh sửa"}
                  onClick={() => {
                    setEditingAddress((v) => !v);
                    setAddressError(null);
                  }}
                >
                  <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
                    edit
                  </span>
                </button>
              </div>

              {editingAddress ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Tỉnh / Thành phố
                    </div>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-bold text-[var(--stitch-color-on-surface)] outline-none transition focus:ring-2 focus:ring-[var(--stitch-color-secondary)] disabled:opacity-60"
                        value={shippingAddress.provinceCode}
                        disabled={!vnAddressData}
                        onChange={(e) =>
                          setShippingAddress((a) => ({
                            ...a,
                            provinceCode: e.target.value,
                            districtCode: "",
                            wardCode: "",
                          }))
                        }
                        style={{
                          background:
                            "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                          border:
                            "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                        }}
                      >
                        <option value="">
                          {vnAddressData ? "Chọn Tỉnh / Thành phố" : "Đang tải danh sách Tỉnh / Thành phố..."}
                        </option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <span
                        className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px]"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                        aria-hidden
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Quận / Huyện
                    </div>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-bold text-[var(--stitch-color-on-surface)] outline-none transition focus:ring-2 focus:ring-[var(--stitch-color-secondary)] disabled:opacity-60"
                        value={shippingAddress.districtCode}
                        onChange={(e) =>
                          setShippingAddress((a) => ({ ...a, districtCode: e.target.value, wardCode: "" }))
                        }
                        disabled={!vnAddressData || !shippingAddress.provinceCode}
                        style={{
                          background:
                            "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                          border:
                            "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                        }}
                      >
                        <option value="">
                          {!vnAddressData
                            ? "Đang tải danh sách Quận / Huyện..."
                            : shippingAddress.provinceCode
                              ? "Chọn Quận / Huyện"
                              : "Chọn Tỉnh/TP trước"}
                        </option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <span
                        className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px]"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                        aria-hidden
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Phường / Xã
                    </div>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-bold text-[var(--stitch-color-on-surface)] outline-none transition focus:ring-2 focus:ring-[var(--stitch-color-secondary)] disabled:opacity-60"
                        value={shippingAddress.wardCode}
                        onChange={(e) => setShippingAddress((a) => ({ ...a, wardCode: e.target.value }))}
                        disabled={!vnAddressData || !shippingAddress.districtCode}
                        style={{
                          background:
                            "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                          border:
                            "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 18%, transparent)",
                        }}
                      >
                        <option value="">
                          {!vnAddressData
                            ? "Đang tải danh sách Phường / Xã..."
                            : shippingAddress.districtCode
                              ? "Chọn Phường / Xã"
                              : "Chọn Quận/Huyện trước"}
                        </option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <span
                        className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px]"
                        style={{ color: "var(--stitch-color-on-surface-variant)" }}
                        aria-hidden
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                      Số nhà + Tên đường
                    </div>
                    <input
                      className="w-full rounded-xl bg-transparent px-3 py-2 text-sm font-bold text-[var(--stitch-color-on-surface)] outline-none"
                      placeholder="VD: 12 Nguyễn Huệ"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress((a) => ({ ...a, street: e.target.value }))}
                      style={{
                        border:
                          "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 12%, transparent)",
                      }}
                    />
                  </div>

                  {addressError ? (
                    <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "color-mix(in srgb, var(--stitch-color-error) 35%, transparent)", color: "var(--stitch-color-on-surface)" }}>
                      {addressError}
                    </div>
                  ) : null}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold text-[var(--stitch-color-on-surface)] transition active:scale-[0.99] disabled:opacity-60"
                      style={{
                        background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
                        color: "var(--stitch-color-on-primary)",
                      }}
                      disabled={savingAddress}
                      onClick={async () => {
                        setSavingAddress(true);
                        setAddressError(null);
                        try {
                          if (!shippingAddress.provinceCode || !shippingAddress.districtCode || !shippingAddress.wardCode || !shippingAddress.street.trim()) {
                            throw new Error("Vui lòng chọn đủ Tỉnh/TP, Quận/Huyện, Phường/Xã và nhập số nhà + tên đường.");
                          }
                          const { error } = await supabase.auth.updateUser({
                            data: {
                              shipping_address: {
                                province_code: shippingAddress.provinceCode,
                                province: selectedProvince?.name ?? "",
                                district_code: shippingAddress.districtCode,
                                district: selectedDistrict?.name ?? "",
                                ward_code: shippingAddress.wardCode,
                                ward: selectedWard?.name ?? "",
                                street: shippingAddress.street.trim(),
                              },
                            },
                          });
                          if (error) throw error;
                          setEditingAddress(false);
                        } catch (e) {
                          setAddressError(e instanceof Error ? e.message : "Không thể lưu địa chỉ.");
                        } finally {
                          setSavingAddress(false);
                        }
                      }}
                    >
                      Lưu địa chỉ
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold transition active:scale-[0.99]"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-highest, var(--stitch-color-surface-container))",
                        color: "var(--stitch-color-on-surface-variant)",
                        border:
                          "1px solid color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 20%, transparent)",
                      }}
                      onClick={() => {
                        setEditingAddress(false);
                        setAddressError(null);
                      }}
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Desktop-only: Vouchers */}
          <section
            className="hidden rounded-3xl border p-6 md:p-8 lg:block"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                Voucher / Ưu đãi của bạn
              </h2>
              <button
                type="button"
                className="text-sm font-bold opacity-60"
                style={{ color: "var(--stitch-color-primary)" }}
                disabled
                aria-disabled="true"
                title="Sắp ra mắt"
              >
                Xem tất cả
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {vouchers.slice(0, 3).map((v) => (
                <div
                  key={v.code}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-2"
                  style={{
                    background:
                      "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                    borderColor:
                      "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                  }}
                >
                  <span
                    className="text-[11px] font-black tracking-wider"
                    style={{ color: "var(--stitch-color-primary)", fontFamily: "var(--stitch-font-headline)" }}
                  >
                    {v.code}
                  </span>
                  <span className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                    {v.desc}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Desktop-only: Loyalty */}
          <section
            className="hidden rounded-3xl border p-6 md:p-8 lg:block"
            style={{
              background: "var(--stitch-color-surface-container)",
              borderColor:
                "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
                Điểm tích luỹ / Hạng thành viên
              </h2>
              <div className="text-xs font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                {loyaltyPoints} điểm
              </div>
            </div>

            <div
              className="mt-4 h-3 overflow-hidden rounded-full border"
              style={{
                background: "var(--stitch-color-surface-container-low)",
                borderColor:
                  "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={loyaltyTierTarget}
              aria-valuenow={loyaltyPoints}
              aria-label="Loyalty progress"
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(loyaltyProgress * 100)}%`,
                  background: `linear-gradient(90deg, var(--stitch-color-primary) 0%, var(--stitch-color-secondary) 100%)`,
                }}
              />
            </div>

            <div className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Còn <span className="font-black text-[var(--stitch-color-on-surface)]">{loyaltyRemaining}</span> điểm lên hạng.
            </div>
          </section>
        </div>

        {/* Section 3: Purchased / Suggested + Recent orders (desktop: right column) */}
        <section
          className="rounded-3xl border p-6 md:p-8 lg:col-span-7"
          style={{
            background: "var(--stitch-color-surface-container)",
            borderColor:
              "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
          }}
        >
          <div>
            <h3 className="text-lg font-bold text-[var(--stitch-color-on-surface)]" style={{ fontFamily: "var(--stitch-font-headline)" }}>
              Sản phẩm đã mua
            </h3>

            {loading ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải...
              </p>
            ) : purchases.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  Bạn chưa mua sản phẩm nào. Gợi ý cho bạn:
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {suggested.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${encodeURIComponent(p.id)}`}
                      className="overflow-hidden rounded-2xl border transition hover:opacity-95 active:scale-[0.99]"
                      style={{
                        background:
                          "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                        borderColor:
                          "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                      }}
                    >
                      <div className="aspect-square w-full" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.img} alt={p.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="line-clamp-1 text-sm font-bold text-[var(--stitch-color-on-surface)]">{p.title}</div>
                        <div className="mt-1 text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                          {p.price} <span className="text-[10px] font-normal">đ</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {purchases.slice(0, 8).map((x) => (
                  <Link
                    key={x.sku}
                    href={`/product/${encodeURIComponent(x.sku)}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border p-4 transition hover:opacity-95 active:scale-[0.99]"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl" style={{ background: "var(--stitch-color-surface-container-low)" }}>
                        {x.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={x.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-black text-[var(--stitch-color-on-surface)]">{x.title}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                          Mua gần nhất: {new Date(x.last_purchased_at).toLocaleDateString()} • SL: {x.total_qty}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                        {formatVndDisplay(Number(x.unit_price) || 0)} đ
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                        Order {x.last_order_code}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3
              id="recent-orders"
              className="text-lg font-bold text-[var(--stitch-color-on-surface)]"
              style={{ fontFamily: "var(--stitch-font-headline)" }}
            >
              Đơn hàng gần đây
            </h3>
            {loading ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Đang tải...
              </p>
            ) : filteredOrders.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                Chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredOrders.slice(0, 6).map((o) => (
                  <Link
                    key={o.order_code}
                    href={`/orders/${encodeURIComponent(o.order_code)}`}
                    className="block rounded-2xl border p-4 transition hover:opacity-95 active:scale-[0.99]"
                    style={{
                      background:
                        "var(--stitch-color-surface-container-high, var(--stitch-color-surface-container))",
                      borderColor:
                        "color-mix(in srgb, var(--stitch-color-outline-variant, var(--stitch-color-outline)) 10%, transparent)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[var(--stitch-color-on-surface)]">{o.order_code}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black" style={{ color: "var(--stitch-color-primary)" }}>
                          {formatVndDisplay(Number(o.total) || 0)} đ
                        </div>
                        <div className="mt-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                          {orderRowStatusLabel(String(o.status))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

