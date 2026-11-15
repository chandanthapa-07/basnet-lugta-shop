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

export default function ShopSection({ products }: { products: any[] }) {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState(state.activeCategory);
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    setActiveCategory(state.activeCategory);
  }, [state.activeCategory]);

  useEffect(() => {
    if (activeCategory === "All clothing") {
      setFilteredProducts(products);
      return;
    }
    setFilteredProducts(
      products.filter((p) => p.category === activeCategory)
    );
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
        duration: 4000,
      });
    },
    [dispatch, toast]
  );

  const handleWishlistToggle = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "WISHLIST_TOGGLE", payload: { id } });
      const isWishlisted = state.wishlist.includes(id);
      toast({
        title: isWishlisted ? "Removed from saved" : "Saved to wishlist",
        description: isWishlisted
          ? "Item removed from your saved items."
          : "Item added to your saved items.",
        type: isWishlisted ? "info" : "success",
        duration: 3000,
      });
    },
    [dispatch, state.wishlist, toast]
  );

  return (
    <section id="shop" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--primary)" }}
          >
            CLOTHING & PRACTICE WEAR
          </p>
          <h2
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Made with intention.
          </h2>
        </div>
        <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCategory(c)}
              className={`rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-black/5 ${
                activeCategory === c
                  ? "bg-black text-white"
                  : ""
              }`}
              style={{
                borderColor: activeCategory === c ? "var(--primary)" : "var(--border)",
                color: "var(--foreground)",
                background: activeCategory === c ? "var(--primary)" : "transparent",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#57534e" }}>
                <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
              No products in this category
            </p>
            <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
              Check back soon for new arrivals.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={state.wishlist.includes(String(p.id))}
            />
          ))
        )}
      </div>
    </section>
  );
}

function productImageUrl(product: any): string {
  const img = product?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.sizes?.card?.url) return img.sizes.card.url;
  if (img.sizes?.thumbnail?.url) return img.sizes.thumbnail.url;
  return img.url ?? "";
}

function ProductCard({
  product,
  onAddToCart,
  onWishlistToggle,
  isWishlisted,
}: {
  product: any;
  onAddToCart: (product: any) => void;
  onWishlistToggle: (e: React.MouseEvent, id: string) => void;
  isWishlisted: boolean;
}) {
  const img = product?.image;
  const url =
    img?.sizes?.card?.url ?? img?.sizes?.thumbnail?.url ?? img?.url ?? "";
  const alt = img?.alt || product?.name || "";
  const badge = product?.badge;
  const price = Number(product?.price ?? 0);
  const inStock = Number(product?.stock ?? 0) > 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl aspect-[4/5]" style={{ borderRadius: 20 }}>
        {url ? (
          <img
            src={url}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[#e7dfd5]" />
        )}
        {badge && (
          <span className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-full px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--primary)" }}>
            {badge}
          </span>
        )}
        {!inStock && (
          <span className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-full bg-black/80 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
        <button
          onClick={(e) => onWishlistToggle(e, String(product.id))}
          className={`absolute right-2 sm:right-3 top-2 sm:top-3 p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
            isWishlisted
              ? "bg-white text-[var(--primary)] shadow-md"
              : "bg-black/5 text-[var(--foreground)] hover:bg-white hover:text-[var(--primary)]"
          }`}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center" />
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCart(product);
          }}
          disabled={!inStock}
          className={`absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 transform group-hover:-translate-y-1 ${
            inStock
              ? "bg-[var(--primary)] text-white shadow-lg"
              : "bg-black/30 text-black/30 cursor-not-allowed"
          }`}
        >
          {inStock ? "Add to bag" : "Sold out"}
        </button>
      </div>
      <div className="mt-2 sm:mt-3">
        <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "var(--primary)" }}>
          {product?.category}
        </div>
        <div className="mt-1 text-xs sm:text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          {product?.name}
        </div>
        <div className="mt-1 text-xs sm:text-sm font-medium" style={{ color: "#57534e" }}>
          {price ? `रु ${price.toLocaleString("en-NP")}` : ""}
        </div>
      </div>
    </Link>
  );
}