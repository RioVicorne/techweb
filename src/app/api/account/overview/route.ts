import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";

type Counts = Record<string, number>;

type OrderRow = {
  id?: string;
  order_code: string;
  created_at: string;
  updated_at?: string | null;
  status: string;
  total: number;
  currency: string;
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

type PurchaseRow = {
  sku: string;
  title: string;
  image: string;
  unit_price: number;
  total_qty: number;
  last_order_code: string;
  last_purchased_at: string;
};

type OrderItemPreview = {
  order_id: string | null;
  product_name_snapshot: string | null;
  image_url_snapshot: string | null;
  qty: number | null;
  created_at?: string | null;
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

    // Run user-specific queries in parallel (after auth).
    const [ordersRes, purchasesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id,order_code,created_at,updated_at,status,total,currency")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("order_items")
        .select(
          "sku_snapshot,product_name_snapshot,image_url_snapshot,unit_price,qty,created_at,orders!inner(order_code,user_id)",
        )
        .eq("orders.user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
    if (purchasesRes.error)
      return NextResponse.json({ error: purchasesRes.error.message }, { status: 500 });

    const ordersAll = (ordersRes.data ?? []) as unknown as OrderRow[];

    const counts: Counts = {};
    for (const row of ordersAll) {
      const s = String(row.status ?? "").trim();
      if (!s) continue;
      counts[s] = (counts[s] ?? 0) + 1;
    }

    const orders = ordersAll.slice(0, 20);
    const orderIds = orders.map((o) => String(o.id ?? "")).filter(Boolean);

    let enrichedOrders: Array<OrderRow & { first_item?: { title: string; image: string; qty: number } | null }> =
      orders.map((o) => ({ ...o, first_item: null }));

    if (orderIds.length > 0) {
      const itemsQ = await supabase
        .from("order_items")
        .select("order_id,product_name_snapshot,image_url_snapshot,qty,created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (itemsQ.error) return NextResponse.json({ error: itemsQ.error.message }, { status: 500 });

      const firstByOrderId = new Map<string, { title: string; image: string; qty: number }>();
      for (const it of (itemsQ.data ?? []) as unknown as OrderItemPreview[]) {
        const oid = String(it.order_id ?? "");
        if (!oid) continue;
        if (firstByOrderId.has(oid)) continue;
        firstByOrderId.set(oid, {
          title: String(it.product_name_snapshot ?? "").trim(),
          image: String(it.image_url_snapshot ?? "").trim(),
          qty: Math.max(1, Math.floor(Number(it.qty ?? 1))),
        });
      }

      enrichedOrders = orders.map((o) => {
        const id = String(o.id ?? "");
        const first = id ? firstByOrderId.get(id) : undefined;
        return { ...o, first_item: first ?? null };
      });
    }

    // Aggregate purchases from recent order items.
    const map = new Map<string, PurchaseRow>();
    for (const r of (purchasesRes.data ?? []) as unknown as OrderItemRow[]) {
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

    return NextResponse.json(
      { orders: enrichedOrders, counts, purchases },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

