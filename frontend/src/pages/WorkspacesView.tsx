import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { workspaceApi } from '../api/workspaces';
import { LayoutGrid, Plus, Check, Trash2, AlertCircle, Loader2 } from 'lucide-react';

export const WorkspacesView: React.FC = () => {
  const { workspaces, activeWorkspace, setActiveWorkspace, refreshWorkspaces, user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const newWs = await workspaceApi.create({ name, description });
      await refreshWorkspaces();
      setActiveWorkspace(newWs);
      setName('');
      setDescription('');
      setShowCreateModal(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create workspace.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, wsName: string) => {
    if (!confirm(`Are you sure you want to delete workspace "${wsName}"? All documents inside will be deleted.`)) return;

    try {
      await workspaceApi.delete(id);
      await refreshWorkspaces();
    } catch (e) {
      console.error('Delete workspace failed', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Management</h2>
          <p className="text-xs font-medium text-slate-500">
            Create, switch, and organize your document collections across separate workspaces.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => {
          const isActive = activeWorkspace?.id === ws.id;
          const isOwner = ws.owner_id === user?.id;

          return (
            <div
              key={ws.id}
              className={`flex flex-col justify-between rounded-3xl border p-6 transition-all duration-200 ${
                isActive
                  ? 'border-indigo-400 bg-white shadow-md ring-2 ring-indigo-100'
                  : 'border-slate-100 bg-white shadow-xs hover:border-indigo-200 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900">{ws.name}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {ws.description || 'No description provided.'}
                </p>
                <div className="mt-3 text-[11px] font-semibold text-slate-400">
                  Slug: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{ws.slug}</code>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveWorkspace(ws)}
                  disabled={isActive}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {isActive ? 'Current' : 'Select'}
                </button>

                {isOwner && workspaces.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ws.id, ws.name)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete workspace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Create New Workspace</h3>
            <p className="text-xs text-slate-500 mt-1">
              Give your workspace a name and description to organize your documents.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Legal Research & Contracts"
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the documents and purpose of this workspace..."
                  className="mt-1 w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
