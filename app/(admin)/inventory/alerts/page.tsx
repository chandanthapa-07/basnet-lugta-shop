"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/app/components/Toast";

interface StockAlert {
  id: string;
  product_id: number;
  alert_type: string;
  message: string;
  isRead: boolean;
  created_at: string;
  product_name: string;
  product_sku: string | null;
  current_stock: number;
}

export default function InventoryAlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(
        `/api/inventory/alerts?unreadOnly=${unreadOnly}&limit=100`,
        {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          toast({ title: "Unauthorized", description: "Admin login required", type: "error" });
        }
        return;
      }
      const data = await res.json();
      setAlerts(data.alerts || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      toast({ title: "Error", description: "Failed to load alerts", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [unreadOnly]);

  const markRead = async (alertId: string) => {
    try {
      const res = await fetch("/api/inventory/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-alert-action": "mark_read",
        },
        body: JSON.stringify({ alertId }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Marked as read", type: "success" });
        fetchAlerts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to mark alert as read", type: "error" });
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch("/api/inventory/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-alert-action": "mark_all_read",
        },
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "All alerts marked as read", type: "success" });
        fetchAlerts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to mark all alerts as read", type: "error" });
    }
  };

  const generateAlerts = async () => {
    try {
      const res = await fetch("/api/inventory/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-alert-action": "generate",
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Alerts generated",
          description: `${data.lowStockCount} low stock, ${data.outOfStockCount} out of stock`,
          type: "success",
        });
        fetchAlerts();
      }
    } catch {
      toast({ title: "Error", description: "Failed to generate alerts", type: "error" });
    }
  };

  const typeColor = (type: string) => {
    if (type === "out_of_stock") return "bg-red-100 text-red-700";
    return "bg-orange-100 text-orange-700";
  };

  const typeLabel = (type: string) => {
    if (type === "out_of_stock") return "Out of Stock";
    return "Low Stock";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">Loading alerts…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            Stock Alerts
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Monitor low-stock and out-of-stock products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generateAlerts}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={loading}
              className="rounded-md border px-3 py-2 text-sm font-medium"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#57534e" }}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary"
          />
          Unread only
        </label>
        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {unreadCount} unread
        </span>
      </div>

      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Product</th>
              <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Type</th>
              <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Current Stock</th>
              <th className="px-6 py-3 text-sm font-medium" style={{ color: "#57534e" }}>Message</th>
              <th className="px-6 py-3 text-sm font-medium text-right" style={{ color: "#57534e" }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm" style={{ color: "#57534e" }}>
                    {unreadOnly ? "No unread alerts" : "No stock alerts"}
                  </p>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`border-b last:border-0 ${!alert.isRead ? "bg-orange-50" : ""}`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium" style={{ color: "var(--foreground)" }}>
                      {alert.product_name}
                    </div>
                    {alert.product_sku && (
                      <div className="text-xs" style={{ color: "#57534e" }}>
                        SKU: {alert.product_sku}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor(alert.alert_type)}`}>
                      {typeLabel(alert.alert_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>
                      {alert.current_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4" style={{ color: "#57534e" }}>
                    {alert.message}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!alert.isRead && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
