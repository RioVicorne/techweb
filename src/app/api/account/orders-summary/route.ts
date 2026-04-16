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

    // One query: fetch recent orders (up to 200) for counts + list.
    const { data: ordersRaw, error: ordersErr } = await supabase
      .from("orders")
      .select("id,order_code,created_at,updated_at,status,total,currency")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 });

    const ordersAll = (ordersRaw ?? []) as unknown as OrderRow[];
    const counts: Counts = {};
    for (const row of ordersAll) {
      const s = String(row.status ?? "").trim();
      if (!s) continue;
      counts[s] = (counts[s] ?? 0) + 1;
    }

    const orders = ordersAll.slice(0, 20);
    const orderIds = orders.map((o) => String(o.id ?? "")).filter(Boolean);
    if (orderIds.length === 0) {
      return NextResponse.json({ orders: [], counts }, { status: 200 });
    }

    // Fetch items for these orders, then pick the first item per order (for list preview).
    const { data: itemsRaw, error: itemsErr } = await supabase
      .from("order_items")
      .select("order_id,product_name_snapshot,image_url_snapshot,qty,created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    const firstByOrderId = new Map<string, { title: string; image: string; qty: number }>();
    for (const it of (itemsRaw ?? []) as unknown as OrderItemRow[]) {
      const oid = String(it.order_id ?? "");
      if (!oid) continue;
      if (firstByOrderId.has(oid)) continue;
      firstByOrderId.set(oid, {
        title: String(it.product_name_snapshot ?? "").trim(),
        image: String(it.image_url_snapshot ?? "").trim(),
        qty: Math.max(1, Math.floor(Number(it.qty ?? 1))),
      });
    }

    const enriched = orders.map((o) => {
      const id = String(o.id ?? "");
      const first = id ? firstByOrderId.get(id) : undefined;
      return { ...o, first_item: first ?? null };
    });

    return NextResponse.json({ orders: enriched, counts }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

