import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatVndDisplay } from "@/data/products";

export type CatalogProduct = {
  id: string; // slug (stable for routes/cart)
  title: string;
  price: string; // formatted display e.g. 1.450.000
  reviews: string;
  stars: number;
  img: string;
  badge?: string;
  tag?: string;
};

export type CatalogCategory = {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
  heroHeadline: string | null;
  heroSub: string | null;
  heroGradient: string | null;
};

const FALLBACK_IMAGE = "https://placehold.co/800x800/png?text=RioShop";

type DbProductRow = {
  slug: string;
  name: string;
  default_variant_id: number | null;
  product_variants: { id: number; price: number | null }[] | null;
  product_images: { url: string | null; sort_order: number | null }[] | null;
};

function pickImage(images: DbProductRow["product_images"]): string {
  const best =
    (images ?? [])
      .filter((i) => typeof i?.url === "string" && i.url)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? "";
  return best || FALLBACK_IMAGE;
}

function pickPriceVnd(p: DbProductRow): number {
  const variants = p.product_variants ?? [];
  if (variants.length === 0) return 0;
  const byDefault =
    p.default_variant_id != null ? variants.find((v) => v.id === p.default_variant_id) : undefined;
  const candidate = byDefault ?? variants[0];
  const n = Number(candidate?.price ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function mapToUiProduct(p: DbProductRow): CatalogProduct {
  const priceVnd = pickPriceVnd(p);
  return {
    id: p.slug,
    title: p.name,
    price: formatVndDisplay(priceVnd),
    // UI currently expects these fields; keep deterministic placeholders for now.
    reviews: "(0)",
    stars: 5,
    img: pickImage(p.product_images),
  };
}

type DbCategoryRow = {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  hero_headline: string | null;
  hero_sub: string | null;
  hero_gradient: string | null;
};

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("slug,name,default_variant_id,product_variants(id,price),product_images(url,sort_order)")
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as DbProductRow[];
  return rows
    .filter((r) => typeof r.slug === "string" && r.slug)
    .map(mapToUiProduct);
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name,parent_id,is_active,sort_order,hero_headline,hero_sub,hero_gradient")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as DbCategoryRow[];
  return rows
    .filter((r) => typeof r.slug === "string" && r.slug && typeof r.name === "string" && r.name)
    .map((r) => ({
      id: Number(r.id),
      slug: r.slug,
      name: r.name,
      parentId: r.parent_id ?? null,
      heroHeadline: r.hero_headline ?? null,
      heroSub: r.hero_sub ?? null,
      heroGradient: r.hero_gradient ?? null,
    }));
}

export async function getCatalogProductsByCategorySlug(
  categorySlug: string,
): Promise<CatalogProduct[]> {
  const s = categorySlug.trim().toLowerCase();
  if (!s) return getCatalogProducts();

  const supabase = getSupabaseAdmin();
  // Fetch products where product_categories.category_id belongs to the category with slug = s
  // This relies on FK relations present in Supabase (PostgREST).
  const { data, error } = await supabase
    .from("products")
    .select(
      "slug,name,default_variant_id,product_variants(id,price),product_images(url,sort_order),product_categories!inner(category_id,categories!inner(slug))",
    )
    .eq("product_categories.categories.slug", s)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as DbProductRow[];
  return rows
    .filter((r) => typeof r.slug === "string" && r.slug)
    .map(mapToUiProduct);
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const s = slug.trim();
  if (!s) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("slug,name,default_variant_id,product_variants(id,price),product_images(url,sort_order)")
    .eq("slug", s)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapToUiProduct(data as unknown as DbProductRow);
}

