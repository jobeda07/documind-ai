import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import type { User, Workspace } from '../api/auth';
import { workspaceApi } from '../api/workspaces';

interface AuthContextType {
  user: User | null;
  token: string | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<{ requires_approval: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  quickDemoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('documind_token'));
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize user profile from token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('documind_token');
      if (storedToken) {
        try {
          const data = await authApi.getMe();
          setUser(data.user);
          setWorkspaces(data.workspaces);
          if (data.workspaces.length > 0) {
            setActiveWorkspace(data.workspaces[0]);
          }
        } catch {
          localStorage.removeItem('documind_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res.token) {
      localStorage.setItem('documind_token', res.token);
      setToken(res.token);
    }
    setUser(res.user);
    if (res.workspaces) {
      setWorkspaces(res.workspaces);
      if (res.workspaces.length > 0) {
        setActiveWorkspace(res.workspaces[0]);
      }
    }
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const res = await authApi.register(data);
    if (res.data.token) {
      localStorage.setItem('documind_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.default_workspace) {
        setWorkspaces([res.data.default_workspace]);
        setActiveWorkspace(res.data.default_workspace);
      }
    }
    return {
      requires_approval: !!res.data.requires_approval,
      message: res.message,
    };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem('documind_token');
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
  };

  const refreshWorkspaces = async () => {
    if (!token) return;
    try {
      const list = await workspaceApi.list();
      setWorkspaces(list);
      if (list.length > 0 && (!activeWorkspace || !list.some((w) => w.id === activeWorkspace.id))) {
        setActiveWorkspace(list[0]);
      }
    } catch (e) {
      console.error('Failed to refresh workspaces', e);
    }
  };

  // Quick Demo Login: automatically logs in with the seeded administrator account
  const quickDemoLogin = async () => {
    await login({ email: 'admin@documind.com', password: 'secret' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        workspaces,
        activeWorkspace,
        loading,
        setActiveWorkspace,
        login,
        register,
        logout,
        refreshWorkspaces,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
