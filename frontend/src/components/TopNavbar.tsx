import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, Menu, LogIn, LogOut, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SearchModal } from './SearchModal';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  onOpenAuthModal: () => void;
  onNavigate: (tab: any) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu, onOpenAuthModal, onNavigate }) => {
  const { user, token, logout, workspaces, activeWorkspace, setActiveWorkspace } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

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
        <div
          onClick={() => setIsSearchModalOpen(true)}
          className="relative cursor-pointer"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            readOnly
            placeholder="Search documents, ask questions... (Ctrl + K)"
            className="w-full cursor-pointer rounded-2xl border border-indigo-100/80 bg-[#f4f5fd] py-2.5 pr-4 pl-11 text-xs font-medium text-slate-800 placeholder-slate-400 transition hover:bg-white hover:border-indigo-300 focus:outline-none sm:text-sm"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Workspace Dropdown Switcher */}
        {token && activeWorkspace && (
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
            >
              <span className="max-w-[130px] truncate">{activeWorkspace.name}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute right-0 z-40 mt-1.5 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Workspace
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setShowWorkspaceDropdown(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                        ws.id === activeWorkspace.id
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace.id && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkspaceDropdown(false);
                      onNavigate('workspaces');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Manage Workspaces</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* User Profile Pill or Login Button */}
        {token && user ? (
          <div className="relative">
            <div
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex cursor-pointer items-center gap-2.5 rounded-full p-1 transition hover:bg-slate-100/80"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b0f24] text-xs font-bold text-white shadow-xs">
                {getInitials(user.name)}
              </div>
              <span className="hidden text-sm font-semibold text-slate-800 sm:inline">
                {user.name}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </div>

            {showUserDropdown && (
              <div className="absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('profile');
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Global Semantic Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
};
