import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";

type PurchaseRow = {
  sku: string;
  title: string;
  image: string;
  unit_price: number;
  total_qty: number;
  last_order_code: string;
  last_purchased_at: string;
};

type OrderItemRow = {
  sku_snapshot: string | null;
  product_name_snapshot: string | null;
  image_url_snapshot: string | null;
  unit_price: number | null;
  qty: number | null;
  created_at: string | null;
  orders: { order_code: string | null; user_id: string | null } | null;
};

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice("bearer ".length).trim()
      : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const authClient = getSupabaseServerAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    // Fallback: fetch last N items and aggregate in code (simple + safe for demo).
    const { data: rows, error: qErr } = await supabase
      .from("order_items")
      .select(
        "sku_snapshot,product_name_snapshot,image_url_snapshot,unit_price,qty,created_at,orders!inner(order_code,user_id)",
      )
      .eq("orders.user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

    const map = new Map<string, PurchaseRow>();
    for (const r of (rows ?? []) as unknown as OrderItemRow[]) {
      const sku = String(r.sku_snapshot ?? "");
      if (!sku) continue;
      const qty = Math.max(1, Math.floor(Number(r.qty ?? 1)));
      const prev = map.get(sku);
      const orderCode = String(r.orders?.order_code ?? "");
      const purchasedAt = String(r.created_at ?? "");
      if (!prev) {
        map.set(sku, {
          sku,
          title: String(r.product_name_snapshot ?? sku),
          image: String(r.image_url_snapshot ?? ""),
          unit_price: Number(r.unit_price ?? 0),
          total_qty: qty,
          last_order_code: orderCode,
          last_purchased_at: purchasedAt,
        });
      } else {
        prev.total_qty += qty;
      }
    }

    const purchases = Array.from(map.values()).sort((a, b) =>
      String(b.last_purchased_at).localeCompare(String(a.last_purchased_at)),
    );
    return NextResponse.json({ purchases }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

