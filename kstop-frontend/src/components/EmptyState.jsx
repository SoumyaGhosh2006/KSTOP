import React from "react";
import { Sparkles } from "./Icons";

export default function EmptyState({
  icon: Icon = Sparkles,
  title = "No data found",
  description = "There are no records matching your view at this time.",
  actionLabel,
  onAction,
  className = "",
  children,
}) {
  return (
    <div
      className={`text-center py-12 px-6 rounded-2xl border border-dashed border-[rgba(64,61,57,0.2)] bg-white/40 flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center mb-4 shadow-sm">
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-bold text-[#252422] m-0 mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-[#756f67] max-w-sm m-0 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-[#252422] hover:bg-[#eb5e28] text-[#fffcf2] text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}
