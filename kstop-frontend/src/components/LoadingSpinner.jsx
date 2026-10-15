import React from "react";

export default function LoadingSpinner({
  size = "md",
  label = "Loading...",
  className = "",
}) {
  const sizePx = size === "sm" ? 16 : size === "lg" ? 36 : 24;

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-3 ${className}`}>
      <div
        className="rounded-full border-2 border-black/10 border-t-[#eb5e28] animate-spin"
        style={{
          width: sizePx,
          height: sizePx,
        }}
      />
      {label && (
        <span className="text-xs font-medium text-[#756f67] animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
