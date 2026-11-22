import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin auth check is handled per-page via API calls
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full" style={{ background: "var(--primary)" }} />
              <span className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
                Basnet Admin
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/inventory/alerts"
                className="px-3 py-2 text-sm font-medium rounded-md text-white"
                style={{ background: "var(--primary)" }}
              >
                Stock Alerts
              </a>
              <a
                href="/admin/inventory"
                className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
              >
                Inventory
              </a>
              <a
                href="/"
                className="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900"
              >
                View Store
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
