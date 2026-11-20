"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState<"verify" | "reset">("verify");

  useEffect(() => {
    const t = searchParams.get("token") || "";
    const e = searchParams.get("email") || "";
    if (t && e) {
      setToken(t);
      setEmail(e);
      setStep("reset");
    }
  }, [searchParams]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !email) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, token, password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid or expired reset token.");
        return;
      }

      setSuccess("Password reset successful! You can now sign in with your new password.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
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
            Please check your email for the reset link, or enter your email below to request one.
          </p>
        </div>

        <div className="mb-6 p-3 rounded-lg text-sm" style={{ background: "#fffbeb", border: "1px solid #fdba74", color: "#92400e" }}>
          No valid reset token found in the URL. Please use the link from your reset email.
        </div>

        <form className="space-y-4">
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
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition-all"
            style={{ background: "var(--primary)" }}
          >
            Request reset link
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
          Set new password
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#57534e" }}>Enter your new password below.</p>
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

      <form onSubmit={handleResetSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            New password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-lg border px-4 py-3 text-sm pr-12 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
            style={{ color: "#57534e" }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Confirm new password
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-lg border px-4 py-3 text-sm pr-12 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
            style={{ color: "#57534e" }}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <section className="mx-auto w-full max-w-md px-6 py-12 sm:py-20">
        <p className="text-sm" style={{ color: "#57534e" }}>Loading…</p>
      </section>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
