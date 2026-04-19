import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type UpdateBody = {
  status: "APPROVED" | "REJECTED";
};

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const supabase = getSupabaseAdmin();
    const { data: reviews, error } = await supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const { reviewId } = await params;
    const reviewIdNum = Number(reviewId);

    if (Number.isNaN(reviewIdNum)) {
      return NextResponse.json({ error: "Invalid reviewId" }, { status: 400 });
    }

    const body = (await req.json()) as Partial<UpdateBody>;

    if (!body.status || (body.status !== "APPROVED" && body.status !== "REJECTED")) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: review, error } = await supabase
      .from("product_reviews")
      .update({
        status: body.status,
        is_approved: body.status === "APPROVED",
      })
      .eq("id", reviewIdNum)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
