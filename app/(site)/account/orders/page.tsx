"use client";

import { formatNPR } from "@/app/store/StoreProvider";
import { useStore } from "@/app/store/StoreProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountOrdersPage() {
  const { dispatch } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) { setUnauth(true); return; }
        setData(await res.json());
      } catch { setUnauth(true); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12"><p className="text-sm" style={{ color: "#57534e" }}>Loading orders…</p></section>;

  if (unauth || !data) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>My orders</h1>
        <p className="mt-2 text-sm" style={{ color: "#57534e" }}>Sign in to view your orders.</p>
        <button onClick={() => dispatch({ type: "OPEN_AUTH" })} className="mt-6 rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>Sign in</button>
      </section>
    );
  }

  const orders = data.orders || [];

  const handleSignOut = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    setUnauth(true);
    setData(null);
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>My orders</h1>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>Track your purchases and order history.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/account" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>← Back to profile</Link>
          <button onClick={handleSignOut} className="rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Sign out</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>No orders yet</p>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>Start shopping to place your first order.</p>
          <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>Start shopping</Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Order</th>
                <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Date</th>
                <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Status</th>
                <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Payment</th>
                <th className="px-6 py-3 text-sm font-medium text-right" style={{ color: "#57534e" }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-6 py-4"><Link href={`/order-confirmation/${o.id}`} className="text-sm font-medium" style={{ color: "var(--primary)" }}>{o.orderNumber}</Link></td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#57534e" }}>{new Date(o.createdAt ?? "").toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--foreground)" }}>{o.status}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#57534e" }}>{o.paymentStatus}</td>
                  <td className="px-6 py-4 text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>{formatNPR(Number(o.subtotal ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
