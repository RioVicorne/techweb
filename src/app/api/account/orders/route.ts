import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";

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
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_code,created_at,updated_at,status,total,currency")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const orders = data ?? [];
    const orderIds = orders.map((o) => (o as { id?: string }).id).filter(Boolean) as string[];
    if (orderIds.length === 0) {
      return NextResponse.json({ orders: orders ?? [] }, { status: 200 });
    }

    // Fetch items for these orders, then pick the first item per order (for list preview).
    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("order_id,product_name_snapshot,image_url_snapshot,qty,created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: true });
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    const firstByOrderId = new Map<
      string,
      { title: string; image: string; qty: number }
    >();
    for (const it of (items ?? []) as Array<{
      order_id: string;
      product_name_snapshot: string | null;
      image_url_snapshot: string | null;
      qty: number | null;
    }>) {
      if (!it.order_id) continue;
      if (firstByOrderId.has(it.order_id)) continue;
      firstByOrderId.set(it.order_id, {
        title: String(it.product_name_snapshot ?? "").trim(),
        image: String(it.image_url_snapshot ?? "").trim(),
        qty: Math.max(1, Math.floor(Number(it.qty ?? 1))),
      });
    }

    const enriched = orders.map((o) => {
      const id = String((o as { id?: string }).id ?? "");
      const first = id ? firstByOrderId.get(id) : undefined;
      return { ...o, first_item: first ?? null };
    });

    return NextResponse.json({ orders: enriched }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

