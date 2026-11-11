import { apiClient } from './client';

export interface DocumentItem {
  id: number;
  uuid: string;
  workspace_id: number;
  user_id: number;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  page_count: number;
  word_count: number;
  character_count: number;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DocumentListResponse {
  data: DocumentItem[];
  current_page: number;
  last_page: number;
  total: number;
}

export const documentApi = {
  list: async (workspaceId: number, search?: string, status?: string) => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;

    const res = await apiClient.get<{ success: boolean; data: DocumentListResponse }>(
      `/workspaces/${workspaceId}/documents`,
      { params }
    );
    return res.data.data;
  },

  upload: async (workspaceId: number, file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await apiClient.post<{ success: boolean; data: DocumentItem }>(
      `/workspaces/${workspaceId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data.data;
  },

  reprocess: async (workspaceId: number, documentId: number) => {
    const res = await apiClient.post<{ success: boolean; data: DocumentItem }>(
      `/workspaces/${workspaceId}/documents/${documentId}/reprocess`
    );
    return res.data.data;
  },

  delete: async (workspaceId: number, documentId: number) => {
    await apiClient.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
  },
};
