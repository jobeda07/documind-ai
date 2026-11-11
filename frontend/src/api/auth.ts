import { apiClient } from './client';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  owner_id: number;
  pivot?: {
    role: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  default_workspace?: Workspace;
  workspaces?: Workspace[];
}

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    return res.data.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    return res.data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; data: { user: User; workspaces: Workspace[] } }>('/auth/me');
    return res.data.data;
  },
};
