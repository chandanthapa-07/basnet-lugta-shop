import { getProduct, getRelatedProducts, productImageUrl, productAlt, formatNPR } from "@/app/lib/payload";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientAddToCart from "./ClientAddToCart";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(id, product.category, 4);
  const imgUrl = productImageUrl(product);
  const alt = productAlt(product);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <nav className="mb-6 sm:mb-8 text-xs" style={{ color: "#57534e" }}>
        <Link href="/" className="text-xs sm:text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
          Home
        </Link>
        <span className="mx-1">/</span>
        <span className="text-xs sm:text-sm font-medium">{product.category}</span>
        <span className="mx-1">/</span>
        <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "4/5", borderRadius: 24 }}>
          {imgUrl ? (
            <img src={imgUrl} alt={alt} className="h-full w-full object-cover" />
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

        <div>
          <span className="mb-2 inline-block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
            {product.category}
          </span>
          <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            {product.name}
          </h1>
          <div className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            {formatNPR(Number(product.price ?? 0))}
          </div>
          <p className="mb-4 sm:mb-6 text-sm sm:text-base leading-6 sm:leading-7" style={{ color: "#57534e" }}>
            {product.description || "No description available."}
          </p>

          <ClientAddToCart
            productId={String(product.id)}
            name={product.name}
            price={Number(product.price ?? 0)}
            stock={Number(product.stock ?? 0)}
            image={imgUrl}
          />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}>
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
            {related.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: any }) {
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