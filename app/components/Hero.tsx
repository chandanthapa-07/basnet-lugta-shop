import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
        <div
          className="relative flex flex-col justify-center rounded-2xl p-6 sm:p-8 lg:p-12 text-white"
          style={{ background: "var(--foreground)", borderRadius: 24 }}
        >
          <span
            className="mb-4 inline-block w-fit text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--primary)" }}
          >
            ROOTED IN BUDDHIST TRADITION
          </span>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clothing for a mindful life.
          </h1>
          <p className="mt-4 max-w-md text-sm sm:text-base leading-6 sm:leading-7 text-white/80">
            Authentic robes, shawls and practice wear made with care in Nepal for
            monastics and mindful practitioners.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
            <Link
              href="#shop"
              className="inline-flex items-center justify-center rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Shop the collection
            </Link>
            <Link
              href="#our-story"
              className="inline-flex items-center justify-center rounded-full border px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              Our story
            </Link>
          </div>
          <div className="relative mt-8 inline-block">
            <div
              className="rounded-xl bg-white px-4 py-3 text-center shadow-lg sm:px-5 sm:py-4"
              style={{ color: "var(--foreground)" }}
            >
              <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                MADE IN NEPAL
              </div>
              <div className="mt-1 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Tradition in every thread.
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div
            className="overflow-hidden rounded-2xl"
            style={{ aspectRatio: "4/5", background: "#e7dfd5" }}
          >
            <img
              src="https://images.unsplash.com/photo-1651470387091-f6458d8c7b74?auto=format&fit=crop&w=1500&q=90"
              alt="Buddhist clothing"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
}