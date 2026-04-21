import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatVndDisplay } from "@/data/products";
import type { CatalogProduct } from "@/lib/catalog";

type DbProductRow = {
  id: number;
  slug: string;
  name: string;
  default_variant_id: number | null;
  product_variants: { id: number; price: number | null }[] | null;
  product_images: { url: string | null; sort_order: number | null }[] | null;
  product_categories: { category_id: number }[] | null;
};

const FALLBACK_IMAGE = "https://placehold.co/800x800/png?text=RioShop";

function isRenderableImageSource(value: string | null | undefined): value is string {
  const src = value?.trim();
  if (!src) return false;
  if (src.startsWith("data:image/")) return true;

  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function pickImage(images: DbProductRow["product_images"]): string {
  const best =
    (images ?? [])
      .filter((image) => isRenderableImageSource(image?.url))
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
    reviews: "(0)",
    stars: 5,
    img: pickImage(p.product_images),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const supabase = getSupabaseAdmin();

    // First, get the current product's categories
    const { data: currentProduct } = await supabase
      .from("products")
      .select("id, product_categories(category_id)")
      .eq("slug", slug)
      .maybeSingle();

    if (!currentProduct) {
      return NextResponse.json({ products: [] });
    }

    const categoryIds =
      (currentProduct.product_categories ?? []).map((c) => c.category_id) ?? [];

    if (categoryIds.length === 0) {
      // No categories, return random products
      const { data } = await supabase
        .from("products")
        .select("id,slug,name,default_variant_id,product_variants(id,price),product_images(url,sort_order)")
        .neq("slug", slug)
        .limit(4);

      const rows = (data ?? []) as unknown as DbProductRow[];
      return NextResponse.json({ products: rows.map(mapToUiProduct) });
    }

    // Find products in the same categories
    const { data } = await supabase
      .from("products")
      .select(
        "id,slug,name,default_variant_id,product_variants(id,price),product_images(url,sort_order),product_categories!inner(category_id)",
      )
      .neq("slug", slug)
      .in("product_categories.category_id", categoryIds)
      .limit(8);

    const rows = (data ?? []) as unknown as DbProductRow[];
    // Deduplicate by slug (a product might be in multiple of the same categories)
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      if (seen.has(r.slug)) return false;
      seen.add(r.slug);
      return true;
    });

    return NextResponse.json({ products: unique.slice(0, 4).map(mapToUiProduct) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
