import { getOrderById, formatNPR } from "@/app/lib/payload";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--primary)" }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
          Order confirmed!
        </h2>
        <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
          Your order <strong>{order.orderNumber}</strong> has been placed.
        </p>
      </div>

      <div className="mt-12 border rounded-xl p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
        <h3 className="mb-6 text-lg font-bold" style={{ color: "var(--foreground)" }}>
          Order details
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#57534e" }}>
              Order number
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {order.orderNumber}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#57534e" }}>
              Status
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              {order.status}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#57534e" }}>
              Payment status
            </p>
            <p className="text-sm font-medium" style={{ color: "#57534e" }}>
              {order.paymentStatus} · {order.paymentMethod}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#57534e" }}>
              Total
            </p>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
              {formatNPR(Number(order.subtotal ?? 0))}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "#57534e" }}>
            Items
          </h4>
          <div className="space-y-4">
            {(order.items ?? []).map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 border-b pb-4 last:border-none last:pb-0">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg" style={{ borderRadius: 12 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: "#e7dfd5" }} />
                  )}
                </div>
                <div className="flex-1 flex-col">
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {item.name}
                  </div>
                  <div className="text-sm" style={{ color: "#57534e" }}>
                    {formatNPR(Number(item.price ?? 0))} × {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#57534e" }}>
            Shipping to
          </p>
          <div className="mt-2 text-sm" style={{ color: "var(--foreground)" }}>
            {order.shipping?.name}<br />
            {order.shipping?.address}<br />
            {order.shipping?.district}<br />
            {order.shipping?.phone}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-colors hover:bg-black/5"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          View my orders
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          Continue shopping
        </Link>
      </div>
    </section>
  );
}