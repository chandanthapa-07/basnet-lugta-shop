import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="mt-12 sm:mt-16 border-t"
      style={{ background: "var(--admin-dark)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 sm:flex-row">
        <div className="text-center sm:text-left">
          <div className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
            Basnet Lugta Shop.
          </div>
          <div className="text-xs text-white/70">Clothing for mindful living.</div>
          <Link
            href="/admin"
            className="mt-2 inline-block text-xs font-medium text-white/80 transition-colors hover:text-white"
          >
            Owner sign in
          </Link>
        </div>
        <div className="text-xs text-white/60 text-center sm:text-right">
          &copy; 2026 Basnet Lugta Shop &middot; Kathmandu, Nepal.
        </div>
      </div>
    </footer>
  );
}