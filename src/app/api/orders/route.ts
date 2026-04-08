import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
    const body = (await req.json()) as Partial<CreateOrderBody>;
    const c = body.customer;
    if (!c || !c.name || !c.phone || !c.email || !c.address) {
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
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      customer: c,
      lines: body.lines,
      subtotal_vnd: Math.round(subtotalVnd),
      shipping_vnd: Math.round(shippingVnd),
      total_vnd: Math.round(totalVnd),
      status: "created",
      payment_provider: null,
      payment_status: "unpaid",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orderId }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

