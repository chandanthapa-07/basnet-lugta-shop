export default function OurStory() {
  return (
    <section id="our-story" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
      <div className="flex flex-col items-center text-center">
        <div
          className="flex items-center justify-center rounded-xl border bg-white px-8 py-5 shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}>
            SHOP
          </span>
        </div>
        <p className="mt-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>
          KATHMANDU, NEPAL
        </p>
        <h2
          className="mt-4 max-w-3xl text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-tight tracking-tight"
          style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}
        >
          &ldquo;Traditional clothing, made for a life of simplicity and practice.&rdquo;
        </h2>
        <p className="mt-5 max-w-2xl text-sm sm:text-base leading-7" style={{ color: "var(--muted)" }}>
          Basnet Lugta Shop offers Buddhist robes, shawls and meaningful garments from Nepal—chosen with cultural respect, local knowledge and care for the communities we serve.
        </p>
      </div>
    </section>
  );
}
