import { apiClient } from './client';

export interface SearchDocumentResult {
  id: number;
  uuid: string;
  title: string;
  original_filename: string;
  mime_type: string;
  page_count: number;
  status: string;
  created_at: string;
}

export interface SearchChunkResult {
  id: number;
  chunk_index: number;
  page_number: number;
  content_snippet: string;
  similarity: number;
  document: {
    id: number;
    title: string;
    filename: string;
  };
}

export interface SearchResponse {
  query: string;
  documents: SearchDocumentResult[];
  chunks: SearchChunkResult[];
}

export const searchApi = {
  search: async (workspaceId: number, query: string, limit: number = 8): Promise<SearchResponse> => {
    const res = await apiClient.get(`/workspaces/${workspaceId}/search`, {
      params: { q: query, limit },
    });
    return res.data.data;
  },
};
