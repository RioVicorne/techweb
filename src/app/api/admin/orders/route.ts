import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "").trim();
    const limitRaw = Number(url.searchParams.get("limit") || DEFAULT_LIMIT);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT));

    const supabase = getSupabaseAdmin();
    let q = supabase
      .from("orders")
      .select(
        "id,order_code,created_at,status,total,currency,full_name,phone,address_line,city,grid_code,note,user_id",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const orders = data ?? [];
    const orderIds = orders.map((o) => (o as { id: string }).id).filter(Boolean);

    const firstItems: Record<
      string,
      { product_name_snapshot: string | null; image_url_snapshot: string | null; qty: number }
    > = {};

    if (orderIds.length > 0) {
      const { data: items, error: itemsErr } = await supabase
        .from("order_items")
        .select("order_id,product_name_snapshot,image_url_snapshot,qty,created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });
      if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

      for (const it of items ?? []) {
        const oid = String((it as { order_id: string }).order_id);
        if (firstItems[oid]) continue;
        firstItems[oid] = {
          product_name_snapshot: (it as { product_name_snapshot: string | null }).product_name_snapshot,
          image_url_snapshot: (it as { image_url_snapshot: string | null }).image_url_snapshot,
          qty: Math.max(1, Math.floor(Number((it as { qty: number }).qty ?? 1))),
        };
      }
    }

    const enriched = orders.map((o) => {
      const row = o as { id: string };
      const fi = firstItems[row.id];
      return {
        ...o,
        first_item: fi
          ? {
              title: fi.product_name_snapshot ?? "",
              image: fi.image_url_snapshot ?? "",
              qty: fi.qty,
            }
          : null,
      };
    });

    return NextResponse.json({ orders: enriched }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
