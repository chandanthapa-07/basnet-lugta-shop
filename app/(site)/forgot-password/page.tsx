"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess("If an account exists with this email, a password reset link has been sent.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md px-6 py-12 sm:py-20">
      <div className="text-center mb-10">
        <Image
          src="/basnet-logo.jpeg"
          alt="Basnet Lugta Shop"
          width={1152}
          height={768}
          className="h-12 w-auto mx-auto rounded-md object-contain"
        />
        <h1 className="mt-6 text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
          Reset password
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#57534e" }}>
          Enter your email address and we’ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "#fdecea", border: "1px solid #fecaca", color: "#b50021" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "#57534e" }}>
        Remember your password?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--primary)" }}>
          Sign in
        </Link>
      </p>
    </section>
  );
}