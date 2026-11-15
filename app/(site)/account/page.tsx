import { getCustomerByEmail, getCustomerOrders, formatNPR } from "@/app/lib/payload";
import { headers } from "next/headers";
import { getPayload } from "payload";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function getCurrentCustomer() {
  const headerList = await headers();
  const auth = headerList.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload;
  } catch {
    return null;
  }
}

async function AccountContent() {
  const user = await getCurrentCustomer();
  if (!user) {
    notFound();
  }

  const customer = await getCustomerByEmail(user.email);
  if (!customer) {
    notFound();
  }

  const orders = await getCustomerOrders(customer.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <nav className="space-y-1">
          <Link
            href="/account"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium bg-black/5"
            style={{ color: "var(--foreground)" }}
          >
            <span className="text-[14px]">👤</span>
            Profile
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            <span className="text-[14px]">📦</span>
            My orders
          </Link>
        </nav>
      </aside>

      <div className="lg:col-span-3 border rounded-xl p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
        <h2 className="mb-6 text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Profile
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="w-20 text-sm font-medium" style={{ color: "#57534e" }}>
              Name
            </span>
            <span className="text-sm">{customer.name}</span>
          </div>
          <div className="flex gap-4">
            <span className="w-20 text-sm font-medium" style={{ color: "#57534e" }}>
              Email
            </span>
            <span className="text-sm">{customer.email}</span>
          </div>
        </div>
      </div>

      {orders.length > 0 && (
        <section className="mt-12 lg:col-span-4">
          <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            My orders
          </h2>
          <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>
                    Order number
                  </th>
                  <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>
                    Date
                  </th>
                  <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-right" style={{ color: "#57534e" }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-6 py-4">
                      <Link
                        href={`/order-confirmation/${o.id}`}
                        className="text-sm font-medium"
                        style={{ color: "var(--primary)" }}
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#57534e" }}>
                      {new Date(o.createdAt ?? "").toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--foreground)" }}>
                      {o.status}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right" style={{ color: "var(--foreground)" }}>
                      {formatNPR(Number(o.subtotal ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default function AccountPage() {
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
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: "#57534e" }}>Loading account details...</p>
        </div>
      }>
        <AccountContent />
      </Suspense>
    </section>
  );
}