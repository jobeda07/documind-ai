import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { documentApi } from '../api/documents';
import type { DocumentItem } from '../api/documents';
import {
  UploadCloud,
  Search,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileCheck,
  Layers,
  X,
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Chunks inspection modal state
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [chunksPayload, setChunksPayload] = useState<{
    document: {
      id: number;
      title: string;
      original_filename: string;
      status: string;
      total_chunks: number;
      page_count: number;
    };
    chunks: Array<{
      id: number;
      chunk_index: number;
      page_number: number;
      content: string;
      token_count: number;
      metadata: Record<string, unknown>;
      created_at: string;
    }>;
  } | null>(null);

  const handleOpenChunks = async (docId: number) => {
    if (!activeWorkspace) return;
    try {
      setChunksModalOpen(true);
      setLoadingChunks(true);
      const data = await documentApi.getChunks(activeWorkspace.id, docId);
      setChunksPayload(data);
    } catch (e) {
      console.error('Failed to load chunks', e);
    } finally {
      setLoadingChunks(false);
    }
  };

  // File upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const res = await documentApi.list(activeWorkspace.id, search, statusFilter);
      setDocuments(res.data);
    } catch (e) {
      console.error('Failed to fetch documents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeWorkspace, statusFilter]);

  // Polling: Auto-refresh if any document is currently pending or processing
  useEffect(() => {
    const hasUnfinished = documents.some((d) => d.status === 'processing' || d.status === 'pending');
    if (!hasUnfinished || !activeWorkspace) return;

    const timer = setInterval(() => {
      documentApi.list(activeWorkspace.id, search, statusFilter).then((res) => {
        setDocuments(res.data);
      }).catch(() => {});
    }, 3000);

    return () => clearInterval(timer);
  }, [documents, activeWorkspace, search, statusFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeWorkspace) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await documentApi.upload(activeWorkspace.id, selectedFile, customTitle);
      setUploadSuccess(`Document "${selectedFile.name}" uploaded and queued for text extraction!`);
      setSelectedFile(null);
      setCustomTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchDocuments();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setUploadError(axiosErr.response?.data?.message || 'Upload failed. Allowed formats: PDF, DOCX, TXT (Max 20MB)');
    } finally {
      setUploading(false);
    }
  };

  const handleReprocess = async (docId: number) => {
    if (!activeWorkspace) return;
    try {
      await documentApi.reprocess(activeWorkspace.id, docId);
      fetchDocuments();
    } catch (e) {
      console.error('Reprocess failed', e);
    }
  };

  const handleDelete = async (docId: number, title: string) => {
    if (!activeWorkspace) return;
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await documentApi.delete(activeWorkspace.id, docId);
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const getFormatBadge = (mime: string, filename: string) => {
    if (mime.includes('pdf') || filename.endsWith('.pdf')) {
      return { label: 'PDF', style: 'bg-red-50 text-red-600 border border-red-200/60' };
    }
    if (mime.includes('word') || filename.endsWith('.docx')) {
      return { label: 'DOCX', style: 'bg-blue-50 text-blue-600 border border-blue-200/60' };
    }
    return { label: 'TXT', style: 'bg-slate-100 text-slate-700 border border-slate-200/60' };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Document Management</h2>
          <p className="text-xs font-medium text-slate-500">
            Upload, extract text, and monitor background processing status in{' '}
            <strong className="text-indigo-600">{activeWorkspace?.name || 'Workspace'}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDocuments}
          className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Upload Box Card */}
      <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-indigo-600" />
          <span>Upload Document (PDF, DOCX, TXT)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Documents will be securely stored on private storage and parsed through the queue.
        </p>

        {uploadError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 border border-emerald-200">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select File</label>
              <input
                ref={fileInputRef}
                type="file"
                required
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Custom Title (Optional)</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Defaults to original filename"
                className="w-full rounded-xl border border-slate-200 py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading & Queueing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
            placeholder="Search documents by title or filename..."
            className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed (Processed)</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xs">
        {documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileCheck className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No documents found</h4>
            <p className="text-xs text-slate-500 mt-1">Upload a PDF, DOCX, or TXT file above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Title & Filename</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Pages / Words</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {documents.map((doc) => {
                  const badge = getFormatBadge(doc.mime_type, doc.original_filename);
                  return (
                    <tr key={doc.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-[11px] font-bold ${badge.style}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{doc.title}</div>
                        <div className="text-[11px] text-slate-400">{doc.original_filename}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatFileSize(doc.file_size)}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'} • {doc.word_count} words
                      </td>
                      <td className="px-5 py-4">
                        {doc.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60">
                            <CheckCircle className="h-3 w-3" /> Processed
                          </span>
                        )}
                        {doc.status === 'processing' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 border border-amber-200/60">
                            <Loader2 className="h-3 w-3 animate-spin" /> Processing
                          </span>
                        )}
                        {doc.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 border border-blue-200/60">
                            Pending
                          </span>
                        )}
                        {doc.status === 'failed' && (
                          <span
                            title={doc.error_message || 'Processing failed'}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200/60 cursor-help"
                          >
                            <AlertCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenChunks(doc.id)}
                            title="Inspect vector chunks"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition"
                          >
                            <Layers className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReprocess(doc.id)}
                            title="Re-run text extraction"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id, doc.title)}
                            title="Delete document"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chunks Inspection Modal */}
      {chunksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-indigo-100 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {chunksPayload?.document.title || 'Document Vector Chunks'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {chunksPayload?.document.original_filename} • {chunksPayload?.document.total_chunks} Total Chunks • pgvector 384d
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChunksModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingChunks ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
                  <span>Loading chunks from pgvector...</span>
                </div>
              ) : !chunksPayload || chunksPayload.chunks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No chunks generated yet for this document. It may still be processing.
                </div>
              ) : (
                chunksPayload.chunks.map((chk) => (
                  <div
                    key={chk.id}
                    className="rounded-2xl border border-slate-100 bg-[#f9fafc] p-4 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="rounded-md bg-purple-100 px-2 py-0.5 text-purple-800">
                        Chunk #{chk.chunk_index + 1}
                      </span>
                      <span>Page {chk.page_number}</span>
                      <span>~{chk.token_count} Tokens</span>
                    </div>
                    <p className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                      {chk.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 rounded-b-3xl">
              <span>Indexed with HNSW Cosine Similarity for RAG</span>
              <button
                type="button"
                onClick={() => setChunksModalOpen(false)}
                className="rounded-xl bg-slate-200 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
