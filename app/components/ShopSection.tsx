"use client";

import Link from "next/link";
import { useStore } from "@/app/store/StoreProvider";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/app/components/Toast";

const CATEGORIES = [
  "All clothing",
  "Robes",
  "Shawls & Wraps",
  "Meditation Wear",
  "Accessories",
];

function productImageUrl(product: any): string {
  const img = product?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.sizes?.card?.url) return img.sizes.card.url;
  if (img.sizes?.thumbnail?.url) return img.sizes.thumbnail.url;
  return img.url ?? "";
}

export default function ShopSection({ products }: { products: any[] }) {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState(state.activeCategory || "All clothing");
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    setActiveCategory(state.activeCategory || "All clothing");
  }, [state.activeCategory]);

  useEffect(() => {
    if (activeCategory === "All clothing") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.category === activeCategory));
    }
  }, [activeCategory, products]);

  const handleCategory = (c: string) => {
    setActiveCategory(c);
    dispatch({ type: "SET_CATEGORY", payload: c });
  };

  const handleAddToCart = useCallback(
    (product: any) => {
      dispatch({
        type: "CART_ADD",
        payload: {
          product: {
            id: String(product.id),
            name: product.name,
            price: Number(product.price ?? 0),
            stock: Number(product.stock ?? 0),
            category: product.category,
            image: productImageUrl(product),
            visible: product.visible,
            featured: product.featured,
          },
          quantity: 1,
        },
      });
      toast({
        title: "Added to bag",
        description: `${product.name} has been added to your shopping bag.`,
        type: "success",
        duration: 3000,
      });
    },
    [dispatch, toast]
  );

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent, id: string, name: string) => {
      e.preventDefault();
      e.stopPropagation();
      const isWishlisted = state.wishlist.includes(id);
      dispatch({ type: "WISHLIST_TOGGLE", payload: { id } });
      toast({
        title: isWishlisted ? "Removed from saved" : "Saved",
        description: isWishlisted ? `${name} removed from saved items.` : `${name} saved for later.`,
        type: "info",
        duration: 2500,
      });
    },
    [dispatch, state.wishlist, toast]
  );

  return (
    <section id="shop" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
            CLOTHING &amp; PRACTICE WEAR
          </p>
          <h2
            className="mt-2 text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            Made with intention.
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c;
            return (
              <button
                key={c}
                onClick={() => handleCategory(c)}
                className="rounded-full border px-4 py-2 text-xs sm:text-sm font-medium transition-colors"
                style={{
                  borderColor: active ? "var(--foreground)" : "var(--border)",
                  background: active ? "var(--foreground)" : "#fff",
                  color: active ? "#fff" : "var(--foreground)",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-10 sm:mt-12 flex flex-col items-center justify-center rounded-2xl border py-16 sm:py-20 text-center" style={{ borderColor: "var(--border)", background: "#fafaf9" }}>
          <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            No products available
          </p>
          <p className="mt-2 max-w-md px-4 text-sm leading-6" style={{ color: "var(--muted)" }}>
            {products.length === 0
              ? "The collection is being prepared. Please check back soon or add products from the owner dashboard."
              : "No items in this category yet. Try another filter."}
          </p>
        </div>
      ) : (
        <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={state.wishlist.includes(String(p.id))}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductCard({
  product,
  onAddToCart,
  onWishlistToggle,
  isWishlisted,
}: {
  product: any;
  onAddToCart: (product: any) => void;
  onWishlistToggle: (e: React.MouseEvent, id: string, name: string) => void;
  isWishlisted: boolean;
}) {
  const url = productImageUrl(product);
  const alt = product?.image?.alt || product?.name || "";
  const price = Number(product?.price ?? 0);
  const inStock = Number(product?.stock ?? 0) > 0;
  const id = String(product.id);

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-[#f5f5f4]" style={{ aspectRatio: "4/5" }}>
        <Link href={`/products/${id}`} className="absolute inset-0 block">
          {url ? (
            <img
              src={url}
              alt={alt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-[#e7e5e4]" />
          )}
        </Link>

        {product.badge && inStock && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--primary)" }}>
            {product.badge}
          </span>
        )}
        {!inStock && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-white/40" />
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#171717] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          </>
        )}

        <button
          onClick={(e) => onWishlistToggle(e, id, product.name)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{ color: isWishlisted ? "var(--primary)" : "var(--foreground)" }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>

        <div className="absolute inset-x-3 bottom-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (inStock) onAddToCart(product);
            }}
            disabled={!inStock}
            className="w-full rounded-full py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition-all sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 disabled:cursor-not-allowed"
            style={{
              background: inStock ? "#fff" : "rgba(255,255,255,0.7)",
              color: inStock ? "var(--foreground)" : "var(--muted)",
            }}
          >
            {inStock ? "Add to bag" : "Unavailable"}
          </button>
        </div>
      </div>

      <Link href={`/products/${id}`} className="mt-3 block">
        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--primary)" }}>
          {product.category}
        </div>
        <h3 className="mt-1 text-sm sm:text-[15px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          {product.name}
        </h3>
        <div className="mt-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          {price ? `रु ${price.toLocaleString("en-NP")}` : ""}
        </div>
      </Link>
    </div>
  );
}
