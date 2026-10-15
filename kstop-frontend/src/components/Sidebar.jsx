import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, X } from "./Icons";

export default function Sidebar({
  isOpen,
  onClose,
  roleTitle = "Portal",
  user,
  navItems = [],
  onLogout,
}) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-[#252422]/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#252422] text-[#fffcf2] border-r border-white/10 flex flex-col justify-between p-4 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: "10px 0 35px rgba(37,36,34,0.3)",
        }}
      >
        {/* Top: Brand & User Identity */}
        <div>
          <div className="flex items-center justify-between px-2 pt-2 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eb5e28] to-[#c94a1b] flex items-center justify-center font-black text-xl text-white shadow-md">
                K
              </div>
              <div>
                <strong className="text-xl font-black tracking-tight text-white block leading-none">
                  K-STOP
                </strong>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#eb5e28] block mt-1">
                  {roleTitle}
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* User pill */}
          {user && (
            <div className="mt-4 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest block">
                  Logged in as
                </span>
                <strong className="text-xs text-white block truncate">
                  {user.name || "User"}
                </strong>
                {user.rollNumber && (
                  <span className="text-[10px] font-mono text-white/60 block truncate">
                    Roll: {user.rollNumber}
                  </span>
                )}
                {user.hostelName && (
                  <span className="text-[10px] text-white/60 block truncate">
                    {user.hostelName}
                  </span>
                )}
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
            </div>
          )}

          {/* Nav Items */}
          <nav className="mt-5 space-y-1" aria-label="Portal Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isBaseRoute = item.path === currentPath;
              const isNested =
                item.path.length > 18 && currentPath.startsWith(item.path);
              const isActive = isBaseRoute || isNested;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end !== undefined ? item.end : item.path.split("/").length <= 3}
                  onClick={onClose}
                  className={({ isActive: navActive }) => {
                    const active = navActive || isActive;
                    return `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                      active
                        ? "bg-[#eb5e28] text-white shadow-md font-bold"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`;
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {Icon && (
                      <Icon
                        size={16}
                        className="transition-transform group-hover:scale-110 flex-shrink-0"
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white text-[#eb5e28]"
                          : "bg-[#eb5e28] text-white"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Logout */}
        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 text-white/80 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
