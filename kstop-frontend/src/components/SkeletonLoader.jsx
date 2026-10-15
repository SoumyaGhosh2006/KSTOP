import React from "react";

export default function SkeletonLoader({
  type = "card",
  count = 1,
  className = "",
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "stats") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {items.map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-[rgba(64,61,57,0.12)] bg-white/60 animate-pulse"
          >
            <div className="h-3 w-20 bg-black/10 rounded mb-3" />
            <div className="h-8 w-28 bg-black/10 rounded mb-2" />
            <div className="h-3 w-36 bg-black/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className={`rounded-2xl border border-[rgba(64,61,57,0.12)] bg-white/60 p-4 animate-pulse ${className}`}>
        <div className="h-8 bg-black/10 rounded-lg mb-3 w-full" />
        {items.map((i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-black/5 last:border-none">
            <div className="h-4 bg-black/10 rounded w-1/4" />
            <div className="h-4 bg-black/10 rounded w-1/4" />
            <div className="h-4 bg-black/10 rounded w-1/4" />
            <div className="h-4 bg-black/10 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className={`space-y-2 animate-pulse ${className}`}>
        {items.map((i) => (
          <div
            key={i}
            className="h-4 bg-black/10 rounded"
            style={{ width: `${Math.floor(70 + (i % 4) * 8)}%` }}
          />
        ))}
      </div>
    );
  }

  // Default type: "card"
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-[rgba(64,61,57,0.12)] bg-white/60 animate-pulse"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="h-5 w-44 bg-black/10 rounded" />
            <div className="h-6 w-20 bg-black/10 rounded-full" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 w-3/4 bg-black/10 rounded" />
            <div className="h-3 w-1/2 bg-black/10 rounded" />
          </div>
          <div className="h-9 w-28 bg-black/10 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
