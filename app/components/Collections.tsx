import Link from "next/link";

const COLLECTIONS = [
  {
    eyebrow: "FOR DAILY PRACTICE",
    title: "Traditional robes",
    cta: "Explore robes",
    image:
      "https://images.unsplash.com/photo-1758549781880-f5f1d507df6c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    eyebrow: "WOVEN WITH CARE",
    title: "Shawls & wraps",
    cta: "Explore shawls",
    image:
      "https://images.unsplash.com/photo-1571330177112-e3a4985264d7?auto=format&fit=crop&w=1200&q=85",
  },
];

export default function Collections() {
  return (
    <section id="collections" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.title}
            href="#shop"
            className="group relative block overflow-hidden rounded-[24px] min-h-[260px] sm:min-h-[320px] lg:min-h-[360px]"
            style={{ background: "#171717" }}
          >
            <img
              src={c.image}
              alt={c.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
                {c.eyebrow}
              </span>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {c.title}
              </h3>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                {c.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
