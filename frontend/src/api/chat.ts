import { apiClient } from './client';

export interface CitationItem {
  index: number;
  label: string;
  document_id: number;
  document_title: string;
  filename: string;
  page_number: number;
  chunk_index: number;
  similarity: number;
  content_snippet: string;
}

export interface MessageItem {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: CitationItem[] | null;
  metadata?: {
    model?: string;
    has_grounding?: boolean;
    chunks_retrieved?: number;
  } | null;
  created_at: string;
}

export interface ConversationItem {
  id: number;
  uuid: string;
  workspace_id: number;
  user_id: number;
  title: string;
  messages_count?: number;
  messages?: MessageItem[];
  created_at: string;
  updated_at: string;
}

export const chatApi = {
  list: async (workspaceId: number): Promise<ConversationItem[]> => {
    const res = await apiClient.get(`/workspaces/${workspaceId}/conversations`);
    return res.data.data;
  },

  create: async (workspaceId: number, title?: string): Promise<ConversationItem> => {
    const res = await apiClient.post(`/workspaces/${workspaceId}/conversations`, { title });
    return res.data.data;
  },

  get: async (workspaceId: number, conversationId: number): Promise<ConversationItem> => {
    const res = await apiClient.get(`/workspaces/${workspaceId}/conversations/${conversationId}`);
    return res.data.data;
  },

  sendMessage: async (
    workspaceId: number,
    conversationId: number,
    content: string
  ): Promise<{ user_message: MessageItem; assistant_message: MessageItem }> => {
    const res = await apiClient.post(`/workspaces/${workspaceId}/conversations/${conversationId}/messages`, {
      content,
    });
    return res.data.data;
  },

  delete: async (workspaceId: number, conversationId: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/conversations/${conversationId}`);
  },
};
