"use client";

import { useEffect, useState, useCallback } from "react";
import { ReviewForm } from "./ReviewForm";

type Review = {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  reviewer_name: string;
  is_verified_purchase: boolean;
  created_at: string;
};

type RatingStats = {
  average_rating: number;
  total_reviews: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
};

type ProductReviewsSectionProps = {
  productId: number;
};

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}/reviews`);
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const renderStars = (rating: number, size = "text-lg") => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${size}`}
          style={{
            fontVariationSettings: "'FILL' 1",
            color: i <= rating ? "var(--stitch-color-secondary)" : "var(--stitch-color-outline-variant, var(--stitch-color-outline))",
          }}
        >
          star
        </span>
      ))}
    </div>
  );

  const renderRatingBar = (star: number, count: number, total: number) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="w-12 text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
          {star} sao
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--stitch-color-surface)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: "var(--stitch-color-secondary)",
            }}
          />
        </div>
        <span className="w-8 text-right text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          {count}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: "var(--stitch-color-surface-container)" }}
      >
        <p className="text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đang tải đánh giá...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: "var(--stitch-color-surface-container)" }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--stitch-color-error, #ef4444)" }}>
          {error}
        </p>
      </div>
    );
  }

  const totalReviews = stats?.total_reviews ?? 0;
  const avgRating = stats?.average_rating ?? 0;

  return (
    <div className="space-y-6">
      {/* Reviews Form */}
      <ReviewForm productId={productId} onSubmitSuccess={fetchReviews} />

      {/* Rating Summary */}
      {totalReviews > 0 && stats && (
        <div
          className="rounded-3xl p-6"
          style={{ background: "var(--stitch-color-surface-container)" }}
        >
          <h3
            className="mb-4 text-lg font-black italic tracking-tighter text-white"
            style={{ fontFamily: "var(--stitch-font-headline)" }}
          >
            Tổng quan đánh giá
          </h3>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            {/* Average */}
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white">{avgRating.toFixed(1)}</span>
              <div className="mt-2">{renderStars(Math.round(avgRating))}</div>
              <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
                {totalReviews} đánh giá
              </p>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-2">
              {renderRatingBar(5, stats.rating_5, totalReviews)}
              {renderRatingBar(4, stats.rating_4, totalReviews)}
              {renderRatingBar(3, stats.rating_3, totalReviews)}
              {renderRatingBar(2, stats.rating_2, totalReviews)}
              {renderRatingBar(1, stats.rating_1, totalReviews)}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3
          className="mb-4 text-lg font-black italic tracking-tighter text-white"
          style={{ fontFamily: "var(--stitch-font-headline)" }}
        >
          Đánh giá từ khách hàng {totalReviews > 0 && `(${totalReviews})`}
        </h3>

        {reviews.length === 0 ? (
          <div
            className="rounded-3xl p-8 text-center"
            style={{ background: "var(--stitch-color-surface-container)" }}
          >
            <span
              className="material-symbols-outlined text-4xl"
              style={{ color: "var(--stitch-color-outline-variant, var(--stitch-color-outline))" }}
            >
              rate_review
            </span>
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Chưa có đánh giá nào cho sản phẩm này.
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
              Hãy là người đầu tiên đánh giá!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl p-5"
                style={{ background: "var(--stitch-color-surface-container)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{review.reviewer_name}</span>
                      {review.is_verified_purchase && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-black"
                          style={{
                            background: "color-mix(in srgb, var(--stitch-color-secondary) 20%, transparent)",
                            color: "var(--stitch-color-on-surface-variant)",
                          }}
                        >
                          Đã mua hàng
                        </span>
                      )}
                    </div>
                    <div className="mt-1">{renderStars(review.rating, "text-base")}</div>
                    {review.title && (
                      <p className="mt-2 text-sm font-bold text-white">{review.title}</p>
                    )}
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: "var(--stitch-color-on-surface-variant)" }}
                    >
                      {review.comment}
                    </p>
                    <p className="mt-3 text-xs" style={{ color: "var(--stitch-color-outline-variant, var(--stitch-color-outline))" }}>
                      {new Date(review.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
