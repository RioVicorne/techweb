import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_LIMIT = 300;

function isLikelyDirectImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const pathname = url.pathname.toLowerCase();
    if (/\.(html?|php|aspx?)$/.test(pathname)) return false;

    const extensionMatch = pathname.match(/\.([a-z0-9]+)$/i);
    if (extensionMatch) {
      return /^(png|jpe?g|webp|avif|gif|svg|bmp|jfif|heic|heif)$/i.test(
        extensionMatch[1] ?? "",
      );
    }

    const formatHint =
      url.searchParams.get("format") ??
      url.searchParams.get("fm") ??
      url.searchParams.get("ext") ??
      "";

    if (formatHint) {
      return /^(png|jpe?g|webp|avif|gif|svg|bmp|jfif|heic|heif)$/i.test(
        formatHint,
      );
    }

    return false;
  } catch {
    return false;
  }
}

type CreateProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
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
};

type BulkImportMode = "create" | "skip" | "upsert";

type BulkUpsertResult = {
  status: "created" | "updated";
  product: { id: number; name: string; slug: string };
};

async function createProductWithRelations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  payload: CreateProductInput,
): Promise<{ id: number; name: string; slug: string }> {
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
  } = payload;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

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
    throw new Error(productError.message);
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
    const variantRows = normalizedVariants.map((variant) => ({
      product_id: productId,
      sku: variant.sku,
      name: variant.name ?? null,
      price: variant.price,
      compare_at_price: variant.compareAtPrice ?? null,
      is_active: variant.isActive ?? true,
      attributes: variant.attributes ?? null,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantRows);

    if (variantError) {
      throw new Error(variantError.message);
    }
  }

  const cleanedImageUrls = (imageUrls ?? [])
    .map((url) => String(url ?? "").trim())
    .filter(Boolean)
    .slice(0, 5);

  const invalidImageUrl = cleanedImageUrls.find((url) => !isLikelyDirectImageUrl(url));
  if (invalidImageUrl) {
    throw new Error(`URL ảnh không hợp lệ hoặc không phải ảnh trực tiếp: ${invalidImageUrl}`);
  }

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
      throw new Error(imageError.message);
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
      throw new Error(categoryError.message);
    }
  }

  return {
    id: productId,
    name,
    slug,
  };
}

function normalizeBulkImportMode(value: unknown): BulkImportMode {
  if (value === "skip" || value === "upsert") {
    return value;
  }

  return "create";
}

async function findProductBySlug(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  slug: string,
): Promise<{ id: number; name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
  };
}

async function updateProductWithRelations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  productId: number,
  payload: CreateProductInput,
): Promise<{ id: number; name: string; slug: string }> {
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
  } = payload;

  if (!name || !slug) {
    throw new Error("Name and slug are required");
  }

  const { error: productUpdateError } = await supabase
    .from("products")
    .update({
      name,
      slug,
      description: description ?? null,
      brand: brand ?? null,
      status: status ?? "draft",
    })
    .eq("id", productId);

  if (productUpdateError) {
    throw new Error(productUpdateError.message);
  }

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
    const primaryVariant = normalizedVariants[0];

    const { data: existingVariant, error: existingVariantError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingVariantError) {
      throw new Error(existingVariantError.message);
    }

    const variantRow = {
      sku: primaryVariant.sku,
      name: primaryVariant.name ?? null,
      price: primaryVariant.price,
      compare_at_price: primaryVariant.compareAtPrice ?? null,
      is_active: primaryVariant.isActive ?? true,
      attributes: primaryVariant.attributes ?? null,
    };

    if (existingVariant?.id) {
      const { error: variantUpdateError } = await supabase
        .from("product_variants")
        .update(variantRow)
        .eq("id", existingVariant.id)
        .eq("product_id", productId);

      if (variantUpdateError) {
        throw new Error(variantUpdateError.message);
      }
    } else {
      const { error: variantInsertError } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          ...variantRow,
        });

      if (variantInsertError) {
        throw new Error(variantInsertError.message);
      }
    }
  }

  const cleanedImageUrls = (imageUrls ?? [])
    .map((url) => String(url ?? "").trim())
    .filter(Boolean)
    .slice(0, 5);

  const invalidImageUrl = cleanedImageUrls.find((url) => !isLikelyDirectImageUrl(url));
  if (invalidImageUrl) {
    throw new Error(`URL ảnh không hợp lệ hoặc không phải ảnh trực tiếp: ${invalidImageUrl}`);
  }

  const { error: deleteImageError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (deleteImageError) {
    throw new Error(deleteImageError.message);
  }

  if (cleanedImageUrls.length > 0) {
    const imageRows = cleanedImageUrls.map((url, index) => ({
      product_id: productId,
      url,
      alt: name,
      sort_order: index,
    }));

    const { error: insertImageError } = await supabase
      .from("product_images")
      .insert(imageRows);

    if (insertImageError) {
      throw new Error(insertImageError.message);
    }
  }

  const { error: deleteCategoryError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", productId);

  if (deleteCategoryError) {
    throw new Error(deleteCategoryError.message);
  }

  if (typeof categoryId === "number" && Number.isFinite(categoryId) && categoryId > 0) {
    const { error: insertCategoryError } = await supabase
      .from("product_categories")
      .insert({
        product_id: productId,
        category_id: categoryId,
      });

    if (insertCategoryError) {
      throw new Error(insertCategoryError.message);
    }
  }

  return {
    id: productId,
    name,
    slug,
  };
}

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
    const body = (await req.json()) as CreateProductInput & {
      products?: CreateProductInput[];
      importMode?: BulkImportMode;
    };

    const supabase = getSupabaseAdmin();

    if (Array.isArray(body.products)) {
      if (body.products.length === 0) {
        return NextResponse.json({ error: "Danh sách sản phẩm import đang trống" }, { status: 400 });
      }

      const maxBulkSize = 200;
      if (body.products.length > maxBulkSize) {
        return NextResponse.json(
          { error: `Tối đa ${maxBulkSize} sản phẩm mỗi lần import` },
          { status: 400 },
        );
      }

      const importMode = normalizeBulkImportMode(body.importMode);
      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;
      let updated = 0;
      let created = 0;

      for (const [index, item] of body.products.entries()) {
        try {
          const slug = String(item.slug ?? "").trim();
          if (!slug) {
            throw new Error("Slug là bắt buộc khi import");
          }

          const existing = await findProductBySlug(supabase, slug);

          if (existing) {
            if (importMode === "skip") {
              skipped += 1;
              continue;
            }

            if (importMode === "create") {
              throw new Error(`Slug đã tồn tại: ${slug}`);
            }

            const upsertResult: BulkUpsertResult = {
              status: "updated",
              product: await updateProductWithRelations(supabase, existing.id, item),
            };

            imported += 1;
            if (upsertResult.status === "updated") {
              updated += 1;
            } else {
              created += 1;
            }
            continue;
          }

          const createdProduct = await createProductWithRelations(supabase, item);
          const upsertResult: BulkUpsertResult = {
            status: "created",
            product: createdProduct,
          };

          imported += 1;
          if (upsertResult.status === "created") {
            created += 1;
          } else {
            updated += 1;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Server error";
          errors.push(`Dòng ${index + 1}: ${message}`);
        }
      }

      revalidateTag("catalog:products");
      revalidateTag("catalog:categories");

      return NextResponse.json(
        {
          total: body.products.length,
          importMode,
          imported,
          skipped,
          updated,
          created,
          failed: body.products.length - imported - skipped,
          errors,
        },
        { status: imported > 0 || skipped > 0 ? 200 : 400 },
      );
    }

    const created = await createProductWithRelations(supabase, body);

    revalidateTag("catalog:products");
    revalidateTag("catalog:categories");

    return NextResponse.json({ product: created }, { status: 201 });
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

          const invalidImageUrl = cleanedImageUrls.find(
            (url) => !isLikelyDirectImageUrl(url),
          );

          if (invalidImageUrl) {
            return {
              error: `URL ảnh không hợp lệ hoặc không phải ảnh trực tiếp: ${invalidImageUrl}`,
            };
          }

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

    revalidateTag("catalog:products");
    revalidateTag("catalog:categories");

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

    revalidateTag("catalog:products");
    revalidateTag("catalog:categories");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
