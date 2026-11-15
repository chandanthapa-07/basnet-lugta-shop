"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/app/store/StoreProvider";
import { useRouter } from "next/navigation";

export default function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { state } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bagCount = state.cart.reduce((s, i) => s + i.quantity, 0);
  const wishCount = state.wishlist.length;

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col bg-white/95 backdrop-blur-sm ${isOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out sm:hidden`}
      style={{ left: 0, top: 0 }}
    >
      <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={onClose}
        >
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 48, height: 48, background: "var(--primary)" }}
          >
            <span className="text-white text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
              B
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
              Basnet Lugta Shop
            </div>
          </div>
        </Link>
        <button onClick={onClose} className="text-2xl leading-none" style={{ color: "#57534e" }}>
          &times;
        </button>
      </div>

      <nav className="flex-1 px-6 py-6 space-y-2">
        <Link
          href="/"
          className="block px-4 py-3 rounded-xl font-medium hover:bg-black/5"
          onClick={onClose}
          style={{ color: "var(--foreground)" }}
        >
          Home
        </Link>
        <Link
          href="#shop"
          className="block px-4 py-3 rounded-xl font-medium hover:bg-black/5"
          onClick={onClose}
          style={{ color: "var(--foreground)" }}
        >
          Shop
        </Link>
        <Link
          href="#collections"
          className="block px-4 py-3 rounded-xl font-medium hover:bg-black/5"
          onClick={onClose}
          style={{ color: "var(--foreground)" }}
        >
          Collections
        </Link>
        <Link
          href="#our-story"
          className="block px-4 py-3 rounded-xl font-medium hover:bg-black/5"
          onClick={onClose}
          style={{ color: "var(--foreground)" }}
        >
          Our Story
        </Link>
        <Link
          href="/wishlist"
          className="block px-4 py-3 rounded-xl font-medium hover:bg-black/5"
          onClick={onClose}
          style={{ color: "var(--foreground)" }}
        >
          Saved ({wishCount})
        </Link>
        <Link
          href="/account"
          className="block px-4 py-3 rounded-xl font-medium hover:bg-black/5"
          onClick={onClose}
          style={{ color: "var(--foreground)" }}
        >
          My Account
        </Link>
      </nav>

      <div className="border-t p-6" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => { onClose(); router.push("/checkout"); }}
          className="w-full rounded-full py-3 text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          View Bag ({bagCount})
        </button>
      </div>

      <div className="px-6 py-4 text-xs text-center" style={{ color: "#57534e" }}>
        &copy; 2026 Basnet Lugta Shop &middot; Kathmandu, Nepal.
      </div>
    </div>
  );
}