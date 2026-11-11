import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { WelcomeBanner } from './components/WelcomeBanner';
import { StatCards } from './components/StatCards';
import { DocumentOverviewChart } from './components/DocumentOverviewChart';
import { RecentDocuments } from './components/RecentDocuments';
import { QuickActions } from './components/QuickActions';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import type { NavItemKey } from './types/dashboard';
import './App.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <TopNavbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* 1. Welcome Greeting Banner */}
            <WelcomeBanner />

            {/* 2. Top Statistic Cards (4 cards) */}
            <StatCards />

            {/* 3. Middle Section: Chart & Recent Documents */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <DocumentOverviewChart />
              </div>
              <div className="lg:col-span-5">
                <RecentDocuments />
              </div>
            </div>

            {/* 4. Bottom Section: Quick Actions & AI Assistant */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <QuickActions />
              </div>
              <div className="lg:col-span-6">
                <AiAssistantPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
