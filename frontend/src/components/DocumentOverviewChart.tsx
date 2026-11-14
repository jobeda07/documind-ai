import React, { useState, useEffect } from 'react';
import { BarChart2, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analytics';
import type { TimelinePoint } from '../api/analytics';

export const DocumentOverviewChart: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const [timeRange, setTimeRange] = useState<'Last 7 Days' | 'Last 30 Days' | 'Last 90 Days'>('Last 30 Days');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  const rangeParam = timeRange === 'Last 7 Days' ? '7d' : timeRange === 'Last 90 Days' ? '90d' : '30d';

  useEffect(() => {
    if (!activeWorkspace) return;

    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await analyticsApi.getOverview(activeWorkspace.id, rangeParam);
        if (isMounted) {
          setTimeline(data.timeline);
        }
      } catch (e) {
        console.error('Failed to load chart analytics', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspace, rangeParam]);

  // SVG dimensions
  const width = 500;
  const height = 180;
  const bottomY = 160;
  const topY = 20;

  // Compute max Y value
  const maxDoc = Math.max(1, ...timeline.map((t) => t.documents));
  const maxChat = Math.max(1, ...timeline.map((t) => t.chats));
  const maxY = Math.max(maxDoc, maxChat, 5);

  // Compute SVG coordinates
  const pointsCount = Math.max(timeline.length, 2);
  const getX = (index: number) => 30 + (index / (pointsCount - 1)) * (width - 50);
  const getY = (val: number) => bottomY - (val / maxY) * (bottomY - topY);

  const docPoints = timeline.map((t, idx) => ({ x: getX(idx), y: getY(t.documents) }));
  const chatPoints = timeline.map((t, idx) => ({ x: getX(idx), y: getY(t.chats) }));

  // Helper to build smooth SVG path string
  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return `M 30,${bottomY} L 480,${bottomY}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      d += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${curr.x},${curr.y}`;
    }
    return d;
  };

  const docPath = buildSmoothPath(docPoints);
  const docArea = `${docPath} L ${getX(pointsCount - 1)},${bottomY} L ${getX(0)},${bottomY} Z`;

  const chatPath = buildSmoothPath(chatPoints);
  const chatArea = `${chatPath} L ${getX(pointsCount - 1)},${bottomY} L ${getX(0)},${bottomY} Z`;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <BarChart2 className="h-4 w-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Document Overview</h3>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 ml-1" />}
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
              {(['Last 7 Days', 'Last 30 Days', 'Last 90 Days'] as const).map((range) => (
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
          <span>Documents Uploaded</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-600" />
          <span>AI Chats Initiated</span>
        </div>
      </div>

      {/* Interactive / Vector SVG Graph */}
      <div className="relative mt-2 w-full flex-1">
        <div className="flex">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between pr-2 text-[11px] font-semibold text-slate-400">
            <span>{maxY}</span>
            <span>{Math.round(maxY * 0.66)}</span>
            <span>{Math.round(maxY * 0.33)}</span>
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
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradient for Purple Chats Area */}
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.20" />
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

              {/* Dots on points */}
              {docPoints.map((p, i) => (
                <circle key={`doc-${i}`} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />
              ))}
              {chatPoints.map((p, i) => (
                <circle key={`chat-${i}`} cx={p.x} cy={p.y} r="3" fill="#8b5cf6" />
              ))}
            </svg>
          </div>
        </div>

        {/* X-Axis Labels */}
        <div className="mt-2 flex justify-between pl-8 pr-2 text-[11px] font-semibold text-slate-400">
          {timeline.length > 0 ? (
            timeline.map((point, index) => (
              <span key={index}>{point.date}</span>
            ))
          ) : (
            <>
              <span>Start</span>
              <span>Middle</span>
              <span>Now</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
