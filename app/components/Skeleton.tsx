"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Skeleton({ className = "", children }: { className?: string; children?: ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (loaded) return <>{children}</>;

  return (
    <div
      className={`flex flex-col gap-4 px-6 py-8 animate-pulse ${
        className
      }`}
    >
      <div className="h-4 bg-black/10 rounded w-1/3" />
      <div className="h-4 bg-black/10 rounded w-2/3" />
      <div className="h-8 bg-black/10 rounded w-full" />
      <div className="h-40 bg-black/10 rounded w-full" />
      <div className="h-4 bg-black/10 rounded w-1/2" />
      <div className="h-4 bg-black/10 rounded w-2/5" />
    </div>
  );
}

export function SkeletonProduct() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/5] bg-black/10 rounded-xl" />
      <div className="h-4 bg-black/10 rounded w-1/2" />
      <div className="h-5 bg-black/10 rounded w-3/4" />
      <div className="h-4 bg-black/10 rounded w-2/3" />
    </div>
  );
}