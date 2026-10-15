import React, { useEffect } from "react";
import { X } from "./Icons";

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
      ? "max-w-3xl"
      : size === "xl"
      ? "max-w-4xl"
      : "max-w-xl";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#252422]/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Dialog box */}
      <div
        className={`relative w-full ${maxWidthClass} rounded-2xl bg-[#fffcf2] border border-[rgba(64,61,57,0.18)] shadow-2xl p-6 sm:p-7 text-[#252422] z-10 transition-all transform animate-in zoom-in-95 duration-200 ${className}`}
        style={{
          boxShadow: "0 25px 60px -15px rgba(37,36,34,0.35)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[rgba(64,61,57,0.1)]">
          <div>
            {title && (
              <h3 className="text-xl font-bold tracking-tight text-[#252422] m-0">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#756f67] mt-1 m-0 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#756f67] hover:text-[#252422] hover:bg-black/5 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 text-sm leading-normal">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t border-[rgba(64,61,57,0.1)] flex items-center justify-end gap-3 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
