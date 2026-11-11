import React, { useState } from 'react';
import { BarChart2, ChevronDown } from 'lucide-react';

export const DocumentOverviewChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  // SVG dimensions & grid
  const width = 500;
  const height = 180;

  // Blue curve: Documents
  // Path points (x, y) coordinates mapped into SVG space
  const docPath = 'M 30,120 C 70,110 110,65 150,60 C 190,55 230,85 270,75 C 310,65 350,55 390,50 C 430,45 460,25 480,20';
  const docArea = `${docPath} L 480,160 L 30,160 Z`;

  // Purple curve: Chats
  const chatPath = 'M 30,140 C 70,145 110,120 150,90 C 190,75 230,110 270,85 C 310,75 350,105 390,95 C 430,90 460,65 480,45';
  const chatArea = `${chatPath} L 480,160 L 30,160 Z`;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart2 className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Document Overview</h3>
        </div>

        {/* Dropdown Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpenDropdown(!isOpenDropdown)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <span>{timeRange}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>
          {isOpenDropdown && (
            <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
              {['Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => {
                    setTimeRange(range);
                    setIsOpenDropdown(false);
                  }}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition ${
                    timeRange === range
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-5 pt-3 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>Documents</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
          <span>Chats</span>
        </div>
      </div>

      {/* Interactive / Vector SVG Graph */}
      <div className="relative mt-2 w-full flex-1">
        <div className="flex">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between pr-2 text-[11px] font-semibold text-slate-400">
            <span>150</span>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          {/* SVG Canvas with Grid Lines */}
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-44 w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gradient for Blue Documents Area */}
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradient for Purple Chats Area */}
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="20" x2={width} y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="65" x2={width} y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="110" x2={width} y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="160" x2={width} y2="160" stroke="#e2e8f0" strokeWidth="1" />

              {/* Gradient Area Fills */}
              <path d={docArea} fill="url(#blueGradient)" />
              <path d={chatArea} fill="url(#purpleGradient)" />

              {/* Smooth Spline Curves */}
              <path
                d={docPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={chatPath}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* X-Axis Labels */}
        <div className="mt-2 flex justify-between pl-8 pr-2 text-[11px] font-semibold text-slate-400">
          <span>Apr 1</span>
          <span>Apr 8</span>
          <span>Apr 15</span>
          <span>Apr 22</span>
          <span>Apr 30</span>
        </div>
      </div>
    </div>
  );
};
