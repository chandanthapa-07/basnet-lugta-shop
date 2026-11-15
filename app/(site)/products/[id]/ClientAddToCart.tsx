"use client";

import { useState, useCallback } from "react";
import { useStore } from "@/app/store/StoreProvider";

export default function ClientAddToCart({
  productId,
  name,
  price,
  stock,
  image,
}: {
  productId: string;
  name: string;
  price: number;
  stock: number;
  image: string;
}) {
  const { state, dispatch } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const existing = state.cart.find((i) => i.id === productId);
  const inCart = !!existing;
  const cartQty = existing?.quantity ?? 0;

  const handleAdd = useCallback(() => {
    dispatch({
      type: "CART_ADD",
      payload: {
        product: {
          id: productId,
          name,
          price,
          stock,
          image,
          visible: true,
          featured: false,
        } as any,
        quantity,
      },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [dispatch, productId, name, price, stock, image, quantity]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-xs sm:text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Quantity
        </label>
        <div className="flex items-center gap-2 rounded-lg border" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}
          >
            −
          </button>
          <span className="w-6 text-center text-xs sm:text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock || stock === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-40"
            style={{ borderColor: "var(--border)" }}
          >
            +
          </button>
        </div>
        {stock === 0 && (
          <span className="text-[10px] sm:text-xs font-medium" style={{ color: "var(--primary)" }}>
            Out of stock
          </span>
        )}
      </div>
      <button
        onClick={handleAdd}
        disabled={stock === 0 || inCart}
        className={`w-full rounded-full py-3 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          inCart || stock === 0
            ? "bg-black/10 text-black/30"
            : "bg-[var(--primary)] text-white hover:opacity-90"
        }`}
        style={
          inCart || stock === 0
            ? { background: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.3)" }
            : { background: "var(--primary)" }
        }
      >
        {added ? "Added to bag ✓" : inCart ? "Already in bag" : "Add to bag"}
      </button>
      {inCart && (
        <p className="text-[10px] sm:text-xs text-center" style={{ color: "#57534e" }}>
          View your bag to complete checkout
        </p>
      )}
    </div>
  );
}