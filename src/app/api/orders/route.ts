import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import type { CartLine } from "@/context/cart-context";
import { createOrderId } from "@/lib/orders";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

const ORDER_CREATE_LIMIT = {
  maxRequests: 20,
  windowMs: 5 * 60 * 1000,
};

/** Config for VietQR / bank transfer */
const BANK = {
  code: "BIDV",
  accountNumber: "8886612856",
  accountName: "TRAN DINH KHOA",
};

function buildVietQrUrl(orderCode: string, amountVnd: number): string {
  const message = `TT ${orderCode}`.slice(0, 25);
  return `https://img.vietqr.io/image/${BANK.code}-${BANK.accountNumber}-compact.png?amount=${amountVnd}&addInfo=${encodeURIComponent(message)}`;
}

/** MoMo payment URL generator.
 * Free approach without MoMo merchant API:
 * - Desktop: MoMo receive QR code (user scans with MoMo app)
 * - Mobile: MoMo deep link that opens the MoMo app directly */
function buildMoMoPaymentUrl(orderCode: string, amountVnd: number): {
  qrCodeUrl: string;
  deepLink: string;
} {
  // MoMo receive QR: encode a MoMo transfer link as QR
  const moMoLink = `momo://transfer?phone=0353648265&amount=${amountVnd}&message=${encodeURIComponent("TT " + orderCode)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(moMoLink)}&bgcolor=ffffff`;
  // Deep link for mobile — opens MoMo app directly
  const deepLink = moMoLink;
  return { qrCodeUrl, deepLink };
}

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
  paymentMethod?: "COD" | "MOMO" | "BANK";
};

export async function POST(req: Request) {
  const ip = getRequestIp(req);

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

    const limit = checkRateLimit(
      `orders-create:${ip}:${userData.user.id}`,
      ORDER_CREATE_LIMIT.maxRequests,
      ORDER_CREATE_LIMIT.windowMs,
    );

    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many order requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSec),
            "X-RateLimit-Remaining": String(limit.remaining),
          },
        },
      );
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
    const paymentMethod = (body as Partial<CreateOrderBody>).paymentMethod || "COD";

    let qrCodeUrl: string | null = null;
    let moMoDeepLink: string | null = null;

    if (paymentMethod === "BANK") {
      qrCodeUrl = buildVietQrUrl(orderId, Math.round(totalVnd));
    } else if (paymentMethod === "MOMO") {
      const moMo = buildMoMoPaymentUrl(orderId, Math.round(totalVnd));
      qrCodeUrl = moMo.qrCodeUrl;
      moMoDeepLink = moMo.deepLink;
    }

    const paymentStatus = (paymentMethod === "BANK" || paymentMethod === "MOMO") ? "AWAITING_PAYMENT" : "UNPAID";
    const paymentMethodDb = paymentMethod === "BANK" ? "BANK" : paymentMethod === "MOMO" ? "MOMO" : "COD";

    const supabase = getSupabaseAdmin();

    // Lookup product IDs (bigint) from slugs for proper FK linkage in order_items.
    const slugs = [...new Set(body.lines.map((l) => l.productId))];
    const { data: productRows } = await supabase
      .from("products")
      .select("id,slug")
      .in("slug", slugs);
    const slugToId = Object.fromEntries(
      (productRows ?? []).map((p) => [p.slug, p.id as number]),
    );

    const orderItemsInput = body.lines.map((l) => ({
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

    const { data: insertedOrderCode, error: rpcErr } = await supabase.rpc(
      "create_order_with_items",
      {
        p_order_code: orderId,
        p_user_id: userData.user.id,
        p_status: "PENDING_CONFIRMATION",
        p_currency: "đ",
        p_subtotal: Math.round(subtotalVnd),
        p_shipping_fee: Math.round(shippingVnd),
        p_discount: 0,
        p_total: Math.round(totalVnd),
        p_full_name: c.name,
        p_phone: c.phone || null,
        p_address_line: c.address,
        p_city: null,
        p_email: c.email || null,
        p_note: c.note || null,
        p_delivery_method: "STANDARD",
        p_payment_method: paymentMethodDb,
        p_payment_status: paymentStatus,
        p_qr_code_url: qrCodeUrl,
        p_items: orderItemsInput,
      },
    );

    if (rpcErr || !insertedOrderCode) {
      return NextResponse.json(
        { error: rpcErr?.message || "Failed to create order" },
        { status: 500 },
      );
    }

    return NextResponse.json({ orderId: insertedOrderCode, qrCodeUrl, moMoDeepLink }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
