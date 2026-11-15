import { apiClient } from './client';

export interface AiSettingsData {
  active_llm_provider: 'ollama' | 'openai' | 'gemini' | 'claude' | 'mock';
  active_embedding_provider: 'ollama' | 'openai' | 'gemini' | 'mock';

  // OpenAI
  openai_has_key: boolean;
  openai_masked_key: string | null;
  openai_api_key?: string;
  openai_llm_model: string;
  openai_embedding_model: string;

  // Gemini
  gemini_has_key: boolean;
  gemini_masked_key: string | null;
  gemini_api_key?: string;
  gemini_llm_model: string;
  gemini_embedding_model: string;

  // Claude
  claude_has_key: boolean;
  claude_masked_key: string | null;
  claude_api_key?: string;
  claude_llm_model: string;

  // Ollama
  ollama_base_url: string;
  ollama_llm_model: string;
  ollama_embedding_model: string;

  // Hyperparameters
  temperature: number;
  max_tokens: number;
  updated_at?: string;
}

export interface TestConnectionPayload {
  provider: 'openai' | 'gemini' | 'claude' | 'ollama';
  api_key?: string;
  model?: string;
  base_url?: string;
}

export interface TestConnectionResponse {
  provider: string;
  latency_ms: number;
  reply: string;
}

export const aiSettingsApi = {
  get: async (): Promise<AiSettingsData> => {
    const res = await apiClient.get<{ success: boolean; data: AiSettingsData }>('/admin/ai-settings');
    return res.data.data;
  },

  update: async (data: Partial<AiSettingsData>): Promise<AiSettingsData> => {
    const res = await apiClient.put<{ success: boolean; data: AiSettingsData }>('/admin/ai-settings', data);
    return res.data.data;
  },

  testConnection: async (payload: TestConnectionPayload): Promise<TestConnectionResponse> => {
    const res = await apiClient.post<{ success: boolean; data: TestConnectionResponse; message: string }>(
      '/admin/ai-settings/test-connection',
      payload
    );
    return res.data.data;
  },
};
