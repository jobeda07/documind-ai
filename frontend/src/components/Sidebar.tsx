import React from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  LayoutGrid,
  Settings,
  User,
  LogOut,
  Sparkles,
  X,
  Users,
  Cpu,
} from 'lucide-react';
import type { NavItemKey } from '../types/dashboard';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: NavItemKey;
  onTabChange: (tab: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { logout, token, user } = useAuth();

  const navItems: { key: NavItemKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'workspaces', label: 'Workspaces', icon: LayoutGrid },
    ...(user?.role === 'admin'
      ? [
          { key: 'users' as NavItemKey, label: 'User Approval', icon: Users },
          { key: 'ai-settings' as NavItemKey, label: 'AI & API Keys', icon: Cpu },
        ]
      : []),
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'logout', label: 'Logout', icon: LogOut },
  ];

  const handleNavClick = (key: NavItemKey) => {
    if (key === 'logout') {
      logout();
    } else {
      onTabChange(key);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-[#0b0f24] px-5 py-6 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between pb-7">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/25">
                <svg
                  className="h-6 w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4v1a4 4 0 0 0 4 4v1a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-1a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
                  <path d="M12 6v12" />
                  <path d="M8 10h8" />
                  <path d="M8 14h8" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">DocuMind AI</h1>
                <p className="text-[11px] font-medium tracking-wide text-slate-400">
                  Document Intelligence
                </p>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              onClick={onCloseMobile}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              if (item.key === 'logout' && !token) return null;
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item.key)}
                  className={`group flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-[#161a38] hover:text-slate-100'
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-4">
          {/* Upgrade Plan Card */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-900/50 bg-gradient-to-b from-[#161b3d] to-[#0f132e] p-4 text-center shadow-lg">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="h-5 w-5 text-indigo-300" />
            </div>
            <p className="text-xs font-semibold leading-relaxed text-slate-200">
              Smarter Search.<br />Deeper Insights.
            </p>
            <button
              type="button"
              className="mt-3.5 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95 active:scale-98"
            >
              Upgrade Plan
            </button>
          </div>

          {/* Footer Version */}
          <p className="text-center text-[11px] font-medium text-slate-500">
            DocuMind AI v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};
