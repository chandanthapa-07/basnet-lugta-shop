"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/app/store/StoreProvider";

export default function LoginPage() {
  const { dispatch } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      setSuccess("Sign in successful!");
      dispatch({
        type: "SET_USER",
        payload: {
          user: {
            id: data.user?.id || "",
            name: data.user?.name || "",
            email,
            role: "customer",
          },
          isAuthenticated: true,
        },
      });
      router.push("/");
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
          Welcome back
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#57534e" }}>
          Sign in to your account to save favourites, add items to your bag and place orders.
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

        <div className="relative">
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm" style={{ color: "#57534e" }}>
            <input type="checkbox" className="rounded border-[var(--border)]" /> Remember me
          </label>
          <Link href="/forgot-password" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "#57534e" }}>
        Don't have an account?{" "}
        <Link href="/register" className="font-medium" style={{ color: "var(--primary)" }}>
          Create an account
        </Link>
      </p>
    </section>
  );
}