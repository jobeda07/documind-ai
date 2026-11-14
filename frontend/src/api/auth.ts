import { apiClient } from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'deactivated';
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
  token?: string;
  default_workspace?: Workspace;
  workspaces?: Workspace[];
  requires_approval?: boolean;
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'deactivated';
  workspaces_count: number;
  created_at: string;
}

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<{ success: boolean; data: AuthResponse; message: string }>('/auth/register', data);
    return res.data;
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

  // Admin APIs
  listUsers: async (): Promise<AdminUserItem[]> => {
    const res = await apiClient.get<{ success: boolean; data: AdminUserItem[] }>('/admin/users');
    return res.data.data;
  },

  updateUserStatus: async (userId: number, status: 'active' | 'deactivated' | 'pending'): Promise<User> => {
    const res = await apiClient.patch<{ success: boolean; data: User }>(`/admin/users/${userId}/status`, { status });
    return res.data.data;
  },

  updateUserRole: async (userId: number, role: 'admin' | 'user'): Promise<User> => {
    const res = await apiClient.patch<{ success: boolean; data: User }>(`/admin/users/${userId}/role`, { role });
    return res.data.data;
  },
};
