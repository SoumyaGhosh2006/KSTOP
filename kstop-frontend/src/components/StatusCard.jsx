import React from "react";

export default function StatusCard({
  eyebrow,
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeVariant = "brand",
  isActionable = false,
  isUrgent = false,
  onClick,
  className = "",
  style = {},
  children,
}) {
  const isClickable = Boolean(onClick);

  return (
    <article
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative p-5 rounded-2xl border transition-all duration-200 select-none ${
        isActionable
          ? "border-t-4 border-t-[#eb5e28] border-[rgba(64,61,57,0.15)] bg-white/80 shadow-sm"
          : isUrgent
          ? "border-t-4 border-t-[#dc2626] border-[rgba(64,61,57,0.15)] bg-white/80 shadow-sm"
          : "border-[rgba(64,61,57,0.14)] bg-white/70 shadow-sm"
      } ${
        isClickable
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-[rgba(235,94,40,0.35)] active:translate-y-0"
          : ""
      } ${className}`}
      style={{
        backdropFilter: "blur(6px)",
        ...style,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {eyebrow && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#756f67] block mb-1">
              {eyebrow}
            </span>
          )}
          {title && <h4 className="text-sm font-semibold text-[#252422] m-0">{title}</h4>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-[#eb5e28]/10 text-[#eb5e28] flex items-center justify-center flex-shrink-0">
            <Icon size={18} />
          </div>
        )}
      </div>

      {value !== undefined && (
        <div className="my-2">
          <strong className="text-3xl font-extrabold tracking-tight text-[#252422] font-mono">
            {value}
          </strong>
        </div>
      )}

      {subtext && <p className="text-xs text-[#756f67] leading-relaxed m-0">{subtext}</p>}

      {badge && <div className="mt-3">{badge}</div>}

      {children}
    </article>
  );
}
