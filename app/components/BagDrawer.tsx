"use client";

import { useEffect, useState } from "react";
import { useStore, formatNPR } from "@/app/store/StoreProvider";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";

export default function BagDrawer() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const { toast } = useToast();
  const open = state.isBagDrawerOpen;
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!open) setStep(1);
  }, [open]);

  const subtotal = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => dispatch({ type: "CLOSE_BAG_DRAWER" })}
        />
      )}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md transform flex-col bg-white shadow-xl transition-transform duration-300 sm:max-w-lg"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
              Your bag
            </h2>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {[1, 2, 3].map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <span
                    className={`h-1.5 w-6 rounded-full ${step >= s ? "" : "bg-black/10"}`}
                    style={step >= s ? { background: "var(--primary)" } : { background: "var(--border)" }}
                  />
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: step >= s ? "var(--foreground)" : "#57534e" }}>
                    {s === 1 ? "Bag" : s === 2 ? "Delivery" : "Complete"}
                  </span>
                  {s < 3 && <span className="text-black/20">|</span>}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => dispatch({ type: "CLOSE_BAG_DRAWER" })} className="text-2xl leading-none" style={{ color: "#57534e" }}>
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {state.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                Your bag is empty
              </p>
              <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
                Add some items to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {state.cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg"
                    style={{ borderRadius: 16 }}
                  >
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {item.name}
                    </div>
                    <div className="text-sm" style={{ color: "var(--primary)" }}>
                      {formatNPR(item.price)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => dispatch({ type: "CART_SET_QTY", payload: { id: item.id, quantity: item.quantity - 1 } })}
                        className="flex h-7 w-7 items-center justify-center rounded-full border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        &minus;
                      </button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => dispatch({ type: "CART_SET_QTY", payload: { id: item.id, quantity: item.quantity + 1 } })}
                        disabled={item.quantity >= item.stock}
                        className="flex h-7 w-7 items-center justify-center rounded-full border disabled:opacity-40"
                        style={{ borderColor: "var(--border)" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch({ type: "CART_REMOVE", payload: { id: item.id } })}
                    className="text-sm self-start"
                    style={{ color: "var(--primary)" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {state.cart.length > 0 && (
          <div className="border-t p-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#57534e" }}>Subtotal</span>
              <span className="text-lg font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
                {formatNPR(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-xs" style={{ color: "#57534e" }}>
              Cash on delivery &middot; Shipping confirmed by phone.
            </p>
            <button
              onClick={async () => {
                try {
                  // Check if user is authenticated via cookie
                  const res = await fetch("/api/me", { credentials: "include" });
                  if (!res.ok) {
                    toast({
                      title: "Sign in required",
                      description: "Please sign in to place an order.",
                      type: "warning",
                      duration: 4000,
                    });
                    dispatch({ type: "OPEN_AUTH" });
                    dispatch({ type: "CLOSE_BAG_DRAWER" });
                    return;
                  }
                  dispatch({ type: "CLOSE_BAG_DRAWER" });
                  router.push("/checkout");
                } catch {
                  toast({
                    title: "Error",
                    description: "Could not verify session. Please try again.",
                    type: "error",
                    duration: 4000,
                  });
                }
              }}
              className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              Proceed to checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
