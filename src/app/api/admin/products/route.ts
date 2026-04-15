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
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 120),
    );

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
        ),
        product_categories (
          category_id,
          categories (
            id,
            name,
            slug
          )
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

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
        product_categories:
          | {
              category_id: number;
              categories: {
                id: number;
                name: string;
                slug: string;
              } | null;
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

      const categories = (p.product_categories ?? [])
        .map((pc) => pc.categories)
        .filter(
          (category): category is { id: number; name: string; slug: string } =>
            Boolean(category?.id && category.name && category.slug),
        );

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
        categories,
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
      sku,
      price,
      compareAtPrice,
      attributes,
      imageUrls,
      categoryId,
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
      sku?: string;
      price?: number;
      compareAtPrice?: number;
      attributes?: Record<string, unknown>;
      imageUrls?: string[];
      categoryId?: number | null;
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: productError.message },
        { status: 500 },
      );
    }

    const productId = (product as { id: number }).id;

    const normalizedVariants: Array<{
      sku: string;
      name?: string;
      price: number;
      compareAtPrice?: number;
      isActive?: boolean;
      attributes?: Record<string, unknown>;
    }> =
      variants && variants.length > 0
        ? variants
        : sku && typeof price === "number" && Number.isFinite(price)
          ? [
              {
                sku,
                name: undefined,
                price,
                compareAtPrice,
                attributes,
                isActive: true,
              },
            ]
          : [];

    if (normalizedVariants.length > 0) {
      const variantRows = normalizedVariants.map((v) => ({
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
        return NextResponse.json(
          { error: variantError.message },
          { status: 500 },
        );
      }
    }

    const cleanedImageUrls = (imageUrls ?? [])
      .map((url) => String(url ?? "").trim())
      .filter(Boolean)
      .slice(0, 5);

    if (cleanedImageUrls.length > 0) {
      const imageRows = cleanedImageUrls.map((url, index) => ({
        product_id: productId,
        url,
        alt: name,
        sort_order: index,
      }));

      const { error: imageError } = await supabase
        .from("product_images")
        .insert(imageRows);

      if (imageError) {
        return NextResponse.json(
          { error: imageError.message },
          { status: 500 },
        );
      }
    }

    if (typeof categoryId === "number" && Number.isFinite(categoryId) && categoryId > 0) {
      const { error: categoryError } = await supabase
        .from("product_categories")
        .insert({
          product_id: productId,
          category_id: categoryId,
        });

      if (categoryError) {
        return NextResponse.json(
          { error: categoryError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { product: { id: productId, name, slug } },
      { status: 201 },
    );
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
      variantId,
      name,
      slug,
      description,
      brand,
      status,
      sku,
      price,
      compareAtPrice,
      attributes,
      imageUrls,
      categoryId,
    }: {
      id: number;
      variantId?: number;
      name?: string;
      slug?: string;
      description?: string | null;
      brand?: string | null;
      status?: string;
      sku?: string;
      price?: number;
      compareAtPrice?: number;
      attributes?: Record<string, unknown>;
      imageUrls?: string[];
      categoryId?: number | null;
    } = body;

    if (!id || !Number.isFinite(id)) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (brand !== undefined) updateData.brand = brand;
    if (status !== undefined) updateData.status = status;

    const supabase = getSupabaseAdmin();

    let product: Record<string, unknown> = { id };

    if (Object.keys(updateData).length > 0) {
      const { data: updatedProduct, error: productError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (productError) {
        return NextResponse.json({ error: productError.message }, { status: 500 });
      }

      product = (updatedProduct as Record<string, unknown>) ?? { id };
    }

    const variantUpdates: Record<string, unknown> = {};
    if (sku !== undefined && sku.trim() !== "") variantUpdates.sku = sku.trim();
    if (price !== undefined && Number.isFinite(price) && price >= 0)
      variantUpdates.price = price;
    if (
      compareAtPrice !== undefined &&
      Number.isFinite(compareAtPrice) &&
      compareAtPrice >= 0
    ) {
      variantUpdates.compare_at_price = compareAtPrice;
    }
    if (attributes !== undefined) variantUpdates.attributes = attributes;

    if (Object.keys(variantUpdates).length > 0) {
      if (typeof variantId === "number" && Number.isFinite(variantId) && variantId > 0) {
        const { error: variantUpdateErr } = await supabase
          .from("product_variants")
          .update(variantUpdates)
          .eq("id", variantId)
          .eq("product_id", id);

        if (variantUpdateErr) {
          return NextResponse.json(
            { error: variantUpdateErr.message },
            { status: 500 },
          );
        }
      } else {
        const { data: firstVariant, error: firstVariantErr } = await supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", id)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstVariantErr) {
          return NextResponse.json(
            { error: firstVariantErr.message },
            { status: 500 },
          );
        }

        if (firstVariant?.id) {
          const { error: variantUpdateErr } = await supabase
            .from("product_variants")
            .update(variantUpdates)
            .eq("id", firstVariant.id);

          if (variantUpdateErr) {
            return NextResponse.json(
              { error: variantUpdateErr.message },
              { status: 500 },
            );
          }
        }
      }
    }

    const relationMutations: Array<Promise<{ error: string | null }>> = [];

    if (imageUrls !== undefined) {
      relationMutations.push(
        (async () => {
          const cleanedImageUrls = (imageUrls ?? [])
            .map((url) => String(url ?? "").trim())
            .filter(Boolean)
            .slice(0, 5);

          const { error: deleteImageErr } = await supabase
            .from("product_images")
            .delete()
            .eq("product_id", id);

          if (deleteImageErr) {
            return { error: deleteImageErr.message };
          }

          if (cleanedImageUrls.length > 0) {
            const imageRows = cleanedImageUrls.map((url, index) => ({
              product_id: id,
              url,
              alt: name ?? null,
              sort_order: index,
            }));

            const { error: imageInsertErr } = await supabase
              .from("product_images")
              .insert(imageRows);

            if (imageInsertErr) {
              return { error: imageInsertErr.message };
            }
          }

          return { error: null };
        })(),
      );
    }

    if (categoryId !== undefined) {
      relationMutations.push(
        (async () => {
          const { error: deleteCategoryErr } = await supabase
            .from("product_categories")
            .delete()
            .eq("product_id", id);

          if (deleteCategoryErr) {
            return { error: deleteCategoryErr.message };
          }

          if (typeof categoryId === "number" && Number.isFinite(categoryId) && categoryId > 0) {
            const { error: categoryInsertErr } = await supabase
              .from("product_categories")
              .insert({
                product_id: id,
                category_id: categoryId,
              });

            if (categoryInsertErr) {
              return { error: categoryInsertErr.message };
            }
          }

          return { error: null };
        })(),
      );
    }

    if (relationMutations.length > 0) {
      const relationResults = await Promise.all(relationMutations);
      const failedRelation = relationResults.find((result) => result.error);

      if (failedRelation?.error) {
        return NextResponse.json({ error: failedRelation.error }, { status: 500 });
      }
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
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
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
