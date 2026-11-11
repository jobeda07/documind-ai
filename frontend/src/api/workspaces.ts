import { apiClient } from './client';
import type { Workspace } from './auth';

export interface WorkspaceStats {
  total_documents: number;
  processed_documents: number;
  total_chats: number;
  storage_used_bytes: number;
  storage_used_mb: number;
  recent_documents: {
    id: number;
    uuid: string;
    title: string;
    original_filename: string;
    mime_type: string;
    file_size: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
  }[];
}

export const workspaceApi = {
  list: async () => {
    const res = await apiClient.get<{ success: boolean; data: Workspace[] }>('/workspaces');
    return res.data.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: Workspace }>('/workspaces', data);
    return res.data.data;
  },

  getStats: async (workspaceId: number) => {
    const res = await apiClient.get<{ success: boolean; data: WorkspaceStats }>(
      `/workspaces/${workspaceId}/stats`
    );
    return res.data.data;
  },

  delete: async (workspaceId: number) => {
    await apiClient.delete(`/workspaces/${workspaceId}`);
  },
};
