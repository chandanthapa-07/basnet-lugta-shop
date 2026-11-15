"use client";

import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/app/store/StoreProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileMenu from "@/app/components/MobileMenu";

const NAV_ITEMS = [
  { label: "Shop", href: "/#shop" },
  { label: "Collections", href: "/#collections" },
  { label: "Our story", href: "/#our-story" },
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
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-3 rounded-2xl border px-3 sm:px-4 lg:px-6" style={{ borderColor: "var(--border)", background: "#f5f5f4" }}>
            <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3 shrink-0">
              <Image
                src="/basnet-logo.jpeg"
                alt="Basnet Lugta Shop logo"
                width={1152}
                height={768}
                preload
                className="h-9 w-[54px] rounded-md object-contain sm:h-10 sm:w-[60px]"
              />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm sm:text-base font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
                  Basnet Lugta Shop
                </div>
                <div className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
                  Buddhist Clothing
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 flex-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--foreground)" }}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
              <form onSubmit={handleSearch} className="hidden lg:flex items-center">
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted)" }}>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-44 xl:w-56 rounded-full border bg-white pl-9 pr-4 text-sm outline-none focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    aria-label="Search products"
                  />
                </div>
              </form>

              <button
                aria-label="Search"
                onClick={() => router.push("/search")}
                className="flex lg:hidden h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border bg-white"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>

              <button
                aria-label="Wishlist"
                onClick={() => router.push("/wishlist")}
                className="relative hidden sm:flex h-10 w-10 items-center justify-center rounded-full border bg-white"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
                {wishCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: "var(--primary)" }}>
                    {wishCount}
                  </span>
                )}
              </button>

              <button
                aria-label="Account"
                onClick={() => dispatch({ type: "OPEN_AUTH" })}
                className="hidden md:flex h-10 items-center justify-center rounded-full border bg-white px-4 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Account
              </button>

              <button
                aria-label="Shopping bag"
                onClick={() => dispatch({ type: "OPEN_BAG_DRAWER" })}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white"
                style={{ background: "var(--foreground)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2l1.5 4h9L18 2" />
                  <path d="M3 6h18l-1.5 14h-15z" />
                  <path d="M9 10a3 3 0 0 0 6 0" />
                </svg>
                {bagCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold" style={{ color: "var(--foreground)" }}>
                    {bagCount}
                  </span>
                )}
              </button>

              <button
                aria-label="Menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex md:hidden h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border bg-white"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
