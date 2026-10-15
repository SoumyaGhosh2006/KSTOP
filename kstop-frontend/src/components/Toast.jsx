import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "./Icons";

export default function Toast({
  type = "info",
  message,
  onClose,
  className = "",
}) {
  if (!message) return null;

  const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const STYLES = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-rose-50 border-rose-200 text-rose-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };

  const Icon = ICONS[type] || Info;
  const styleClass = STYLES[type] || STYLES.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium leading-relaxed transition-all shadow-sm ${styleClass} ${className}`}
    >
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 break-words">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-current opacity-60 hover:opacity-100 p-0.5 rounded cursor-pointer transition-opacity"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
