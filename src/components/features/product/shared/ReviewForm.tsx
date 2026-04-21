"use client";

import { useState, useCallback } from "react";

type ReviewFormProps = {
  productId: number;
  onSubmitSuccess?: () => void;
};

export function ReviewForm({ productId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (rating === 0) {
        setError("Vui lòng chọn số sao đánh giá");
        return;
      }
      if (!comment.trim()) {
        setError("Vui lòng nhập nhận xét");
        return;
      }
      if (!reviewerName.trim()) {
        setError("Vui lòng nhập tên của bạn");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch(`/api/products/${productId}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            title: title || undefined,
            comment,
            reviewerName,
            reviewerEmail: reviewerEmail || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Có lỗi xảy ra");
        }

        setSuccess(true);
        setRating(0);
        setTitle("");
        setComment("");
        setReviewerName("");
        setReviewerEmail("");

        onSubmitSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setIsSubmitting(false);
      }
    },
    [rating, title, comment, reviewerName, reviewerEmail, productId, onSubmitSuccess],
  );

  if (success) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: "var(--stitch-color-surface-container)" }}
      >
        <span
          className="material-symbols-outlined text-4xl"
          style={{ color: "var(--stitch-color-secondary)" }}
        >
          check_circle
        </span>
        <p className="mt-3 text-lg font-bold text-[var(--stitch-color-on-surface)]">Cảm ơn bạn đã đánh giá!</p>
        <p className="mt-1 text-sm" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
          Đánh giá của bạn đang chờ duyệt và sẽ hiển thị sau khi được xác nhận.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 rounded-full px-5 py-2 text-sm font-bold text-[var(--stitch-color-on-primary)] transition active:scale-95"
          style={{ background: "var(--stitch-color-primary)" }}
        >
          Đánh giá khác
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl p-6"
      style={{ background: "var(--stitch-color-surface-container)" }}
    >
      <h3
        className="text-xl font-black italic tracking-tighter text-[var(--stitch-color-on-surface)]"
        style={{ fontFamily: "var(--stitch-font-headline)" }}
      >
        Viết đánh giá
      </h3>

      {/* Rating Stars */}
      <div>
        <label className="mb-2 block text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
          Số sao đánh giá
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="material-symbols-outlined text-3xl transition hover:scale-110"
              style={{
                fontVariationSettings: "'FILL' 1",
                color:
                  (hoverRating > 0 ? hoverRating : rating) >= star
                    ? "var(--stitch-color-secondary)"
                    : "var(--stitch-color-outline-variant, var(--stitch-color-outline))",
              }}
            >
              star
            </button>
          ))}
          <span className="ml-2 text-sm font-medium" style={{ color: "var(--stitch-color-on-surface-variant)" }}>
            {rating > 0 ? `${rating}/5 sao` : "Chưa chọn"}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
          Tiêu đề đánh giá (không bắt buộc)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ví dụ: Sản phẩm tuyệt vời!"
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--stitch-color-surface)",
            color: "var(--stitch-color-on-surface)",
            border: "1px solid var(--stitch-color-outline-variant, var(--stitch-color-outline))",
          }}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="mb-2 block text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
          Nhận xét của bạn <span style={{ color: "var(--stitch-color-error)" }}>*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
          rows={4}
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--stitch-color-surface)",
            color: "var(--stitch-color-on-surface)",
            border: "1px solid var(--stitch-color-outline-variant, var(--stitch-color-outline))",
            resize: "vertical",
          }}
        />
      </div>

      {/* Reviewer Name */}
      <div>
        <label className="mb-2 block text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
          Tên của bạn <span style={{ color: "var(--stitch-color-error)" }}>*</span>
        </label>
        <input
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Nhập tên hiển thị"
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--stitch-color-surface)",
            color: "var(--stitch-color-on-surface)",
            border: "1px solid var(--stitch-color-outline-variant, var(--stitch-color-outline))",
          }}
        />
      </div>

      {/* Reviewer Email */}
      <div>
        <label className="mb-2 block text-sm font-bold" style={{ color: "var(--stitch-color-on-surface)" }}>
          Email (không bắt buộc)
        </label>
        <input
          type="email"
          value={reviewerEmail}
          onChange={(e) => setReviewerEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{
            background: "var(--stitch-color-surface)",
            color: "var(--stitch-color-on-surface)",
            border: "1px solid var(--stitch-color-outline-variant, var(--stitch-color-outline))",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--stitch-color-error)" }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full px-5 py-3 text-sm font-extrabold text-[var(--stitch-color-on-primary)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, var(--stitch-color-primary) 0%, var(--stitch-color-primary-dim, var(--stitch-color-primary)) 100%)`,
        }}
      >
        {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}
