"use client";

import { useEffect, useState } from "react";

type ProductVariant = {
  id: number;
  sku: string;
  name: string | null;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  attributes: Record<string, unknown> | null;
};

type ProductImage = {
  id: number;
  url: string | null;
  alt: string | null;
};

type ProductCategory = {
  id: number;
  name: string;
  slug: string;
};

type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  brand: string | null;
  status: string | null;
  createdAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
  categories?: ProductCategory[];
};

type FormState = {
  id?: number;
  name: string;
  slug: string;
  description: string;
  brand: string;
  status: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  specsText: string;
};

const defaultForm: FormState = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  status: "draft",
  sku: "",
  price: "",
  compareAtPrice: "",
  specsText: "",
};

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSpecsTextToAttributes(specsText: string): Record<string, string> | null {
  const lines = specsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const entries = lines
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) return null;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key || !value) return null;
      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  if (entries.length === 0) return null;

  return Object.fromEntries(entries);
}

export function ProductsAdminClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", { credentials: "include" });
      if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm");
      const json = await res.json();
      setProducts(json.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchProducts();
  }, []);

  function openAdd() {
    setForm(defaultForm);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    const firstVariant = p.variants[0];
    const specsText =
      firstVariant?.attributes && typeof firstVariant.attributes === "object"
        ? Object.entries(firstVariant.attributes)
            .map(([key, value]) => `${key}: ${String(value ?? "")}`)
            .join("\n")
        : "";

    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      brand: p.brand ?? "",
      status: p.status ?? "draft",
      sku: firstVariant?.sku ?? "",
      price: firstVariant?.price != null ? String(firstVariant.price) : "",
      compareAtPrice: firstVariant?.compareAtPrice != null ? String(firstVariant.compareAtPrice) : "",
      specsText,
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = form.id ? "/api/admin/products" : "/api/admin/products";
      const method = form.id ? "PATCH" : "POST";
      const parsedPrice = Number(form.price);
      const parsedCompareAtPrice = Number(form.compareAtPrice);
      const parsedAttributes = parseSpecsTextToAttributes(form.specsText);

      if (!form.id && (!form.sku.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0)) {
        throw new Error("Vui lòng nhập SKU và giá hợp lệ để tạo sản phẩm mới");
      }

      const body: Record<string, unknown> = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        brand: form.brand || null,
        status: form.status,
      };

      if (form.sku.trim()) {
        body.sku = form.sku.trim();
      }

      if (Number.isFinite(parsedPrice) && parsedPrice >= 0) {
        body.price = parsedPrice;
      }

      if (form.compareAtPrice.trim() !== "") {
        if (!Number.isFinite(parsedCompareAtPrice) || parsedCompareAtPrice < 0) {
          throw new Error("Giá gốc không hợp lệ");
        }
        body.compareAtPrice = parsedCompareAtPrice;
      }

      if (parsedAttributes) {
        body.attributes = parsedAttributes;
      }
      if (form.id) body.id = form.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Có lỗi xảy ra");
      }

      setFormOpen(false);
      setForm(defaultForm);
      await fetchProducts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Không thể xóa sản phẩm");
      }
      await fetchProducts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setDeleteId(null);
    }
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || slugify(value),
    }));
  }

  const statusLabel = (s: string | null) => {
    switch (s) {
      case "active":
        return "Đang bán";
      case "draft":
        return "Nháp";
      case "archived":
        return "Đã ẩn";
      default:
        return s ?? "—";
    }
  };

  const statusColor = (s: string | null) => {
    switch (s) {
      case "active":
        return "var(--stitch-color-primary, #22c55e)";
      case "draft":
        return "var(--stitch-color-warning, #f59e0b)";
      case "archived":
        return "var(--stitch-color-on-surface-variant, #9ca3af)";
      default:
        return "var(--stitch-color-on-surface-variant, #9ca3af)";
    }
  };

  const groupedProducts = products.reduce<Record<string, Product[]>>((acc, product) => {
    const categoryNames = (product.categories ?? [])
      .map((category) => category.name.trim())
      .filter(Boolean);

    if (categoryNames.length === 0) {
      if (!acc["Chưa phân loại"]) acc["Chưa phân loại"] = [];
      acc["Chưa phân loại"].push(product);
      return acc;
    }

    categoryNames.forEach((categoryName) => {
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
    });

    return acc;
  }, {});

  const categorySections = Object.entries(groupedProducts).sort(([nameA], [nameB]) => {
    if (nameA === "Chưa phân loại") return 1;
    if (nameB === "Chưa phân loại") return -1;
    return nameA.localeCompare(nameB, "vi");
  });

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đang tải sản phẩm...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--stitch-color-on-surface)" }}
          >
            Quản lý sản phẩm
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            Tổng cộng {products.length} sản phẩm
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "var(--stitch-color-primary, #6366f1)" }}
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm sản phẩm
        </button>
      </div>

      {error && (
        <div
          className="mb-4 rounded-xl border p-4 text-sm"
          style={{
            borderColor: "var(--stitch-color-error, #f87171)",
            color: "var(--stitch-color-error, #f87171)",
            background: "color-mix(in srgb, var(--stitch-color-error) 8%, transparent)",
          }}
        >
          {error}
        </div>
      )}

      {/* Product Sections by Category */}
      {categorySections.length === 0 ? (
        <div
          className="rounded-2xl border px-5 py-12 text-center text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 35%, transparent)",
            color: "var(--stitch-color-on-surface-variant)",
          }}
        >
          Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu.
        </div>
      ) : (
        <div className="space-y-6">
          {categorySections.map(([categoryName, categoryProducts]) => (
            <section
              key={categoryName}
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 35%, transparent)" }}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-3"
                style={{
                  borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 25%, transparent)",
                  background: "var(--stitch-color-surface-container-low)",
                }}
              >
                <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--stitch-color-on-surface)" }}>
                  {categoryName}
                </h2>
                <span className="text-xs font-bold" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                  {categoryProducts.length} sản phẩm
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr
                      style={{
                        background: "var(--stitch-color-surface-container-low)",
                        color: "var(--stitch-color-on-surface-variant)",
                      }}
                    >
                      <th className="px-5 py-3 font-bold">Sản phẩm</th>
                      <th className="px-5 py-3 font-bold">SKU</th>
                      <th className="px-5 py-3 font-bold">Giá</th>
                      <th className="px-5 py-3 font-bold">Trạng thái</th>
                      <th className="px-5 py-3 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryProducts.map((p) => (
                      <tr
                        key={`${categoryName}-${p.id}`}
                        className="border-t transition hover:opacity-80"
                        style={{ borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 20%, transparent)" }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {p.images.length > 0 && p.images[0].url ? (
                              <img
                                src={p.images[0].url}
                                alt={p.images[0].alt ?? p.name}
                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                                style={{
                                  background: "var(--stitch-color-surface-container-high)",
                                  color: "var(--stitch-color-on-surface-variant)",
                                }}
                              >
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold" style={{ color: "var(--stitch-color-on-surface)" }}>
                                {p.name}
                              </p>
                              <p className="text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                                {p.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-md px-2 py-1 text-xs font-mono"
                            style={{
                              background: "var(--stitch-color-surface-container)",
                              color: "var(--stitch-color-on-surface-variant)",
                            }}
                          >
                            {p.variants.length > 0 ? p.variants[0].sku : "—"}
                          </span>
                          {p.variants.length > 1 && (
                            <span className="ml-1 text-xs" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                              +{p.variants.length - 1}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {p.variants.length > 0 ? (
                            <span className="font-semibold" style={{ color: "var(--stitch-color-on-surface)" }}>
                              {formatVnd(p.variants[0].price)}đ
                            </span>
                          ) : (
                            <span style={{ color: "var(--stitch-color-on-surface-variant)" }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                            style={{
                              background: `${statusColor(p.status)}15`,
                              color: statusColor(p.status),
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: statusColor(p.status) }}
                            />
                            {statusLabel(p.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(p)}
                              className="rounded-lg p-2 text-xs font-bold transition hover:opacity-80"
                              style={{
                                color: "var(--stitch-color-primary)",
                              }}
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="rounded-lg p-2 text-xs font-bold transition hover:opacity-80"
                              style={{ color: "var(--stitch-color-error, #f87171)" }}
                              title="Xóa"
                              disabled={deleteId === p.id}
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setFormOpen(false)}
          />
          <div
            className="relative w-full max-w-xl rounded-2xl p-6"
            style={{
              background: "var(--stitch-color-surface)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
                {form.id ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1 transition hover:opacity-70"
                style={{ color: "var(--stitch-color-on-surface-variant)" }}
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                  placeholder="VD: Áo thun nam cơ bản"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                  placeholder="VD: ao-thun-nam-co-ban"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Thương hiệu
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                  placeholder="VD: Uniqlo"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                  placeholder="Mô tả ngắn về sản phẩm..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1 block text-xs font-bold"
                    style={{ color: "var(--stitch-color-on-surface-variant)" }}
                  >
                    SKU {form.id ? "" : "*"}
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                      background: "var(--stitch-color-surface-container-low)",
                      color: "var(--stitch-color-on-surface)",
                    }}
                    placeholder="VD: AO-THUN-001"
                    required={!form.id}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-bold"
                    style={{ color: "var(--stitch-color-on-surface-variant)" }}
                  >
                    Giá bán (VND) {form.id ? "" : "*"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                      background: "var(--stitch-color-surface-container-low)",
                      color: "var(--stitch-color-on-surface)",
                    }}
                    placeholder="VD: 299000"
                    required={!form.id}
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Giá gốc (VND)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.compareAtPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                  placeholder="VD: 399000"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Thông số kỹ thuật (mỗi dòng: Tên: Giá trị)
                </label>
                <textarea
                  rows={4}
                  value={form.specsText}
                  onChange={(e) => setForm((prev) => ({ ...prev, specsText: e.target.value }))}
                  className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                  placeholder={"Màu sắc: Đen\nKích cỡ: M, L, XL\nChất liệu: Cotton 100%"}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-bold"
                  style={{ color: "var(--stitch-color-on-surface-variant)" }}
                >
                  Trạng thái
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    background: "var(--stitch-color-surface-container-low)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                >
                  <option value="draft">Nháp</option>
                  <option value="active">Đang bán</option>
                  <option value="archived">Đã ẩn</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:opacity-80"
                  style={{
                    borderColor: "color-mix(in srgb, var(--stitch-color-outline-variant) 50%, transparent)",
                    color: "var(--stitch-color-on-surface)",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.name.trim()}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50"
                  style={{ background: "var(--stitch-color-primary, #6366f1)" }}
                >
                  {submitting ? "Đang lưu..." : form.id ? "Cập nhật" : "Thêm sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
