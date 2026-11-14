import { apiClient } from './client';

export interface TimelinePoint {
  date: string;
  raw_date: string;
  documents: number;
  chats: number;
}

export interface MimeBreakdownItem {
  format: 'PDF' | 'DOCX' | 'TXT';
  count: number;
  size_mb: number;
}

export interface AnalyticsOverviewData {
  range: string;
  timeline: TimelinePoint[];
  mime_breakdown: MimeBreakdownItem[];
  status_summary: {
    completed: number;
    processing: number;
    pending: number;
    failed: number;
  };
  total_chunks: number;
  avg_chunks_per_doc: number;
}

export const analyticsApi = {
  getOverview: async (workspaceId: number, range: string = '30d'): Promise<AnalyticsOverviewData> => {
    const res = await apiClient.get(`/workspaces/${workspaceId}/analytics?range=${range}`);
    return res.data.data;
  },
};
