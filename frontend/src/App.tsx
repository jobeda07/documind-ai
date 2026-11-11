import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './pages/DashboardView';
import { DocumentsView } from './pages/DocumentsView';
import { WorkspacesView } from './pages/WorkspacesView';
import type { NavItemKey } from './types/dashboard';
import { MessageSquare, Database, Cpu, ShieldCheck } from 'lucide-react';
import './App.css';

function MainApp() {
  const { user, token, activeWorkspace } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

            {/* Chat Tab Preview */}
            {currentTab === 'chat' && (
              <div className="rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-xs">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">RAG Chat with Citations</h3>
                <p className="mx-auto mt-2 max-w-md text-xs text-slate-500">
                  Semantic retrieval and grounded document citations will become active in Phase 6 & Phase 7.
                  Documents uploaded in the <strong>Documents</strong> tab are parsed and prepared for retrieval.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentTab('documents')}
                  className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
                >
                  Go to Documents Tab &rarr;
                </button>
              </div>
            )}

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
