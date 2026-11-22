"use client";

import { useState, useEffect, useCallback } from "react";
import { formatNPR } from "@/app/store/StoreProvider";

interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  customer_name: string;
  customer_email: string;
  verifiedPurchase: boolean;
  helpful_count: number;
  created_at: string;
}

interface ReviewSummary {
  count: number;
  averageRating: number;
}

export default function ProductReviews({
  productId,
}: {
  productId: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ count: 0, averageRating: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || { count: 0, averageRating: 0 });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, title: title || undefined, comment: comment || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit review.");
        return;
      }

      setSubmitSuccess(true);
      setRating(5);
      setTitle("");
      setComment("");
      fetchReviews();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <section className="mt-12 sm:mt-16 border-t pt-8 sm:pt-12" style={{ borderColor: "var(--border)" }}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            Customer Reviews
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
              {summary.averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5" style={{ color: "var(--primary)" }}>
              {stars.map((s) => (
                <span key={s} className="text-[12px]">
                  {s <= Math.round(summary.averageRating) ? "★" : "☆"}
                </span>
              ))}
            </div>
            <span className="text-xs sm:text-sm" style={{ color: "#57534e" }}>
              ({summary.count} review{summary.count !== 1 ? "s" : ""})
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "#57534e" }}>Loading reviews…</p>
      ) : summary.count === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
            No reviews yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Be the first to review this product.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-none last:pb-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-0.5 mt-0.5" style={{ color: "var(--primary)" }}>
                  {stars.map((s) => (
                    <span key={s} className="text-xs">
                      {s <= review.rating ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                {review.verifiedPurchase && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "#57534e" }}>
                    Verified purchase
                  </span>
                )}
              </div>
              {review.title && (
                <h4 className="mt-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {review.title}
                </h4>
              )}
              {review.comment && (
                <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
                  {review.comment}
                </p>
              )}
              <div className="mt-2 flex items-baseline gap-2 text-xs">
                <span className="font-medium" style={{ color: "#57534e" }}>
                  {review.customer_name}
                </span>
                <span className="text-muted-foreground" style={{ color: "#57534e" }}>
                  · {new Date(review.created_at).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 sm:mt-16 border rounded-xl p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-6 text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Write a review
        </h3>

        {submitSuccess && (
          <div className="mb-4 rounded-lg bg-green/50 px-4 py-3 text-sm" style={{ borderColor: "#10b981", color: "#065f46" }}>
            Thank you for your review!
          </div>
        )}

        {submitError && (
          <div className="mb-4 rounded-lg bg-red/50 px-4 py-3 text-sm" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Your rating
            </label>
            <div className="flex items-center gap-1" style={{ color: "var(--primary)" }}>
              {stars.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`text-2xl p-0 transition-transform ${s <= rating ? "" : "hover:scale-110"}`}
                  aria-label={`Rate ${s} stars`}
                >
                  {s <= rating ? "★" : "☆"}
                </button>
              ))}
              <span className="ml-2 text-xs" style={{ color: "#57534e" }}>
                {rating} of 5
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Great quality and comfortable"
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience with this product…"
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>
    </section>
  );
}
