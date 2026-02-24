import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "./utils";

interface MobileNavProps {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
  children?: React.ReactNode;
}

export function MobileNav({ title, subtitle, onLogout, children }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md border-b-2 border-teal-100">
      {/* Desktop View */}
      <div className="hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              ออกจากระบบ
            </Button>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden px-4 py-3 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-800 line-clamp-1">{title}</h1>
          {subtitle && <p className="text-xs text-gray-600 line-clamp-1">{subtitle}</p>}
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden border-t-2 border-teal-100 bg-white py-2">
          {children && <div className="px-4 space-y-2">{children}</div>}
          {onLogout && (
            <div className="border-t border-gray-200 px-4 py-2">
              <Button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                ออกจากระบบ
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
