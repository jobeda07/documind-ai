import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import type { AdminUserItem } from '../api/auth';
import {
  Users,
  ShieldCheck,
  CheckCircle,
  Ban,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await authApi.listUsers();
      setUsers(list);
    } catch (e) {
      console.error('Failed to load user list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: number, newStatus: 'active' | 'deactivated' | 'pending') => {
    try {
      setUpdatingId(userId);
      setActionMessage(null);
      await authApi.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      setActionMessage(`User status updated to "${newStatus}".`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr.response?.data?.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      setUpdatingId(userId);
      setActionMessage(null);
      await authApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setActionMessage(`User role updated to "${newRole}".`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      alert(axiosErr.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Access Denied</h3>
        <p className="text-xs text-slate-500 mt-1">
          Administrator privileges are required to view and manage platform users.
        </p>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const deactivatedCount = users.filter((u) => u.status === 'deactivated').length;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management & Approval</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve newly registered accounts, assign administrative roles, or deactivate users.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {actionMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {actionMessage}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-400">Total Users</p>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">{totalUsers}</h3>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-medium text-emerald-700">Active (Approved)</p>
          <h3 className="text-xl font-bold text-emerald-800 mt-0.5">{activeCount}</h3>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs font-medium text-amber-700">Pending Approval</p>
          <h3 className="text-xl font-bold text-amber-800 mt-0.5">{pendingCount}</h3>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 shadow-xs">
          <p className="text-xs font-medium text-rose-700">Deactivated</p>
          <h3 className="text-xl font-bold text-rose-800 mt-0.5">{deactivatedCount}</h3>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Workspaces</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => {
                const isUpdating = updatingId === u.id;
                const isSelf = user?.id === u.id;

                return (
                  <tr key={u.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700">
                          {u.name[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {u.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                        <span className="capitalize">{u.role}</span>
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {u.status === 'active' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      )}
                      {u.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200 animate-pulse">
                          <Clock className="h-3 w-3" /> Pending Approval
                        </span>
                      )}
                      {u.status === 'deactivated' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                          <Ban className="h-3 w-3" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {u.workspaces_count} workspace(s)
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {isSelf ? (
                        <span className="text-[11px] italic text-slate-400 font-normal">
                          (Your Account)
                        </span>
                      ) : isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600 inline-block" />
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve if pending */}
                          {u.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'active')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                            >
                              Approve
                            </button>
                          )}

                          {/* Deactivate if active */}
                          {u.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'deactivated')}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Deactivate
                            </button>
                          )}

                          {/* Activate if deactivated */}
                          {u.status === 'deactivated' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'active')}
                              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition"
                            >
                              Re-activate
                            </button>
                          )}

                          {/* Role Toggle */}
                          <button
                            type="button"
                            onClick={() => handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                          >
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
