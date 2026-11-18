"use client";

import { formatNPR } from "@/app/store/StoreProvider";
import { useStore } from "@/app/store/StoreProvider";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const { dispatch } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Cookie is sent automatically with credentials
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
          setUnauth(true);
          return;
        }
        setData(await res.json());
      } catch {
        setUnauth(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-sm" style={{ color: "#57534e" }}>Loading account details…</p>
      </section>
    );
  }

  if (unauth || !data) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            My account
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#57534e" }}>
            Sign in to view your profile and orders.
          </p>
          <button
            onClick={() => dispatch({ type: "OPEN_AUTH" })}
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  const { customer, orders } = data;

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    setUnauth(true);
    setData(null);
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            My account
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Manage your profile and orders
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <nav className="space-y-1">
            <Link href="/account" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium bg-black/5" style={{ color: "var(--foreground)" }}>
              Profile
            </Link>
            <Link href="/account/orders" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              My orders
            </Link>
          </nav>
        </aside>

        <div className="lg:col-span-3 border rounded-xl p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
          <h2 className="mb-6 text-lg font-bold" style={{ color: "var(--foreground)" }}>Profile</h2>
          <div className="space-y-4">
            <div className="flex gap-4"><span className="w-20 text-sm font-medium" style={{ color: "#57534e" }}>Name</span><span className="text-sm">{customer.name}</span></div>
            <div className="flex gap-4"><span className="w-20 text-sm font-medium" style={{ color: "#57534e" }}>Email</span><span className="text-sm">{customer.email}</span></div>
          </div>
        </div>
      </div>

      {orders?.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            Recent orders
          </h2>
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Order</th>
                  <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Date</th>
                  <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Status</th>
                  <th className="px-6 py-3 text-sm font-medium text-right" style={{ color: "#57534e" }}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-6 py-4"><Link href={`/order-confirmation/${o.id}`} className="text-sm font-medium" style={{ color: "var(--primary)" }}>{o.orderNumber}</Link></td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#57534e" }}>{new Date(o.createdAt ?? "").toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}</td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--foreground)" }}>{o.status}</td>
                    <td className="px-6 py-4 text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>{formatNPR(Number(o.subtotal ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
