import React from 'react';
import { Zap, UploadCloud, MessageSquare, Search, LayoutGrid } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const actions = [
    {
      id: 'upload',
      title: 'Upload Document',
      icon: UploadCloud,
      cardBg: 'bg-[#ede9fe] hover:bg-[#e4ddfd]',
      iconBg: 'bg-purple-600 text-white',
      textColor: 'text-purple-900',
    },
    {
      id: 'chat',
      title: 'Start Chat',
      icon: MessageSquare,
      cardBg: 'bg-[#e0f2fe] hover:bg-[#d0ecfd]',
      iconBg: 'bg-blue-600 text-white',
      textColor: 'text-blue-900',
    },
    {
      id: 'search',
      title: 'Search Documents',
      icon: Search,
      cardBg: 'bg-[#dcfce7] hover:bg-[#cbf7da]',
      iconBg: 'bg-emerald-600 text-white',
      textColor: 'text-emerald-900',
    },
    {
      id: 'workspaces',
      title: 'Manage Workspaces',
      icon: LayoutGrid,
      cardBg: 'bg-[#ffedd5] hover:bg-[#fedec2]',
      iconBg: 'bg-amber-600 text-white',
      textColor: 'text-amber-900',
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Zap className="h-4 w-4" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
      </div>

      {/* Grid of 4 Action Tiles */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl p-4 text-center transition-all duration-200 active:scale-97 ${act.cardBg}`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xs ${act.iconBg}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-bold leading-tight ${act.textColor}`}>
                {act.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
