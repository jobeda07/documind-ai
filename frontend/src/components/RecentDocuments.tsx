import React from 'react';
import { FileText, ArrowRight, MoreVertical } from 'lucide-react';
import type { RecentDocumentItem } from '../types/dashboard';

export const RecentDocuments: React.FC = () => {
  const documents: RecentDocumentItem[] = [
    {
      id: 'doc-1',
      title: 'Laravel Development Guide.pdf',
      fileType: 'PDF',
      uploadedAt: 'Uploaded 2 hours ago',
      status: 'Processed',
    },
    {
      id: 'doc-2',
      title: 'Project Proposal.docx',
      fileType: 'DOCX',
      uploadedAt: 'Uploaded 1 day ago',
      status: 'Processed',
    },
    {
      id: 'doc-3',
      title: 'System Documentation.txt',
      fileType: 'TXT',
      uploadedAt: 'Uploaded 2 days ago',
      status: 'Processed',
    },
  ];

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-50 text-red-600 border border-red-200/60';
      case 'DOCX':
        return 'bg-blue-50 text-blue-600 border border-blue-200/60';
      case 'TXT':
        return 'bg-slate-100 text-slate-700 border border-slate-200/60';
      default:
        return 'bg-purple-50 text-purple-600 border border-purple-200/60';
    }
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Recent Documents</h3>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 transition hover:text-indigo-700"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Document List */}
      <div className="mt-3 flex-1 space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center justify-between rounded-xl p-2.5 transition hover:bg-slate-50"
          >
            {/* Left: Badge + Title + Subtitle */}
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-12 items-center justify-center rounded-lg text-xs font-extrabold tracking-wider shadow-2xs ${getBadgeStyle(
                  doc.fileType
                )}`}
              >
                {doc.fileType}
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {doc.title}
                </h4>
                <p className="text-xs font-medium text-slate-400">
                  {doc.uploadedAt}
                </p>
              </div>
            </div>

            {/* Right: Status Pill + Actions Menu */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60">
                {doc.status}
              </span>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
