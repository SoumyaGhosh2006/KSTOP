import React from "react";

const VARIANTS = {
  approved: {
    bg: "rgba(34, 197, 94, 0.12)",
    text: "#15803d",
    border: "rgba(34, 197, 94, 0.3)",
  },
  resolved: {
    bg: "rgba(34, 197, 94, 0.12)",
    text: "#15803d",
    border: "rgba(34, 197, 94, 0.3)",
  },
  success: {
    bg: "rgba(34, 197, 94, 0.12)",
    text: "#15803d",
    border: "rgba(34, 197, 94, 0.3)",
  },
  pending: {
    bg: "rgba(235, 94, 40, 0.12)",
    text: "#c94a1b",
    border: "rgba(235, 94, 40, 0.3)",
  },
  pending_parent: {
    bg: "rgba(245, 158, 11, 0.14)",
    text: "#b45309",
    border: "rgba(245, 158, 11, 0.3)",
  },
  pending_mentor: {
    bg: "rgba(235, 94, 40, 0.14)",
    text: "#c94a1b",
    border: "rgba(235, 94, 40, 0.3)",
  },
  progress: {
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#1d4ed8",
    border: "rgba(59, 130, 246, 0.3)",
  },
  urgent: {
    bg: "rgba(220, 38, 38, 0.14)",
    text: "#b91c1c",
    border: "rgba(220, 38, 38, 0.35)",
  },
  rejected: {
    bg: "rgba(220, 38, 38, 0.12)",
    text: "#b91c1c",
    border: "rgba(220, 38, 38, 0.3)",
  },
  clashed: {
    bg: "rgba(220, 38, 38, 0.14)",
    text: "#b91c1c",
    border: "rgba(220, 38, 38, 0.35)",
  },
  neutral: {
    bg: "rgba(117, 111, 103, 0.12)",
    text: "#403d39",
    border: "rgba(117, 111, 103, 0.25)",
  },
  brand: {
    bg: "rgba(235, 94, 40, 0.15)",
    text: "#eb5e28",
    border: "rgba(235, 94, 40, 0.35)",
  },
};

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  icon: Icon,
  dot = false,
  className = "",
  style = {},
  ...props
}) {
  const normalizedVariant = String(variant).toLowerCase().replace(/-/g, "_");
  const config = VARIANTS[normalizedVariant] || VARIANTS.neutral;

  const sizeStyles =
    size === "sm"
      ? { padding: "2px 8px", fontSize: "11px", height: "20px" }
      : size === "lg"
      ? { padding: "6px 14px", fontSize: "13px", height: "28px" }
      : { padding: "4px 10px", fontSize: "12px", height: "24px" };

  return (
    <span
      className={`kstop-badge inline-flex items-center gap-1.5 font-semibold tracking-wide rounded-full border transition-colors ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
        ...sizeStyles,
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          className="rounded-full flex-shrink-0 animate-pulse"
          style={{
            width: size === "sm" ? 5 : 6,
            height: size === "sm" ? 5 : 6,
            backgroundColor: config.text,
          }}
        />
      )}
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
}
