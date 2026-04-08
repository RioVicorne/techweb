import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Body = {
  orderId: string;
};

export async function POST(req: Request) {
  try {
    const stripeKey = getOptionalEnv("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
    }

    const body = (await req.json()) as Partial<Body>;
    const orderId = body.orderId || "";
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      // `orderId` passed around the app is the public `order_code` (e.g. "RS...").
      .eq("order_code", orderId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const siteUrl = getOptionalEnv("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/checkout/success?orderId=${encodeURIComponent(orderId)}`,
      cancel_url: `${siteUrl}/checkout?canceled=1`,
      metadata: { orderId },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "vnd",
            unit_amount: Number(order.total),
            product_data: { name: `RioShop Order ${orderId}` },
          },
        },
      ],
    });

    await supabase
      .from("orders")
      .update({
        payment_provider: "stripe",
        stripe_session_id: session.id,
      })
      .eq("order_code", orderId);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

