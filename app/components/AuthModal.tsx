"use client";

import { useState } from "react";
import { useStore } from "../store/StoreProvider";

export default function AuthModal() {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.isAuthModalOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      localStorage.setItem("basnet-lugta-token", data.token);
      dispatch({ type: "CLOSE_AUTH" });
      if (state.pendingAction) state.pendingAction();
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
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Sign in to save favourites, add items to your bag and place orders.
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {mode === "signup" && (
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)" }}
          />
          {error && <p className="text-sm" style={{ color: "var(--primary)" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--primary)" }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in and continue" : "Create account and continue"}
          </button>
        </form>
        <p className="mt-4 text-center text-[10px] sm:text-xs" style={{ color: "#57534e" }}>
          Your customer account is separate from the private owner portal.
        </p>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-2 text-center text-sm font-medium"
          style={{ color: "var(--primary)" }}
        >
          {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}