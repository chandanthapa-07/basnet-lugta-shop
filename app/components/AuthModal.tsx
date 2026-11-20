"use client";

import { useState } from "react";
import { useStore } from "@/app/store/StoreProvider";
import { useRouter } from "next/navigation";

export default function AuthModal() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!state.isAuthModalOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "signup") {
      if (!name || name.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
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
    }

    if (mode === "signin") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }
    }

    if (mode === "forgot") {
      if (!email) {
        setError("Email is required.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "forgot" ? "/api/auth/forgot-password" : "/api/auth";
      const body = mode === "signup" 
        ? { email, password, name, confirmPassword }
        : mode === "forgot"
        ? { email }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      if (mode === "forgot") {
        setSuccess("If an account exists, a password reset link has been sent.");
        setTimeout(() => setMode("signin"), 3000);
        return;
      }

      // Login or signup successful - token is in HttpOnly cookie
      dispatch({ type: "CLOSE_AUTH" });
      if (state.pendingAction) state.pendingAction();
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => dispatch({ type: "CLOSE_AUTH" })}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-xl"
        style={{ background: "#fffdf9", borderRadius: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}
          >
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            {mode === "forgot" 
              ? "Enter your email to receive a password reset link."
              : mode === "signup"
              ? "Create an account to save favourites, add items to your bag and place orders."
              : "Sign in to save favourites, add items to your bag and place orders."}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode !== "forgot" && mode === "signup" && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)" }}
          />

          {(mode === "signin" || mode === "signup") && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          )}

          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          )}

          {error && <p className="text-sm" style={{ color: "var(--primary)" }}>{error}</p>}
          {success && <p className="text-sm" style={{ color: "#10b981" }}>{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading 
              ? "Please wait…" 
              : mode === "signin" 
              ? "Sign in and continue" 
              : mode === "signup" 
              ? "Create account and continue"
              : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] sm:text-xs" style={{ color: "#57534e" }}>
          Your customer account is separate from the private owner portal.
        </p>

        <div className="mt-6 space-y-4 text-center">
          {mode !== "forgot" && (
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setSuccess(null); }}
              className="text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          )}
          <button
            onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setError(null); setSuccess(null); }}
            className="text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
          </button>
        </div>
      </div>
    </div>
  );
}
