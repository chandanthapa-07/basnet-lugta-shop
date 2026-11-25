import Link from "next/link";
import { productImageUrl, productAlt } from "@/app/lib/payload";

interface SearchProduct {
  id: number;
  name: string;
  slug: string | null;
  sku: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  category: string;
  sizes: string[];
  colors: string[];
  badge: string | undefined;
  description: string | undefined;
  visible: number;
  featured: number;
  created_at: string;
  image: string | { url?: string; alt?: string } | null;
}

interface SearchResponse {
  products: SearchProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: Record<string, unknown>;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q || "";
  const products: SearchProduct[] = query ? await searchProductsAPI(query) : [];

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
          {query ? `Search results for "${query}"` : "Search"}
        </h1>
        {query && (
          <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
            Found {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "#57534e" }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
            {query ? `No products found for "${query}"` : "No products available"}
          </p>
          {query && (
            <p className="mt-1 text-sm" style={{ color: "#57534e" }}>
              Try a different keyword or browse our collections.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

async function searchProductsAPI(query: string): Promise<SearchProduct[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/api/products/search?q=${encodeURIComponent(query)}&limit=50`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    const data: SearchResponse = await res.json();
    return data.products;
  } catch {
    return [];
  }
}

function ProductCard({ product }: { product: SearchProduct }) {
  const url = productImageUrl(product);
  const alt = productAlt(product);
  const price = Number(product.price ?? 0);

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col">
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "4/5", borderRadius: 16 }}>
        {url ? (
          <img src={url} alt={alt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full" style={{ background: "#e7dfd5" }} />
        )}
        {product.badge && (
          <span className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-full px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--primary)" }}>
            {product.badge}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute left-2 sm:left-3 top-2 sm:top-3 rounded-full bg-black/80 px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-2 sm:mt-3">
        <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wide" style={{ color: "var(--primary)" }}>
          {product.category}
        </div>
        <div className="mt-1 text-xs sm:text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {product.name}
        </div>
        <div className="mt-1 text-xs sm:text-sm font-medium" style={{ color: "#57534e" }}>
          {price ? `रु ${price.toLocaleString("en-NP")}` : ""}
        </div>
      </div>
    </Link>
  );
}