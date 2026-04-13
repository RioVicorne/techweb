import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_LIMIT = 300;

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get("limit") || 120);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 120));

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        description,
        brand,
        status,
        created_at,
        product_variants (
          id,
          sku,
          name,
          price,
          compare_at_price,
          is_active,
          attributes
        ),
        product_images (
          id,
          url,
          alt,
          sort_order
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const products = (data ?? []).map((raw) => {
      const p = raw as unknown as {
        id: number;
        slug: string;
        name: string;
        description: string | null;
        brand: string | null;
        status: string | null;
        created_at: string;
        product_variants:
          | {
              id: number;
              sku: string;
              name: string | null;
              price: number;
              compare_at_price: number | null;
              is_active: boolean | null;
              attributes: Record<string, unknown> | null;
            }[]
          | null;
        product_images:
          | {
              id: number;
              url: string | null;
              alt: string | null;
              sort_order: number | null;
            }[]
          | null;
      };

      const variants = (p.product_variants ?? []).map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        compareAtPrice: v.compare_at_price,
        isActive: v.is_active ?? true,
        attributes: v.attributes,
      }));

      const images = (p.product_images ?? [])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        }));

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        brand: p.brand,
        status: p.status,
        createdAt: p.created_at,
        variants,
        images,
      };
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      brand,
      status,
      variants,
    }: {
      name: string;
      slug: string;
      description?: string;
      brand?: string;
      status?: string;
      variants?: Array<{
        sku: string;
        name?: string;
        price: number;
        compareAtPrice?: number;
        isActive?: boolean;
        attributes?: Record<string, unknown>;
      }>;
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description: description ?? null,
        brand: brand ?? null,
        status: status ?? "draft",
      })
      .select()
      .single();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    const productId = (product as { id: number }).id;

    if (variants && variants.length > 0) {
      const variantRows = variants.map((v) => ({
        product_id: productId,
        sku: v.sku,
        name: v.name ?? null,
        price: v.price,
        compare_at_price: v.compareAtPrice ?? null,
        is_active: v.isActive ?? true,
        attributes: v.attributes ?? null,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantRows);

      if (variantError) {
        return NextResponse.json({ error: variantError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ product: { id: productId, name, slug } }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const {
      id,
      name,
      slug,
      description,
      brand,
      status,
    }: {
      id: number;
      name?: string;
      slug?: string;
      description?: string | null;
      brand?: string | null;
      status?: string;
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (brand !== undefined) updateData.brand = brand;
    if (status !== undefined) updateData.status = status;

    const supabase = getSupabaseAdmin();

    const { data: product, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (!id || !Number.isFinite(id)) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
