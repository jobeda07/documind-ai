import React from 'react';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-indigo-100/60 bg-white/80 px-4 backdrop-blur-md sm:px-8">
      {/* Left Mobile Menu Button */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-bold text-slate-900">DocuMind AI</span>
      </div>

      {/* Center Search Bar */}
      <div className="mx-2 max-w-xl flex-1 sm:mx-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents, ask questions... (Ctrl + K)"
            className="w-full rounded-2xl border border-indigo-100/80 bg-[#f4f5fd] py-2.5 pr-4 pl-11 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100 sm:text-sm"
          />
        </div>
      </div>

      {/* Right User & Notifications */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative rounded-xl p-2 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            2
          </span>
        </button>

        {/* User Profile Pill */}
        <div className="flex cursor-pointer items-center gap-2.5 rounded-full p-1 transition hover:bg-slate-100/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b0f24] text-xs font-bold text-white shadow-xs">
            JD
          </div>
          <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
            John Doe
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </div>
      </div>
    </header>
  );
};
