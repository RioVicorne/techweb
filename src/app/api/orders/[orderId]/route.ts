import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatVndDisplay } from "@/data/products";
import type { CartLine } from "@/context/cart-context";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id,order_code,created_at,subtotal,shipping_fee,total,full_name,phone,address_line,city,grid_code,note,payment_method,payment_status,qr_code_url")
      .eq("order_code", orderId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("sku_snapshot,product_name_snapshot,image_url_snapshot,unit_price,qty")
      .eq("order_id", order.id)
      .order("id", { ascending: true });
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    const lines: CartLine[] = (items ?? []).map((it) => {
      const priceVnd = Number(it.unit_price ?? 0);
      const qty = Math.max(1, Math.floor(Number(it.qty ?? 1)));
      return {
        productId: String(it.sku_snapshot ?? ""),
        title: String(it.product_name_snapshot ?? ""),
        priceDisplay: formatVndDisplay(priceVnd),
        priceVnd,
        image: String(it.image_url_snapshot ?? ""),
        qty,
      };
    });

    // Return legacy shape expected by SuccessClient for now.
    return NextResponse.json(
      {
        order: {
          id: String(order.order_code),
          created_at: String(order.created_at),
          payment_method: String(order.payment_method ?? ""),
          payment_status: String(order.payment_status ?? "UNPAID"),
          qr_code_url: order.qr_code_url ? String(order.qr_code_url) : null,
          customer: {
            name: String(order.full_name ?? ""),
            phone: String(order.phone ?? ""),
            email: String(order.grid_code ?? ""),
            address: `${String(order.address_line ?? "")}${order.city ? `, ${String(order.city)}` : ""}`,
            note: order.note ? String(order.note) : undefined,
          },
          lines,
          subtotal_vnd: Number(order.subtotal ?? 0),
          shipping_vnd: Number(order.shipping_fee ?? 0),
          total_vnd: Number(order.total ?? 0),
        },
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

