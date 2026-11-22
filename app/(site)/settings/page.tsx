"use client";

import { useStore } from "@/app/store/StoreProvider";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/app/components/Toast";

interface Address {
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
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
}

export default function SettingsPage() {
  const { dispatch } = useStore();
  const { toast } = useToast();
  const [data, setData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauth, setUnauth] = useState(false);

  const [editProfile, setEditProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressMode, setAddressMode] = useState<"add" | "edit">("add");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrMunicipality, setAddrMunicipality] = useState("");
  const [addrWard, setAddrWard] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrHouse, setAddrHouse] = useState("");
  const [addrInstructions, setAddrInstructions] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) { setUnauth(true); return; }
      const json = await res.json();
      setData(json.customer);
    } catch { setUnauth(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSignOut = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    dispatch({ type: "SET_USER", payload: { user: null, isAuthenticated: false } });
    setUnauth(true);
    setData(null);
  };

  const openProfileEdit = () => {
    if (!data) return;
    setProfileName(data.name);
    setProfileEmail(data.email);
    setProfilePhone(data.phone);
    setProfileError(null);
    setEditProfile(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: profileName.trim() || undefined,
          email: profileEmail.trim() || undefined,
          phone: profilePhone.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setProfileError(json.error || "Failed to update profile"); return; }
      setEditProfile(false);
      toast({ title: "Profile updated", type: "success" });
      fetchData();
    } catch { setProfileError("Network error. Please try again."); }
    finally { setProfileLoading(false); }
  };

  const openAddAddress = () => {
    setAddressMode("add");
    setEditingAddress(null);
    setAddrLabel("Home");
    setAddrRecipient("");
    setAddrPhone("");
    setAddrProvince("");
    setAddrDistrict("");
    setAddrMunicipality("");
    setAddrWard("");
    setAddrStreet("");
    setAddrHouse("");
    setAddrInstructions("");
    setAddrIsDefault(false);
    setAddressError(null);
    setAddressFormOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setAddressMode("edit");
    setEditingAddress(addr);
    setAddrLabel(addr.label);
    setAddrRecipient(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrProvince(addr.province);
    setAddrDistrict(addr.district);
    setAddrMunicipality(addr.municipality);
    setAddrWard(addr.wardNumber);
    setAddrStreet(addr.streetTole);
    setAddrHouse(addr.houseLandmark || "");
    setAddrInstructions(addr.deliveryInstructions || "");
    setAddrIsDefault(addr.isDefault);
    setAddressError(null);
    setAddressFormOpen(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);
    setAddressLoading(true);

    const body: any = {
      label: addrLabel,
      recipient_name: addrRecipient,
      phone: addrPhone,
      province: addrProvince,
      district: addrDistrict,
      municipality: addrMunicipality,
      ward_number: addrWard,
      street_tole: addrStreet,
      house_landmark: addrHouse || null,
      delivery_instructions: addrInstructions || null,
      is_default: addrIsDefault,
    };

    try {
      let res: Response;
      if (addressMode === "add") {
        res = await fetch("/api/customer/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
      } else {
        if (!editingAddress) return;
        res = await fetch(`/api/customer/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (!res.ok) { setAddressError(json.error || "Failed to save address"); return; }
      setAddressFormOpen(false);
      toast({ title: "Address saved", type: "success" });
      fetchData();
    } catch { setAddressError("Network error. Please try again."); }
    finally { setAddressLoading(false); }
  };

  const deleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast({ title: "Address deleted", type: "success" });
        fetchData();
      }
    } catch { toast({ title: "Error", description: "Failed to delete address", type: "error" }); }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      const res = await fetch(`/api/customer/addresses/${id}/default`, { method: "POST", credentials: "include" });
      if (res.ok) {
        toast({ title: "Default address updated", type: "success" });
        fetchData();
      }
    } catch { toast({ title: "Error", description: "Failed to set default address", type: "error" }); }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
        <p className="text-sm" style={{ color: "#57534e" }}>Loading settings…</p>
      </section>
    );
  }

  if (unauth || !data) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            Settings
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#57534e" }}>Sign in to manage your account.</p>
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

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            Settings
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>Manage your profile and delivery addresses.</p>
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
            <Link href="/account" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Profile
            </Link>
            <Link href="/settings" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium bg-black/5" style={{ color: "var(--foreground)" }}>
              Settings
            </Link>
            <Link href="/account/orders" className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              My orders
            </Link>
          </nav>
        </aside>

        <div className="lg:col-span-3 border rounded-xl p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
          <div className="mb-10">
            <h2 className="mb-6 text-lg font-bold" style={{ color: "var(--foreground)" }}>Personal Information</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <span className="w-24 text-sm font-medium" style={{ color: "#57534e" }}>Full name</span>
                <span className="text-sm">{data.name}</span>
                <button onClick={openProfileEdit} className="text-xs font-medium" style={{ color: "var(--primary)" }}>Edit</button>
              </div>
              <div className="flex gap-4 items-center">
                <span className="w-24 text-sm font-medium" style={{ color: "#57534e" }}>Email</span>
                <span className="text-sm">{data.email}</span>
                <button onClick={openProfileEdit} className="text-xs font-medium" style={{ color: "var(--primary)" }}>Edit</button>
              </div>
              <div className="flex gap-4 items-center">
                <span className="w-24 text-sm font-medium" style={{ color: "#57534e" }}>Phone</span>
                <span className="text-sm">{data.phone || "Not provided"}</span>
                <button onClick={openProfileEdit} className="text-xs font-medium" style={{ color: "var(--primary)" }}>Edit</button>
              </div>
            </div>

            {editProfile && (
              <div className="mt-6 border rounded-xl p-6 sm:p-8" style={{ borderColor: "var(--border)" }}>
                <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>Edit Profile</h3>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Full name</label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Email address</label>
                    <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Phone number</label>
                    <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  {profileError && (
                    <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: "#fdecea", borderColor: "var(--primary)", color: "var(--primary)" }}>{profileError}</div>
                  )}
                  <button type="submit" disabled={profileLoading} className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--primary)" }}>
                    {profileLoading ? "Saving…" : "Save changes"}
                  </button>
                  <button type="button" onClick={() => setEditProfile(false)} className="mt-3 text-sm font-medium" style={{ color: "#57534e" }}>Cancel</button>
                </form>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Delivery Addresses</h2>
              <button onClick={openAddAddress} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
                <span>+</span> Add address
              </button>
            </div>

            {data.addresses.length === 0 ? (
              <p className="text-sm" style={{ color: "#57534e" }}>No saved addresses. Add one to speed up checkout.</p>
            ) : (
              <div className="space-y-3">
                {data.addresses.map((addr) => (
                  <div key={addr.id} className="border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: "var(--border)" }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: "#f5f5f4", color: "var(--primary)" }}>{addr.label}</span>
                        {addr.isDefault && <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>Default</span>}
                      </div>
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{addr.recipientName}</div>
                      <div className="mt-1 text-sm" style={{ color: "#57534e" }}>
                        {addr.streetTole}, Ward {addr.wardNumber}, {addr.municipality}, {addr.district}, {addr.province}
                        {addr.houseLandmark && ` (${addr.houseLandmark})`}
                      </div>
                      <div className="mt-1 text-sm" style={{ color: "#57534e" }}>Phone: {addr.phone}</div>
                      {addr.deliveryInstructions && (<div className="mt-1 text-xs" style={{ color: "#57534e" }}>Notes: {addr.deliveryInstructions}</div>)}
                    </div>
                    <div className="flex items-center gap-2">
                      {addr.isDefault ? (
                        <span className="text-xs font-medium" style={{ color: "#57534e" }}>Default</span>
                      ) : (
                        <button onClick={() => setDefaultAddress(addr.id)} className="text-xs font-medium" style={{ color: "var(--primary)" }}>Set as default</button>
                      )}
                      <button onClick={() => openEditAddress(addr)} className="text-xs font-medium" style={{ color: "var(--primary)" }}>Edit</button>
                      <button onClick={() => deleteAddress(addr.id)} className="text-xs font-medium" style={{ color: "#ef4444" }}>Delete</button>
                    </div>
                  </div>
                ))}

              </div>
            )}
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setAddressFormOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-xl"
                style={{ background: "#fffdf9", borderRadius: 24 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="mb-6 text-lg font-bold" style={{ color: "var(--foreground)" }}>{addressMode === "add" ? "Add Delivery Address" : "Edit Address"}</h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Address label</label>
                    <select value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Recipient name</label>
                    <input type="text" value={addrRecipient} onChange={(e) => setAddrRecipient(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Phone</label>
                    <input type="tel" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Province</label>
                    <input type="text" value={addrProvince} onChange={(e) => setAddrProvince(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>District</label>
                    <input type="text" value={addrDistrict} onChange={(e) => setAddrDistrict(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Municipality / City</label>
                    <input type="text" value={addrMunicipality} onChange={(e) => setAddrMunicipality(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Ward number</label>
                    <input type="text" value={addrWard} onChange={(e) => setAddrWard(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Street / Tole</label>
                    <input type="text" value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} required className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>House number / Landmark (optional)</label>
                    <input type="text" value={addrHouse} onChange={(e) => setAddrHouse(e.target.value)} placeholder="e.g. House 45, near temple" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Delivery instructions (optional)</label>
                    <textarea value={addrInstructions} onChange={(e) => setAddrInstructions(e.target.value)} rows={2} placeholder="e.g. Call before arriving" className="w-full rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={addrIsDefault} onChange={(e) => setAddrIsDefault(e.target.checked)} className="rounded border-[var(--border)]" />
                    <label className="text-sm" style={{ color: "#57534e" }}>Set as default address</label>
                  </div>
                  {addressError && (
                    <div className="rounded-lg border px-4 py-3 text-sm" style={{ background: "#fdecea", borderColor: "var(--primary)", color: "var(--primary)" }}>{addressError}</div>
                  )}
                  <button type="submit" disabled={addressLoading} className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--primary)" }}>
                    {addressLoading ? "Saving…" : "Save address"}
                  </button>
                  <button type="button" onClick={() => setAddressFormOpen(false)} className="mt-3 w-full text-sm font-medium" style={{ color: "#57534e" }}>Cancel</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}