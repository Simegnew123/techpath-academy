"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Service = {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  priceUnit: string;
  location: string;
  contactMethod: string;
  contactInfo: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
};

type Review = {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const categoryLabels: Record<string, { label: string; icon: string }> = {
  tutoring: { label: "Tutoring", icon: "📚" },
  consulting: { label: "Consulting", icon: "💡" },
  mentoring: { label: "Mentoring", icon: "🧭" },
  design: { label: "Design", icon: "🎨" },
  writing: { label: "Writing & Editing", icon: "✍️" },
  translation: { label: "Translation", icon: "🌍" },
  marketing: { label: "Marketing", icon: "📣" },
  business: { label: "Business", icon: "💼" },
  legal: { label: "Legal", icon: "⚖️" },
  health: { label: "Health & Wellness", icon: "🏥" },
  other: { label: "Other", icon: "🔧" },
};

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/services/${id}`).then((r) => r.json()),
      fetch(`/api/services/reviews?serviceId=${id}`).then((r) => r.json()),
    ]).then(([svcData, revData]) => {
      setService(svcData.service || null);
      setReviews(revData.reviews || []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function submitBooking() {
    setBookingStatus("Sending...");
    const res = await fetch("/api/services/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: id, message: bookingMessage }),
    });
    const data = await res.json();
    if (data.booking) {
      setBookingStatus("✅ Booking request sent! The provider will contact you soon.");
      setBookingMessage("");
      setShowBooking(false);
    } else {
      setBookingStatus(`❌ ${data.error || "Failed"}`);
    }
  }

  async function submitReview() {
    setReviewStatus("Submitting...");
    const res = await fetch("/api/services/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: id, rating: reviewRating, comment: reviewComment }),
    });
    const data = await res.json();
    if (data.review) {
      setReviewStatus("✅ Review submitted!");
      setReviewComment("");
      setShowReview(false);
      // Refresh reviews
      const revRes = await fetch(`/api/services/reviews?serviceId=${id}`);
      const revData = await revRes.json();
      setReviews(revData.reviews || []);
      // Refresh service to get updated rating
      const svcRes = await fetch(`/api/services/${id}`);
      const svcData = await svcRes.json();
      if (svcData.service) setService(svcData.service);
    } else {
      setReviewStatus(`❌ ${data.error || "Failed"}`);
    }
  }

  function formatPrice(price: number, unit: string) {
    if (price === 0) return "Free";
    return `${price} ETB / ${unit}`;
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-400">Loading...</div>;
  if (!service) return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <div className="text-6xl">🔍</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Service not found</h1>
      <Link href="/services" className="mt-4 inline-block text-indigo-600 hover:underline">← Back to Services</Link>
    </div>
  );

  const cat = categoryLabels[service.category] || { label: service.category, icon: "🔧" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/services" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← All Services</Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {cat.icon} {cat.label}
          </span>
          {service.rating > 0 && (
            <span className="text-lg font-bold text-amber-500">⭐ {service.rating} ({service.reviewCount} reviews)</span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-slate-100">{service.title}</h1>
        <p className="mt-1 text-slate-500">Offered by <span className="font-semibold text-slate-700 dark:text-slate-300">{service.providerName}</span></p>
        <p className="mt-4 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{service.description}</p>

        {/* Tags */}
        {service.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {service.tags.map((tag, i) => (
              <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Info grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
          <div>
            <p className="text-slate-400">💰 Price</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{formatPrice(service.price, service.priceUnit)}</p>
          </div>
          <div>
            <p className="text-slate-400">📍 Location</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{service.location}</p>
          </div>
          <div>
            <p className="text-slate-400">📞 Contact via</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{service.contactMethod}</p>
          </div>
          <div>
            <p className="text-slate-400">📅 Posted</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{new Date(service.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setShowBooking(!showBooking)}
          className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          📅 Book This Service
        </button>
        <button
          onClick={() => setShowReview(!showReview)}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
        >
          ⭐ Leave a Review
        </button>
      </div>

      {/* Booking form */}
      {showBooking && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">📅 Book This Service</h3>
          <textarea
            value={bookingMessage}
            onChange={(e) => setBookingMessage(e.target.value)}
            placeholder="Tell the provider what you need, your preferred time, etc."
            className="mt-3 h-24 w-full rounded-lg border border-slate-300 p-3 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
          <button
            onClick={submitBooking}
            disabled={!bookingMessage.trim()}
            className="mt-3 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Send Request
          </button>
          {bookingStatus && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{bookingStatus}</p>}
          <p className="mt-2 text-xs text-slate-400">
            💡 The provider will be notified and can confirm via {service.contactMethod}: {service.contactInfo || "N/A"}
          </p>
        </div>
      )}

      {/* Review form */}
      {showReview && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">⭐ Leave a Review</h3>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setReviewRating(star)}
                className={`text-2xl ${star <= reviewRating ? "text-amber-400" : "text-slate-300"}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience..."
            className="mt-3 h-24 w-full rounded-lg border border-slate-300 p-3 text-sm dark:bg-slate-900 dark:border-slate-600"
          />
          <button
            onClick={submitReview}
            className="mt-3 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Submit Review
          </button>
          {reviewStatus && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{reviewStatus}</p>}
        </div>
      )}

      {/* Reviews list */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">User</span>
                  <span className="text-amber-400">{"⭐".repeat(rev.rating)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{rev.comment || "No comment"}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
