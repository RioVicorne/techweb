import { NextResponse } from "next/server";
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
      .from("product_variants")
      .select(
        `
        id,
        sku,
        name,
        price,
        is_active,
        product_id,
        products (
          id,
          name,
          slug,
          status
        ),
        inventory (
          quantity_on_hand,
          reserved
        )
      `,
      )
      .order("id", { ascending: true })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const imagesByProductId = new Map<number, string>();

    if ((data ?? []).length > 0) {
      const productIds = [
        ...new Set(
          (data ?? [])
            .map((r) => (r as { product_id: number }).product_id)
            .filter((x) => typeof x === "number"),
        ),
      ];
      if (productIds.length > 0) {
        const { data: imgs, error: imgErr } = await supabase
          .from("product_images")
          .select("product_id,url,sort_order")
          .in("product_id", productIds)
          .order("sort_order", { ascending: true });
        if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 500 });
        for (const im of imgs ?? []) {
          const pid = (im as { product_id: number }).product_id;
          const u = (im as { url: string | null }).url;
          if (!imagesByProductId.has(pid) && u) imagesByProductId.set(pid, u);
        }
      }
    }

    const rows = (data ?? []).map((raw) => {
      const r = raw as unknown as {
        id: number;
        sku: string;
        name: string | null;
        price: number;
        is_active: boolean | null;
        product_id: number;
        products:
          | { id: number; name: string; slug: string; status: string }
          | { id: number; name: string; slug: string; status: string }[]
          | null;
        inventory:
          | { quantity_on_hand: number; reserved: number }
          | { quantity_on_hand: number; reserved: number }[]
          | null;
      };
      const productRow = Array.isArray(r.products) ? r.products[0] ?? null : r.products;
      const invRaw = Array.isArray(r.inventory) ? r.inventory[0] ?? null : r.inventory;
      const inv = invRaw;
      const qoh = inv?.quantity_on_hand ?? 0;
      const res = inv?.reserved ?? 0;
      const product = productRow;
      const imageUrl = imagesByProductId.get(r.product_id) ?? "";

      return {
        variantId: r.id,
        sku: r.sku,
        variantName: r.name,
        price: r.price,
        isActive: r.is_active ?? true,
        productId: r.product_id,
        productName: product?.name ?? "",
        productSlug: product?.slug ?? "",
        productStatus: product?.status ?? "",
        quantityOnHand: qoh,
        reserved: res,
        available: Math.max(0, qoh - res),
        imageUrl,
      };
    });

    return NextResponse.json({ products: rows }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
