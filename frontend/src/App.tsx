import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './pages/DashboardView';
import { DocumentsView } from './pages/DocumentsView';
import { WorkspacesView } from './pages/WorkspacesView';
import { ChatView } from './pages/ChatView';
import { LoginView } from './pages/LoginView';
import { AdminUsersView } from './pages/AdminUsersView';
import { AdminAiSettingsView } from './pages/AdminAiSettingsView';
import type { NavItemKey } from './types/dashboard';
import { Database, Cpu, ShieldCheck, Loader2 } from 'lucide-react';
import './App.css';

const validTabs: NavItemKey[] = ['dashboard', 'documents', 'chat', 'workspaces', 'users', 'ai-settings', 'settings', 'profile'];

const getInitialTab = (): NavItemKey => {
  if (typeof window !== 'undefined') {
    // 1. Check pathname (e.g. /chat, /documents)
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase() as NavItemKey;
    if (validTabs.includes(path)) {
      return path;
    }

    // Also handle legacy hash if present (e.g. #/chat -> chat)
    if (window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase() as NavItemKey;
      if (validTabs.includes(hash)) {
        return hash;
      }
    }

    // 2. Fallback to localStorage
    const saved = localStorage.getItem('documind_active_tab') as NavItemKey;
    if (validTabs.includes(saved)) {
      return saved;
    }
  }

  return 'dashboard';
};

function MainApp() {
  const { user, token, loading: authLoading, activeWorkspace } = useAuth();
  const [currentTab, setCurrentTabState] = useState<NavItemKey>(getInitialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const setCurrentTab = useCallback((tab: NavItemKey) => {
    setCurrentTabState(tab);
    localStorage.setItem('documind_active_tab', tab);
    const targetPath = `/${tab}`;
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase() as NavItemKey;
      if (validTabs.includes(path)) {
        setCurrentTabState(path);
        localStorage.setItem('documind_active_tab', path);
      } else {
        setCurrentTabState('dashboard');
      }
    };

    window.addEventListener('popstate', onPopState);

    // Clean up any remaining /# or empty path and standardize to /tab
    const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!validTabs.includes(currentPath as NavItemKey) || window.location.hash) {
      window.history.replaceState(null, '', `/${currentTab}`);
    }

    return () => window.removeEventListener('popstate', onPopState);
  }, [currentTab]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f24]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading DocuMind AI...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginView />;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6fd] text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <TopNavbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onNavigate={setCurrentTab}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
            {currentTab === 'documents' && <DocumentsView />}
            {currentTab === 'workspaces' && <WorkspacesView />}
            {currentTab === 'chat' && <ChatView />}
            {currentTab === 'users' && <AdminUsersView />}
            {currentTab === 'ai-settings' && <AdminAiSettingsView />}

            {/* Settings Tab */}
            {currentTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">System & Infrastructure Settings</h2>
                  <p className="text-xs text-slate-500">Production configuration and active stack status.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                    <Database className="h-8 w-8 text-indigo-600 mb-3" />
                    <h4 className="text-sm font-bold text-slate-900">Database</h4>
                    <p className="text-xs text-slate-500 mt-1">PostgreSQL 18 + pgvector 0.8.7</p>
                    <span className="mt-3 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200">
                      Connected & Active
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                    <Cpu className="h-8 w-8 text-purple-600 mb-3" />
                    <h4 className="text-sm font-bold text-slate-900">AI Runtime</h4>
                    <p className="text-xs text-slate-500 mt-1">Ollama Local (all-minilm 384d)</p>
                    <span className="mt-3 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 border border-indigo-200">
                      Phase 5 Integration Ready
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs">
                    <ShieldCheck className="h-8 w-8 text-emerald-600 mb-3" />
                    <h4 className="text-sm font-bold text-slate-900">Authentication</h4>
                    <p className="text-xs text-slate-500 mt-1">Laravel Sanctum API Tokens</p>
                    <span className="mt-3 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200">
                      {token ? 'Authenticated' : 'Guest Mode'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {currentTab === 'profile' && (
              <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0b0f24] text-xl font-bold text-white shadow-md">
                    {user ? user.name[0] : 'G'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{user?.name || 'Guest User'}</h3>
                    <p className="text-xs text-slate-500">{user?.email || 'Not logged in'}</p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                      Active Workspace: {activeWorkspace?.name || 'None'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Auth Modal for Login/Registration */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
