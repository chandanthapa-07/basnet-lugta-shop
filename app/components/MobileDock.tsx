"use client";

import { useStore } from "../store/StoreProvider";
import { useRouter } from "next/navigation";

export default function MobileDock() {
  const { state } = useStore();
  const router = useRouter();
  const bagCount = state.cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav
      className="fixed z-40 flex items-center justify-around rounded-2xl border bg-white/90 backdrop-blur sm:hidden"
      style={{
        left: "max(12px, env(safe-area-inset-left))",
        right: "max(12px, env(safe-area-inset-right))",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        height: 64,
        borderRadius: 24,
        borderColor: "var(--border)",
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      }}
    >
      <button className="flex flex-col items-center gap-1 text-xs" style={{ color: "#57534e" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </button>
      <button className="flex flex-col items-center gap-1 text-xs" style={{ color: "#57534e" }} onClick={() => router.push("/wishlist")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        Saved
      </button>
      <button className="relative flex flex-col items-center gap-1 text-xs" style={{ color: "var(--foreground)" }} onClick={() => router.push("/checkout")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6h15l-1.5 9.7a2 2 0 0 1-2 1.6H8a2 2 0 0 1-2-1.6L3 6H0" />
        </svg>
        Bag
        {bagCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            {bagCount}
          </span>
        )}
      </button>
    </nav>
  );
}