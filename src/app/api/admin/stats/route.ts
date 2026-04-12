import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const supabase = getSupabaseAdmin();

    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("status, total, created_at");
    if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 });

    const rows = (orders ?? []) as Array<{ status: string; total: number; created_at: string }>;
    const ordersByStatus: Record<string, number> = {};
    let revenueAllTime = 0;
    let revenueLast30d = 0;
    const now = Date.now();
    const d30 = 30 * 24 * 60 * 60 * 1000;

    for (const o of rows) {
      const st = o.status ?? "";
      ordersByStatus[st] = (ordersByStatus[st] ?? 0) + 1;
      if (st === "CANCELLED") continue;
      const t = Number(o.total ?? 0);
      revenueAllTime += t;
      const ts = new Date(o.created_at).getTime();
      if (Number.isFinite(ts) && now - ts <= d30) revenueLast30d += t;
    }

    const { data: invRows, error: invErr } = await supabase
      .from("inventory")
      .select("quantity_on_hand, reserved");
    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

    let lowStockCount = 0;
    const THRESHOLD = 5;
    for (const r of invRows ?? []) {
      const qoh = Number((r as { quantity_on_hand: number }).quantity_on_hand ?? 0);
      const res = Number((r as { reserved: number }).reserved ?? 0);
      if (qoh - res <= THRESHOLD) lowStockCount += 1;
    }

    return NextResponse.json(
      {
        totalOrders: rows.length,
        ordersByStatus,
        revenueVndAllTime: revenueAllTime,
        revenueVndLast30Days: revenueLast30d,
        lowStockCount,
        lowStockThreshold: THRESHOLD,
      },
      { status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
