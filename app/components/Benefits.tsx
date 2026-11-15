import Link from "next/link";

const BENEFITS = [
  {
    title: "Worldwide delivery",
    subtitle: "Carefully packed in Kathmandu.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 7h13l4 4v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        <path d="M16 7V5a2 2 0 0 0-2-2H4" />
        <circle cx="9" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Authentic craft",
    subtitle: "Selected with respect for tradition.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" />
      </svg>
    ),
  },
  {
    title: "Easy returns",
    subtitle: "7-day hassle-free returns.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
];

export default function Benefits() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-8 sm:py-10">
      <div
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-visible sm:pb-0"
        style={{ scrollbarWidth: "thin" }}
      >
        {BENEFITS.map((b, i) => (
          <div key={b.title} className="flex w-[85vw] shrink-0 items-center gap-3 sm:w-auto">
            <div
              className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {b.icon}
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {b.title}
              </div>
              <div className="text-[10px] sm:text-xs" style={{ color: "#57534e" }}>
                {b.subtitle}
              </div>
            </div>
            {i < BENEFITS.length - 1 && (
              <div className="hidden h-px w-12 bg-black/10 sm:block" style={{ background: "var(--border)" }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}