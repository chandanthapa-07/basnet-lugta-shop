"use client";

import { useStore } from "@/app/store/StoreProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/app/lib/types";

function productImageUrl(product: { image?: string | { url?: string | null; sizes?: { card?: { url?: string | null }; thumbnail?: { url?: string | null } } | null } | null } | null | undefined): string {
  const img = product?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.sizes?.card?.url) return img.sizes.card.url;
  if (img.sizes?.thumbnail?.url) return img.sizes.thumbnail.url;
  return img.url ?? "";
}

function productAlt(product: { name?: string | null; image?: string | { alt?: string | null; url?: string | null } | null } | null | undefined): string {
  if (!product) return "";
  const img = product.image;
  if (!img) return product.name ?? "";
  if (typeof img === "string") return product.name ?? "";
  return img.alt || product.name || "";
}

interface WishlistProduct {
  id: string | number;
  name: string;
  price: number;
  stock: number;
  category: string;
  badge?: string | null;
  image: string | { url?: string; alt?: string } | null;
}

export default function WishlistPage() {
  const { state, dispatch } = useStore();
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/products");
        const all = await res.json();
        const wishlisted = (all as WishlistProduct[]).filter((p) => state.wishlist.includes(String(p.id)));
        if (mounted) {
          setWishlistProducts(wishlisted);
          setLoaded(true);
        }
      } catch {
        if (mounted) {
          setWishlistProducts([]);
          setLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, [state.wishlist]);

  if (!loaded) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm" style={{ color: "#57534e" }}>Loading…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
          Saved items
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
          {wishlistProducts.length} item{wishlistProducts.length !== 1 ? "s" : ""} in your wishlist
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
            Your wishlist is empty
          </p>
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Add items to save them for later.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--primary)" }}
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlistProducts.map((p) => (
            <WishlistCard key={p.id} product={p} onRemove={() => dispatch({ type: "WISHLIST_TOGGLE", payload: { id: String(p.id) } })} />
          ))}
        </div>
      )}
    </section>
  );
}

function WishlistCard({
  product,
  onRemove,
}: {
  product: WishlistProduct;
  onRemove: () => void;
}) {
  const url = productImageUrl(product);
  const alt = productAlt(product);
  const price = Number(product.price ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <Link href={`/products/${product.id}`} className="flex-1 group flex flex-col">
        <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "4/5", borderRadius: 16 }}>
          {url ? (
            <img src={url} alt={alt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full" style={{ background: "#e7dfd5" }} />
          )}
          {product.badge && (
            <span className="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--primary)" }}>
              {product.badge}
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Sold out
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--primary)" }}>
            {product.category}
          </div>
          <div className="mt-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {product.name}
          </div>
          <div className="mt-1 text-sm font-medium" style={{ color: "#57534e" }}>
            {price ? `रु ${price.toLocaleString("en-NP")}` : ""}
          </div>
        </div>
      </Link>
      <button
        onClick={onRemove}
        className="text-xs font-medium"
        style={{ color: "var(--primary)" }}
      >
        Remove
      </button>
    </div>
  );
}