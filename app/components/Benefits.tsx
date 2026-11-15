const BENEFITS = [
  {
    title: "Worldwide delivery",
    subtitle: "Carefully packed in Kathmandu.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Authentic craft",
    subtitle: "Selected with respect for tradition.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2 4 5v6c0 5.25 3.4 9.2 8 11 4.6-1.8 8-5.75 8-11V5l-8-3z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Easy returns",
    subtitle: "7-day hassle-free returns.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
];

export default function Benefits() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-4 sm:py-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex items-center gap-3 sm:gap-4">
            <div
              className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "var(--primary)" }}
              aria-hidden="true"
            >
              {b.icon}
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                {b.title}
              </div>
              <div className="mt-0.5 text-xs sm:text-sm leading-snug" style={{ color: "var(--muted)" }}>
                {b.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 sm:mt-8 h-px w-full" style={{ background: "var(--border)" }} />
    </section>
  );
}
