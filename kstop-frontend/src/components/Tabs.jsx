import React from "react";

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
  size = "md",
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap items-center gap-1.5 p-1 bg-[rgba(64,61,57,0.06)] border border-[rgba(64,61,57,0.1)] rounded-xl ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 rounded-lg font-semibold transition-all duration-150 select-none ${
              size === "sm"
                ? "px-3 py-1 text-xs"
                : "px-4 py-1.5 text-sm"
            } ${
              isActive
                ? "bg-[#252422] text-[#fffcf2] shadow-sm"
                : "text-[#756f67] hover:text-[#252422] hover:bg-black/5"
            }`}
          >
            {Icon && <Icon size={size === "sm" ? 14 : 16} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? "bg-[#eb5e28] text-white"
                    : "bg-black/10 text-[#403d39]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
