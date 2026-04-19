import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

type ReviewBody = {
  rating: number;
  title?: string;
  comment: string;
  reviewerName: string;
  reviewerEmail?: string;
};

const REVIEW_SUBMIT_LIMIT = {
  maxRequests: 6,
  windowMs: 10 * 60 * 1000,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const productIdNum = Number(productId);

    if (!productIdNum || Number.isNaN(productIdNum)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: reviews, error: reviewsError } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productIdNum)
      .eq("status", "APPROVED")
      .order("created_at", { ascending: false });

    if (reviewsError) {
      return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    }

    const { data: statsData, error: statsError } = await supabase.rpc(
      "get_product_rating_stats",
      { p_product_id: productIdNum },
    );

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    const stats = statsData?.[0] ?? {
      average_rating: 0,
      total_reviews: 0,
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
    };

    return NextResponse.json({
      reviews: reviews ?? [],
      stats,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const productIdNum = Number(productId);

    if (!productIdNum || Number.isNaN(productIdNum)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    const ip = getRequestIp(req);
    const limit = await checkRateLimit(
      `reviews-submit:${ip}:${productIdNum}`,
      REVIEW_SUBMIT_LIMIT.maxRequests,
      REVIEW_SUBMIT_LIMIT.windowMs,
    );

    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many review submissions. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSec),
            "X-RateLimit-Remaining": String(limit.remaining),
          },
        },
      );
    }

    const body = (await req.json()) as Partial<ReviewBody>;
    const { rating, title, comment, reviewerName, reviewerEmail } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }
    if (!reviewerName || reviewerName.trim().length === 0) {
      return NextResponse.json({ error: "Reviewer name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productIdNum)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { data: review, error } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productIdNum,
        rating,
        title: title ?? null,
        comment: comment.trim(),
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail ?? null,
        status: "PENDING",
        is_approved: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review, message: "Review submitted, pending approval" }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
