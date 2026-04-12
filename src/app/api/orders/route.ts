import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import type { CartLine } from "@/context/cart-context";
import { createOrderId } from "@/lib/orders";

type CreateOrderBody = {
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    note?: string;
  };
  lines: CartLine[];
  subtotalVnd: number;
  shippingVnd: number;
  totalVnd: number;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice("bearer ".length).trim()
      : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authClient = getSupabaseServerAuth();
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<CreateOrderBody>;
    const c = body.customer;
    // UI requires: name + address + (phone OR email). Keep API aligned to avoid false 400s.
    if (!c || !c.name || !c.address || (!c.phone && !c.email)) {
      return NextResponse.json({ error: "Missing customer fields" }, { status: 400 });
    }
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    const subtotalVnd = Number(body.subtotalVnd);
    const shippingVnd = Number(body.shippingVnd);
    const totalVnd = Number(body.totalVnd);
    if (![subtotalVnd, shippingVnd, totalVnd].every(Number.isFinite)) {
      return NextResponse.json({ error: "Invalid totals" }, { status: 400 });
    }

    const orderId = createOrderId();
    const supabase = getSupabaseAdmin();
    // RioShop schema stores order header + order items separately.
    const { data: inserted, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_code: orderId,
        user_id: userData.user.id,
        status: "PENDING_CONFIRMATION",
        currency: "VND",
        subtotal: Math.round(subtotalVnd),
        shipping_fee: Math.round(shippingVnd),
        discount: 0,
        total: Math.round(totalVnd),
        full_name: c.name,
        // Now nullable in schema
        phone: c.phone || null,
        address_line: c.address,
        city: null,
        email: c.email || null,
        note: c.note || null,
        delivery_method: "STANDARD",
      })
      .select("id,order_code,created_at")
      .single();
    if (orderErr || !inserted) {
      return NextResponse.json({ error: orderErr?.message || "Failed to create order" }, { status: 500 });
    }

    // Lookup product IDs (bigint) from slugs for proper FK linkage in order_items.
    const slugs = [...new Set(body.lines.map((l) => l.productId))];
    const { data: productRows } = await supabase
      .from("products")
      .select("id,slug")
      .in("slug", slugs);
    const slugToId = Object.fromEntries(
      (productRows ?? []).map((p) => [p.slug, p.id as number]),
    );

    const orderItems = body.lines.map((l) => ({
      order_id: inserted.id,
      product_id: slugToId[l.productId] ?? null,
      variant_id: null,
      product_name_snapshot: l.title,
      variant_name_snapshot: null,
      sku_snapshot: l.productId,
      image_url_snapshot: l.image || null,
      unit_price: Math.round(Number(l.priceVnd) || 0),
      qty: Math.max(1, Math.floor(Number(l.qty) || 1)),
      line_total: Math.round((Number(l.priceVnd) || 0) * Math.max(1, Math.floor(Number(l.qty) || 1))),
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      // Keep order header; surface error so dev can diagnose.
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    return NextResponse.json({ orderId }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

