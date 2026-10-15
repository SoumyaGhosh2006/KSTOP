import React from "react";
import { Menu, ArrowLeft, Bell } from "./Icons";

export default function Navbar({
  title,
  subtitle,
  backTo,
  onNavigateBack,
  onToggleSidebar,
  notificationCount = 0,
  onNotificationClick,
  actionButton,
  className = "",
}) {
  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-8 py-4 bg-[#fffcf2]/90 backdrop-blur-md border-b border-[rgba(64,61,57,0.12)] transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open menu"
            className="lg:hidden p-2 rounded-xl bg-[#252422] text-white hover:bg-[#eb5e28] transition-colors flex-shrink-0 cursor-pointer shadow-sm"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Back navigation */}
        {backTo && onNavigateBack && (
          <button
            type="button"
            onClick={onNavigateBack}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-black/5 text-xs font-bold text-[#403d39] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        )}

        {/* Title & subtitle */}
        <div className="min-w-0">
          {subtitle && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#eb5e28] block truncate leading-none mb-1">
              {subtitle}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#252422] m-0 truncate leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {actionButton}

        {onNotificationClick && (
          <button
            type="button"
            onClick={onNotificationClick}
            aria-label="Notifications"
            className="relative p-2.5 rounded-xl border border-[rgba(64,61,57,0.15)] bg-white hover:bg-black/5 text-[#252422] transition-all cursor-pointer shadow-xs"
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#eb5e28] text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-[#fffcf2] animate-bounce">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
