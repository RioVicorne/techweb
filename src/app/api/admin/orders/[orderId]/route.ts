import { NextResponse } from "next/server";
import { isValidAdminOrderStatus } from "@/lib/admin-allowlist";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const { orderId } = await params;
    const id = (orderId || "").trim();
    if (!id) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const body = (await req.json()) as { status?: string };
    const nextStatus = (body.status || "").trim();
    if (!nextStatus || !isValidAdminOrderStatus(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: findErr } = await supabase
      .from("orders")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,order_code,status,updated_at")
      .single();

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
