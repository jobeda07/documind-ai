import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchApi } from '../api/search';
import type { SearchResponse } from '../api/search';
import {
  Search,
  X,
  FileText,
  Sparkles,
  Loader2,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import type { NavItemKey } from '../types/dashboard';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavItemKey) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { activeWorkspace } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // open if controlled outside
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !activeWorkspace || !query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchApi.search(activeWorkspace.id, query.trim());
        setResults(data);
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen, activeWorkspace]);

  if (!isOpen) return null;

  const handleDocumentClick = () => {
    onClose();
    onNavigate('documents');
  };

  const handleChunkClick = () => {
    onClose();
    onNavigate('chat');
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-20 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-2xl transition-all">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-100 px-4 py-3.5">
          <Search className="h-5 w-5 text-indigo-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents or query semantic intelligence... (e.g. 'VAT', 'leave')"
            autoFocus
            className="w-full bg-transparent px-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mr-2" />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type keywords or questions to search across all uploaded files and vectorized chunks.
            </div>
          ) : results && results.documents.length === 0 && results.chunks.length === 0 && !loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching documents or vector chunks found for "{query}".
            </div>
          ) : (
            <>
              {/* Document Results */}
              {results && results.documents.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Matching Documents ({results.documents.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {results.documents.map((doc) => {
                      const badge = getFormatBadge(doc.mime_type, doc.original_filename);
                      return (
                        <div
                          key={doc.id}
                          onClick={handleDocumentClick}
                          className="flex cursor-pointer items-center justify-between rounded-2xl p-2.5 transition hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`rounded-lg px-2 py-1 text-xs font-bold ${badge.style}`}>
                              {badge.label}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                              <p className="text-[11px] text-slate-400">
                                {doc.page_count} pages • {doc.status}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Semantic Chunks Results */}
              {results && results.chunks.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Semantic Vector Matches ({results.chunks.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {results.chunks.map((chk) => (
                      <div
                        key={chk.id}
                        onClick={handleChunkClick}
                        className="cursor-pointer rounded-2xl border border-indigo-100/70 bg-[#f9fafc] p-3 transition hover:border-indigo-300 hover:bg-white shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span className="truncate max-w-xs">{chk.document.title}</span>
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-800">
                            Page {chk.page_number} • {Math.round(chk.similarity * 100)}% Match
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                          "{chk.content_snippet}"
                        </p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                          <MessageSquare className="h-3 w-3" />
                          <span>Ask about this in Chat &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500">
          <span>Search powered by pgvector 384d semantic embedding</span>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-white px-1.5 py-0.5 border border-slate-200 text-slate-600 font-mono">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
