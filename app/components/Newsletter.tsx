"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setSubscribed(true);
  };

  if (subscribed) {
    return (
      <div className="text-center py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 mx-auto mb-3">
          <span className="text-green-600 font-bold">✓</span>
        </div>
        <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Thank you!
        </h3>
        <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
          You&rsquo;re subscribed to our newsletter.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 rounded-lg border px-4 py-3 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60"
        style={{ background: "var(--primary)" }}
      >
        {submitting ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}