import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-4 sm:pt-6 lg:pt-8 pb-6 sm:pb-8">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 lg:items-stretch">
        <div
          className="relative flex flex-col justify-center overflow-hidden rounded-[24px] p-6 sm:p-8 lg:p-12 text-white min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]"
          style={{ background: "#171717" }}
        >
          <span className="inline-block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
            ROOTED IN BUDDHIST TRADITION
          </span>
          <h1
            className="mt-4 text-4xl sm:text-5xl lg:text-[56px] xl:text-[64px] font-extrabold leading-[1.05] tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clothing for a<br className="hidden sm:block" /> mindful life.
          </h1>
          <p className="mt-5 max-w-lg text-sm sm:text-base leading-7 text-white/75">
            Authentic robes, shawls and practice wear made with care in Nepal for monastics and mindful practitioners.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="#shop"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)" }}
            >
              Shop the collection
            </Link>
            <Link
              href="#our-story"
              className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.28)" }}
            >
              Our story
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[24px] min-h-[320px] sm:min-h-[420px] lg:min-h-[560px]" style={{ background: "#e7dfd5" }}>
          <img
            src="https://images.unsplash.com/photo-1651470387091-f6458d8c7b74?auto=format&fit=crop&w=1500&q=90"
            alt="Buddhist monk in traditional robes in Nepal"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-xl bg-white/95 backdrop-blur px-4 py-3 shadow-sm">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
              MADE IN NEPAL
            </div>
            <div className="mt-0.5 text-xs sm:text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Tradition in every thread
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
