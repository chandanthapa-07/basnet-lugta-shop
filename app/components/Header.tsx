"use client";

import Link from "next/link";
import { useStore } from "@/app/store/StoreProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileMenu from "@/app/components/MobileMenu";

const NAV_ITEMS = [
  { label: "Shop", href: "#shop" },
  { label: "Collections", href: "#collections" },
  { label: "Our story", href: "#our-story" },
];

export default function Header() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const bagCount = state.cart.reduce((s, i) => s + i.quantity, 0);
  const wishCount = state.wishlist.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur"
      style={{ borderColor: "var(--border)", background: "rgba(250,250,249,0.92)" }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6" style={{ height: 80 }}>
        <div className="flex h-full items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 64, height: 56, background: "var(--primary)" }}
            >
              <span className="text-white text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                B
              </span>
            </div>
            <div className="leading-tight">
              <div
                className="text-base font-bold tracking-tight"
                style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}
              >
                Basnet Lugta Shop
              </div>
              <div
                className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] sm:block"
                style={{ color: "var(--primary)" }}
              >
                BUDDHIST CLOTHING
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--foreground)" }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--foreground)" }}
            >
              Saved ({wishCount})
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full border pl-10 pr-4 py-2 text-sm w-64"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "#57534e" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </form>
            <button
              aria-label="Wishlist"
              onClick={() => router.push("/wishlist")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border"
              style={{ borderColor: "var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--foreground)" }}>
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
              {wishCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: "var(--primary)" }}
                >
                  {wishCount}
                </span>
              )}
            </button>
            <button
              aria-label="Account"
              onClick={() => dispatch({ type: "OPEN_AUTH" })}
              className="hidden h-10 items-center justify-center rounded-full border px-4 text-sm font-medium md:flex"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Account
            </button>
            <button
              aria-label="Search"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border sm:hidden"
              style={{ borderColor: "var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--foreground)" }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <button
              aria-label="Shopping bag"
              onClick={() => dispatch({ type: "OPEN_BAG_DRAWER" })}
              className="relative flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "var(--foreground)", color: "#fff" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6h15l-1.5 9.7a2 2 0 0 1-2 1.6H8a2 2 0 0 1-2-1.6L3 6H0" />
                <path d="M6 6 5 3H2" />
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold" style={{ color: "var(--foreground)" }}>
                {bagCount}
              </span>
            </button>
            <button
              aria-label="Menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border md:hidden"
              style={{ borderColor: "var(--border)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--foreground)" }}>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}