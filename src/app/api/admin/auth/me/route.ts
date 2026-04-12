import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;
  return NextResponse.json({ ok: true, email: gate.auth.email }, { status: 200 });
}
