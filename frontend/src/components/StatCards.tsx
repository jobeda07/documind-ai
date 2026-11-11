import React from 'react';
import { FileText, CheckCircle2, MessageSquare, Layers, ArrowUp } from 'lucide-react';

export const StatCards: React.FC = () => {
  const stats = [
    {
      id: 'total-documents',
      title: 'Total Documents',
      value: '24',
      change: '+12%',
      icon: FileText,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: 'processed',
      title: 'Processed',
      value: '22',
      change: '+8%',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'total-chats',
      title: 'Total Chats',
      value: '156',
      change: '+23%',
      icon: MessageSquare,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      id: 'storage-used',
      title: 'Storage Used',
      value: '245 MB',
      change: '+5%',
      icon: Layers,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="flex items-center gap-4 rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs transition hover:shadow-md"
          >
            {/* Soft colored icon tile */}
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${stat.iconBg} ${stat.iconColor} shadow-inner`}
            >
              <Icon className="h-7 w-7" />
            </div>

            {/* Stat Information */}
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                {stat.title}
              </p>
              <h3 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
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
  );
};
