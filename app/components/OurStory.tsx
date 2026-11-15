export default function OurStory() {
  return (
    <section id="our-story" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex flex-col items-center text-center">
        <div
          className="flex items-center justify-center rounded-lg bg-white p-4 sm:p-6 shadow-sm"
          style={{ width: 140, height: 84, border: "1px solid var(--border)" }}
        >
          <span
            className="text-xl sm:text-2xl font-bold"
            style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
          >
            SHOP
          </span>
        </div>
        <p
          className="mt-3 sm:mt-4 text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--primary)" }}
        >
          KATHMANDU, NEPAL
        </p>
        <h2
          className="mt-3 sm:mt-4 max-w-2xl text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight"
          style={{ color: "var(--foreground)", fontFamily: "var(--font-display)" }}
        >
          &ldquo;Traditional clothing, made for a life of simplicity and practice.&rdquo;
        </h2>
        <p
          className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base leading-6 sm:leading-7"
          style={{ color: "#57534e" }}
        >
          Basnet Lugta Shop offers Buddhist robes, shawls and meaningful garments from
          Nepal&mdash;chosen with cultural respect, local knowledge and care for the
          communities we serve.
        </p>
      </div>
    </section>
  );
}