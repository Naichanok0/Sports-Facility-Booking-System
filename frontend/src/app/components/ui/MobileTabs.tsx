import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface MobileTabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function MobileTabs({
  tabs,
  value,
  onValueChange,
  children,
  className,
}: MobileTabsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activeTab = tabs.find((t) => t.value === value);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop Tabs */}
      <div className="hidden sm:flex bg-white border-2 border-teal-100 rounded-lg p-1 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              onValueChange(tab.value);
              setIsDropdownOpen(false);
            }}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded transition whitespace-nowrap",
              value === tab.value
                ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white"
                : "text-gray-700 hover:text-gray-900"
            )}
          >
            {tab.icon && <span className="inline-block mr-1">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile Dropdown */}
      <div className="sm:hidden relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-white border-2 border-teal-100 rounded-lg p-3 flex justify-between items-center text-left"
        >
          <span className="font-medium text-gray-800 flex items-center gap-2">
            {activeTab?.icon && <span>{activeTab.icon}</span>}
            {activeTab?.label}
          </span>
          <ChevronDown
            className={cn("w-5 h-5 transition", isDropdownOpen && "rotate-180")}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-teal-100 rounded-lg shadow-lg z-10">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  onValueChange(tab.value);
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm font-medium border-b last:border-b-0 transition",
                  value === tab.value
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "text-gray-700 hover:bg-gray-50 border-gray-200"
                )}
              >
                <span className="flex items-center gap-2">
                  {tab.icon && <span>{tab.icon}</span>}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
