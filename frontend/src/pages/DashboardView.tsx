import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { WelcomeBanner } from '../components/WelcomeBanner';
import { DocumentOverviewChart } from '../components/DocumentOverviewChart';
import { QuickActions } from '../components/QuickActions';
import { AiAssistantPanel } from '../components/AiAssistantPanel';
import { workspaceApi } from '../api/workspaces';
import type { WorkspaceStats } from '../api/workspaces';
import { FileText, CheckCircle2, MessageSquare, Layers, ArrowUp, ArrowRight, MoreVertical, Loader2 } from 'lucide-react';
import type { NavItemKey } from '../types/dashboard';

interface DashboardViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { activeWorkspace } = useAuth();
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;

    let isMounted = true;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await workspaceApi.getStats(activeWorkspace.id);
        if (isMounted) {
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to load workspace stats', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspace]);

  // Compute display values
  const totalDocs = stats?.total_documents ?? 0;
  const processedDocs = stats?.processed_documents ?? 0;
  const storageMb = stats?.storage_used_mb ?? 0;
  const recentDocs = stats?.recent_documents ?? [];

  const statCardsData = [
    {
      id: 'total-documents',
      title: 'Total Documents',
      value: String(totalDocs),
      change: '+12%',
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'processed',
      title: 'Processed',
      value: String(processedDocs),
      change: '+8%',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'total-chats',
      title: 'Total Chats',
      value: '0',
      change: '+23%',
      icon: MessageSquare,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 'storage-used',
      title: 'Storage Used',
      value: `${storageMb} MB`,
      change: '+5%',
      icon: Layers,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const getFormatBadge = (mime: string, filename: string) => {
    if (mime.includes('pdf') || filename.endsWith('.pdf')) {
      return { label: 'PDF', style: 'bg-red-50 text-red-600 border border-red-200/60' };
    }
    if (mime.includes('word') || filename.endsWith('.docx')) {
      return { label: 'DOCX', style: 'bg-blue-50 text-blue-600 border border-blue-200/60' };
    }
    return { label: 'TXT', style: 'bg-slate-100 text-slate-700 border border-slate-200/60' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60">Processed</span>;
      case 'processing':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 border border-amber-200/60">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
      case 'failed':
        return <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200/60">Failed</span>;
      default:
        return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 border border-blue-200/60">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Greeting Banner */}
      <WelcomeBanner />

      {/* Active Workspace indicator */}
      {activeWorkspace && (
        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs border border-indigo-50">
          <span>
            Active Workspace: <strong className="text-indigo-600">{activeWorkspace.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => onNavigate('workspaces')}
            className="text-indigo-600 hover:underline"
          >
            Switch Workspace &rarr;
          </button>
        </div>
      )}

      {/* 2. Top Statistic Cards (4 cards) with live backend metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCardsData.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="flex items-center gap-4 rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${stat.iconBg} ${stat.iconColor} shadow-inner`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{stat.title}</p>
                <h3 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                  {loading ? '...' : stat.value}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Middle Section: Chart & Recent Documents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DocumentOverviewChart />
        </div>
        <div className="lg:col-span-5">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Recent Documents</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('documents')}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 transition hover:text-indigo-700"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Live Document List */}
            <div className="mt-3 flex-1 space-y-3">
              {recentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                  <FileText className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No documents uploaded yet in this workspace.</p>
                  <button
                    type="button"
                    onClick={() => onNavigate('documents')}
                    className="mt-3 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100"
                  >
                    Upload First Document
                  </button>
                </div>
              ) : (
                recentDocs.map((doc) => {
                  const badge = getFormatBadge(doc.mime_type, doc.original_filename);
                  return (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between rounded-xl p-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-12 items-center justify-center rounded-lg text-xs font-extrabold tracking-wider ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {doc.title}
                          </h4>
                          <p className="text-xs font-medium text-slate-400">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        <button
                          type="button"
                          onClick={() => onNavigate('documents')}
                          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Quick Actions & AI Assistant */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <QuickActions onNavigate={onNavigate} />
        </div>
        <div className="lg:col-span-6">
          <AiAssistantPanel onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};
