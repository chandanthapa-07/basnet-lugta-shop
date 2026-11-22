"use client";

import { useStore, formatNPR } from "@/app/store/StoreProvider";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/Toast";

interface SavedAddress {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  wardNumber: string;
  streetTole: string;
  houseLandmark: string | null;
  deliveryInstructions: string | null;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [note, setNote] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [streetTole, setStreetTole] = useState("");
  const [addressLabel, setAddressLabel] = useState<"Home" | "Office" | "Other">("Home");

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);

  const subtotal = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setSavedAddresses(json.customer?.addresses || []);
        const defaultAddr = json.customer?.addresses?.find((a: any) => a.isDefault);
        if (defaultAddr && !selectedAddressId) {
          setSelectedAddressId(defaultAddr.id);
          setName(defaultAddr.recipientName);
          setPhone(defaultAddr.phone);
          setDistrict(defaultAddr.district);
          setAddress(`${defaultAddr.streetTole}, Ward ${defaultAddr.wardNumber}, ${defaultAddr.municipality}, ${defaultAddr.province}${defaultAddr.houseLandmark ? `, ${defaultAddr.houseLandmark}` : ""}`);
          setEmail(defaultAddr.phone ? "" : "");
        }
      }
    } catch {}
    finally { setAddressesLoading(false); }
  }, [selectedAddressId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const selectAddress = (id: number) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setName(addr.recipientName);
      setPhone(addr.phone);
      setDistrict(addr.district);
      setProvince(addr.province);
      setMunicipality(addr.municipality);
      setWardNumber(addr.wardNumber);
      setStreetTole(addr.streetTole);
      setAddressLabel(addr.label as "Home" | "Office" | "Other");
      setAddress(`${addr.streetTole}, Ward ${addr.wardNumber}, ${addr.municipality}, ${addr.province}${addr.houseLandmark ? `, ${addr.houseLandmark}` : ""}`);
      setEmail("");
      setShowAddressForm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (submitting) return;

    if (!name || !phone || !address) {
      setError("Name, phone, and address are required.");
      return;
    }

    setSubmitting(true);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: state.cart.map((item) => ({
            product: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          subtotal,
          shipping: {
            name,
            phone,
            district,
            email,
            address,
            landmark,
            note,
            province,
            municipality,
            ward_number: wardNumber,
            street_tole: streetTole,
          },
          saveAddress: saveAddress && !selectedAddressId,
          addressLabel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to place order.");
        return;
      }

      setOrderId(String(data.orderId));
      setOrderNumber(data.orderNumber);
      setSuccess(true);
      setStep(3);
      dispatch({ type: "CART_CLEAR" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (state.cart.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#57534e" }}>
              <path d="M6 6h15l-1.5 9.7a2 2 0 0 1-2 1.6H8a2 2 0 0 1-2-1.6L3 6H0" />
              <path d="M6 6 5 3H2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Your bag is empty
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Add some items before checking out.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Start shopping
          </Link>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-16 sm:py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#10b981" }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Order placed successfully!
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Thank you for your purchase. Your order <strong>{orderNumber}</strong> has been confirmed.
          </p>
          {orderId && (
            <Link
              href={`/order-confirmation/${orderId}`}
              className="mt-4 inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              View order details
            </Link>
          )}
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        <div className="flex-1 lg:w-2/3">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
              Checkout
            </h2>
            <div className="flex items-center gap-1 text-xs">
              {[1, 2, 3].map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <span
                    className={`h-1.5 w-6 rounded-full ${step >= s ? "" : "bg-black/10"}`}
                    style={step >= s ? { background: "var(--primary)" } : { background: "var(--border)" }}
                  />
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: step >= s ? "var(--foreground)" : "#57534e" }}>
                    {s === 1 ? "Details" : s === 2 ? "Review" : "Complete"}
                  </span>
                  {s < 3 && <span className="text-black/20">|</span>}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Full address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Landmark (optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Order note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: "#fdecea", borderColor: "var(--primary)", color: "var(--primary)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-60"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {loading ? "Placing order…" : "Place order"}
            </button>
            <p className="mt-2 text-xs text-center" style={{ color: "#57534e" }}>
              Cash on delivery &middot; Shipping confirmed by phone.
            </p>
          </form>
        </div>

        <div className="lg:w-1/3">
          <div className="border rounded-xl p-4 sm:p-6" style={{ borderColor: "var(--border)" }}>
            <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Order summary
            </h3>
            <div className="space-y-4">
              {state.cart.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg" style={{ borderRadius: 12 }}>
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex-col">
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {item.name}
                    </div>
                    <div className="text-sm" style={{ color: "var(--primary)" }}>
                      {formatNPR(item.price)} &times; {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Subtotal
                </span>
                <span className="text-lg font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
                  {formatNPR(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#57534e" }}>
                  Shipping
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Calculated by phone
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
