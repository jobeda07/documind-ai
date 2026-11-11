import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';

export const AiAssistantPanel: React.FC = () => {
  const [query, setQuery] = useState('');

  const suggestions = [
    'Summarize this document',
    'Find key points',
    'Compare documents',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // UI demo behavior
    setQuery('');
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-50/80 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Bot className="h-4 w-4" />
        </div>
        <h3 className="text-base font-bold text-slate-900">AI Assistant</h3>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="relative mt-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about your documents..."
          className="w-full rounded-2xl border border-indigo-100 bg-[#f7f8fd] py-3 pr-12 pl-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100 sm:text-sm"
        />
        <button
          type="submit"
          className="absolute top-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95 active:scale-95"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuery(suggestion)}
            className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
