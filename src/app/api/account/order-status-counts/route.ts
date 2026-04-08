import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";

type Counts = Record<string, number>;

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
    // Fetch recent statuses and aggregate in code (simple + avoids SQL/RPC setup).
    const { data, error } = await supabase
      .from("orders")
      .select("status")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const counts: Counts = {};
    for (const row of data ?? []) {
      const s = String((row as { status?: unknown }).status ?? "");
      if (!s) continue;
      counts[s] = (counts[s] ?? 0) + 1;
    }

    return NextResponse.json({ counts }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

