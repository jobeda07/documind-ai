import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Eye,
  EyeOff,
  Server,
  Layers,
} from 'lucide-react';
import { aiSettingsApi, type AiSettingsData } from '../api/aiSettings';

export const AdminAiSettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AiSettingsData | null>(null);

  // Form states for API Keys (user edits)
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');

  // Visibility toggles for keys
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);

  // Connection testing states
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latency_ms?: number }>>({});

  // Feedback notifications
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await aiSettingsApi.get();
      setSettings(data);
      // Pre-fill masked keys if available
      setOpenaiKey(data.openai_masked_key || '');
      setGeminiKey(data.gemini_masked_key || '');
      setClaudeKey(data.claude_masked_key || '');
    } catch (err: unknown) {
      console.error('Failed to load AI settings', err);
      setSaveError('Failed to load AI settings from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setSaveSuccess(null);
      setSaveError(null);

      const payload: Partial<AiSettingsData> = {
        active_llm_provider: settings.active_llm_provider,
        active_embedding_provider: settings.active_embedding_provider,
        openai_llm_model: settings.openai_llm_model,
        openai_embedding_model: settings.openai_embedding_model,
        gemini_llm_model: settings.gemini_llm_model,
        gemini_embedding_model: settings.gemini_embedding_model,
        claude_llm_model: settings.claude_llm_model,
        ollama_base_url: settings.ollama_base_url,
        ollama_llm_model: settings.ollama_llm_model,
        ollama_embedding_model: settings.ollama_embedding_model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
      };

      // Only pass API keys if user changed them from masked format
      if (openaiKey && !openaiKey.includes('••••')) {
        payload.openai_api_key = openaiKey;
      }
      if (geminiKey && !geminiKey.includes('••••')) {
        payload.gemini_api_key = geminiKey;
      }
      if (claudeKey && !claudeKey.includes('••••')) {
        payload.claude_api_key = claudeKey;
      }

      const updated = await aiSettingsApi.update(payload);
      setSettings((prev) => (prev ? { ...prev, ...updated } : null));
      setSaveSuccess('AI Provider settings and API keys updated successfully!');

      // Update masked keys
      if (updated.openai_masked_key) setOpenaiKey(updated.openai_masked_key);
      if (updated.gemini_masked_key) setGeminiKey(updated.gemini_masked_key);
      if (updated.claude_masked_key) setClaudeKey(updated.claude_masked_key);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSaveError(axiosErr.response?.data?.message || 'Failed to update AI settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider: 'openai' | 'gemini' | 'claude' | 'ollama') => {
    if (!settings) return;

    setTestingProvider(provider);
    setTestResults((prev) => ({ ...prev, [provider]: { success: false, message: 'Testing connection...' } }));

    try {
      let keyToTest: string | undefined = undefined;
      if (provider === 'openai' && openaiKey && !openaiKey.includes('••••')) keyToTest = openaiKey;
      if (provider === 'gemini' && geminiKey && !geminiKey.includes('••••')) keyToTest = geminiKey;
      if (provider === 'claude' && claudeKey && !claudeKey.includes('••••')) keyToTest = claudeKey;

      const res = await aiSettingsApi.testConnection({
        provider,
        api_key: keyToTest,
        model:
          provider === 'openai'
            ? settings.openai_llm_model
            : provider === 'gemini'
            ? settings.gemini_llm_model
            : provider === 'claude'
            ? settings.claude_llm_model
            : settings.ollama_llm_model,
        base_url: provider === 'ollama' ? settings.ollama_base_url : undefined,
      });

      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: true,
          latency_ms: res.latency_ms,
          message: `Connected! (${res.latency_ms}ms) Response: "${res.reply.slice(0, 60)}"`,
        },
      }));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: axiosErr.response?.data?.message || 'Connection failed. Check API key and network.',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading AI Provider Configurations...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Page Title & Summary */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Providers & API Keys</h1>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
              Admin Gateway
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure cloud AI API keys (OpenAI, Google Gemini, Anthropic Claude) or local Ollama runtime. Changes apply instantly across all RAG chat sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 sm:self-auto cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Active LLM Selection */}
        <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Active Chat & RAG Generation LLM</h3>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Select the active language model provider that powers all conversation answers and grounded citations.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: 'ollama',
                name: 'Local Ollama',
                desc: 'qwen2.5:1.5b (100% offline, zero API bill)',
                icon: Server,
                color: 'from-amber-500 to-orange-600',
              },
              {
                id: 'openai',
                name: 'OpenAI',
                desc: 'gpt-4o-mini / gpt-4o (State of the art)',
                icon: Sparkles,
                color: 'from-emerald-500 to-teal-600',
              },
              {
                id: 'gemini',
                name: 'Google Gemini',
                desc: 'gemini-1.5-flash / pro (Speed & 1M context)',
                icon: Globe,
                color: 'from-blue-500 to-indigo-600',
              },
              {
                id: 'claude',
                name: 'Anthropic Claude',
                desc: 'claude-3-5-haiku / sonnet (Superior reasoning)',
                icon: Cpu,
                color: 'from-purple-500 to-pink-600',
              },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = settings.active_llm_provider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSettings({ ...settings, active_llm_provider: p.id as any })}
                  className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${p.color} text-white shadow-xs`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    <p className="mt-1 text-[11px] leading-tight text-slate-500">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Active Embedding Provider */}
        <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Active Vector Embedding Provider</h3>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Embeddings generate 384-dimensional dense vectors stored in PostgreSQL <code className="text-indigo-600 font-mono">pgvector</code>.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                id: 'ollama',
                name: 'Ollama all-minilm',
                desc: '384 dimensions (Local runtime, zero external network)',
              },
              {
                id: 'openai',
                name: 'OpenAI text-embedding-3-small',
                desc: '384 dimensions (High semantic density via OpenAI API)',
              },
              {
                id: 'gemini',
                name: 'Google Gemini text-embedding-004',
                desc: '384 dimensions (Google embedding API)',
              },
            ].map((e) => {
              const isSelected = settings.active_embedding_provider === e.id;
              return (
                <div
                  key={e.id}
                  onClick={() => setSettings({ ...settings, active_embedding_provider: e.id as any })}
                  className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">{e.name}</h4>
                    {isSelected && (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">{e.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: API Key & Configuration Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. OpenAI Configuration */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">OpenAI Settings</h4>
                  <p className="text-[11px] text-slate-400">GPT-4o, GPT-4o-mini & Embeddings</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  settings.openai_has_key
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {settings.openai_has_key ? 'Key Configured' : 'No Key'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                OpenAI API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-10 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Chat Model
                </label>
                <select
                  value={settings.openai_llm_model}
                  onChange={(e) => setSettings({ ...settings, openai_llm_model: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost-effective)</option>
                  <option value="gpt-4o">gpt-4o (High-Intelligence Flagship)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Embedding Model
                </label>
                <select
                  value={settings.openai_embedding_model}
                  onChange={(e) => setSettings({ ...settings, openai_embedding_model: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="text-embedding-3-small">text-embedding-3-small (384d)</option>
                  <option value="text-embedding-3-large">text-embedding-3-large</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleTestConnection('openai')}
                disabled={testingProvider === 'openai'}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === 'openai' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>Test OpenAI Connection</span>
              </button>

              {testResults['openai'] && (
                <span
                  className={`text-[11px] font-medium max-w-[260px] truncate ${
                    testResults['openai'].success ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                  title={testResults['openai'].message}
                >
                  {testResults['openai'].message}
                </span>
              )}
            </div>
          </div>

          {/* 2. Google Gemini Configuration */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs">
                  G
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Google Gemini Settings</h4>
                  <p className="text-[11px] text-slate-400">Gemini 1.5 Flash / Pro & Embeddings</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  settings.gemini_has_key
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {settings.gemini_has_key ? 'Key Configured' : 'No Key'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-10 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Chat Model
                </label>
                <select
                  value={settings.gemini_llm_model}
                  onChange={(e) => setSettings({ ...settings, gemini_llm_model: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Ultra Fast)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Complex Reasoning)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Next Gen)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Embedding Model
                </label>
                <select
                  value={settings.gemini_embedding_model}
                  onChange={(e) => setSettings({ ...settings, gemini_embedding_model: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="text-embedding-004">text-embedding-004 (384d)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleTestConnection('gemini')}
                disabled={testingProvider === 'gemini'}
                className="flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === 'gemini' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>Test Gemini Connection</span>
              </button>

              {testResults['gemini'] && (
                <span
                  className={`text-[11px] font-medium max-w-[260px] truncate ${
                    testResults['gemini'].success ? 'text-blue-600' : 'text-rose-600'
                  }`}
                  title={testResults['gemini'].message}
                >
                  {testResults['gemini'].message}
                </span>
              )}
            </div>
          </div>

          {/* 3. Anthropic Claude Configuration */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-xs">
                  C
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Anthropic Claude Settings</h4>
                  <p className="text-[11px] text-slate-400">Claude 3.5 Haiku, Sonnet & Opus</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  settings.claude_has_key
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {settings.claude_has_key ? 'Key Configured' : 'No Key'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Claude API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pr-10 pl-10 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showClaudeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Chat Model
              </label>
              <select
                value={settings.claude_llm_model}
                onChange={(e) => setSettings({ ...settings, claude_llm_model: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="claude-3-5-haiku-20241022">claude-3-5-haiku (Lightning Fast)</option>
                <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (Most Intelligent)</option>
                <option value="claude-3-opus-20240229">claude-3-opus</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleTestConnection('claude')}
                disabled={testingProvider === 'claude'}
                className="flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === 'claude' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>Test Claude Connection</span>
              </button>

              {testResults['claude'] && (
                <span
                  className={`text-[11px] font-medium max-w-[260px] truncate ${
                    testResults['claude'].success ? 'text-purple-600' : 'text-rose-600'
                  }`}
                  title={testResults['claude'].message}
                >
                  {testResults['claude'].message}
                </span>
              )}
            </div>
          </div>

          {/* 4. Local Ollama Configuration */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-white font-bold text-xs">
                  OL
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Local Ollama Runtime</h4>
                  <p className="text-[11px] text-slate-400">Offline private models running on local machine</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                Local Active
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Ollama Base URL
              </label>
              <input
                type="text"
                value={settings.ollama_base_url}
                onChange={(e) => setSettings({ ...settings, ollama_base_url: e.target.value })}
                placeholder="http://127.0.0.1:11434"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Ollama LLM Model
                </label>
                <input
                  type="text"
                  value={settings.ollama_llm_model}
                  onChange={(e) => setSettings({ ...settings, ollama_llm_model: e.target.value })}
                  placeholder="qwen2.5:1.5b"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Ollama Embedding Model
                </label>
                <input
                  type="text"
                  value={settings.ollama_embedding_model}
                  onChange={(e) => setSettings({ ...settings, ollama_embedding_model: e.target.value })}
                  placeholder="all-minilm"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleTestConnection('ollama')}
                disabled={testingProvider === 'ollama'}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === 'ollama' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>Ping Ollama Server</span>
              </button>

              {testResults['ollama'] && (
                <span
                  className={`text-[11px] font-medium max-w-[260px] truncate ${
                    testResults['ollama'].success ? 'text-amber-700 font-semibold' : 'text-rose-600'
                  }`}
                  title={testResults['ollama'].message}
                >
                  {testResults['ollama'].message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: Hyperparameters */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">RAG Generation Hyperparameters</h3>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Temperature: {settings.temperature}
                </label>
                <span className="text-[11px] text-slate-400">
                  {settings.temperature <= 0.3
                    ? 'Strict & Grounded (Recommended for RAG)'
                    : settings.temperature <= 0.7
                    ? 'Balanced'
                    : 'Creative'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Lower temperature ensures strict adherence to document citations and prevents hallucinations.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Max Output Tokens: {settings.max_tokens}
                </label>
              </div>
              <select
                value={settings.max_tokens}
                onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value={512}>512 tokens (~380 words)</option>
                <option value={1024}>1024 tokens (~750 words - standard)</option>
                <option value={2048}>2048 tokens (~1500 words - long reports)</option>
                <option value={4096}>4096 tokens (~3000 words)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 5: Save & Action Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-2xl border border-indigo-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Encrypted at Rest with AES-256</p>
              <p className="text-[11px] text-slate-500">API keys are securely encrypted using Laravel's application key.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:opacity-95 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            <span>Save & Apply AI Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
