import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../api/chat';
import type { ConversationItem, MessageItem } from '../api/chat';
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const { activeWorkspace } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load conversations on workspace change
  useEffect(() => {
    if (!activeWorkspace) return;
    loadConversations();
  }, [activeWorkspace]);

  const loadConversations = async () => {
    if (!activeWorkspace) return;
    try {
      setLoadingList(true);
      const list = await chatApi.list(activeWorkspace.id);
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        selectConversation(list[0].id);
      } else if (list.length === 0) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    } finally {
      setLoadingList(false);
    }
  };

  const selectConversation = async (conversationId: number) => {
    if (!activeWorkspace) return;
    try {
      setLoadingChat(true);
      const conv = await chatApi.get(activeWorkspace.id, conversationId);
      setActiveConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error('Failed to load conversation details', e);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleNewChat = async () => {
    if (!activeWorkspace) return;
    try {
      const newConv = await chatApi.create(activeWorkspace.id);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
    } catch (e) {
      console.error('Failed to create new chat', e);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    if (!activeWorkspace) return;
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await chatApi.delete(activeWorkspace.id, convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConversation?.id === convId) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  const handleSend = async (e?: React.FormEvent, presetPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetPrompt || inputMessage;
    if (!textToSend.trim() || !activeWorkspace || sending) return;

    let targetConv = activeConversation;

    // Create a new conversation if none exists
    if (!targetConv) {
      try {
        targetConv = await chatApi.create(activeWorkspace.id);
        setConversations((prev) => [targetConv!, ...prev]);
        setActiveConversation(targetConv);
      } catch (err) {
        console.error('Failed to init conversation', err);
        return;
      }
    }

    // Optimistic user message
    const tempUserMsg: MessageItem = {
      id: Date.now(),
      conversation_id: targetConv.id,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const res = await chatApi.sendMessage(activeWorkspace.id, targetConv.id, textToSend);

      // Replace with real messages
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...withoutTemp, res.user_message, res.assistant_message];
      });

      // Update conversation title in list if changed
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv!.id ? { ...c, title: textToSend.slice(0, 40) } : c
        )
      );
    } catch (err) {
      console.error('Message failed to send', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          conversation_id: targetConv!.id,
          role: 'assistant',
          content: 'Sorry, an error occurred while retrieving information from the document intelligence pipeline. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleCitation = (messageId: number) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const starterQuestions = [
    'What are the core modules and solutions covered in the uploaded documents?',
    'Explain the NBR VAT compliance features and reporting requirements.',
    'Summarize the enterprise infrastructure and cloud architecture.',
    'What are the procurement, MRP and inventory capabilities?',
  ];

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Active Workspace</h3>
        <p className="text-xs text-slate-500 mt-1">Please select or create a workspace to use AI Document Chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 rounded-3xl border border-indigo-100 bg-white p-3 shadow-xs">
      {/* 1. Conversations Sidebar */}
      <div className="flex w-72 flex-col rounded-2xl border border-slate-100 bg-[#f9fafc] p-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Chats</h3>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs shadow-indigo-600/30 transition hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1">
          {loadingList ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeConversation?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-100'
                      : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Chat Window */}
      <div className="flex flex-1 flex-col rounded-2xl border border-slate-100 bg-white">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {activeConversation?.title || 'Document Intelligence Chat'}
            </h4>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
              <span>Workspace: <strong>{activeWorkspace.name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                <Sparkles className="h-3 w-3" /> Grounded RAG (pgvector 384d + Qwen 2.5)
              </span>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {loadingChat ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner mb-4">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ask DocuMind AI</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Ask any question about your uploaded workspace documents. Every claim is strictly grounded with source citations.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-w-2xl w-full">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(undefined, q)}
                    className="flex items-start gap-2 rounded-2xl border border-indigo-50 bg-[#f9fafc] p-3 text-left text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-900"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const hasCitations = msg.citations && msg.citations.length > 0;
              const isExpanded = !!expandedCitations[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl space-y-2`}>
                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                          : 'bg-slate-50 text-slate-800 rounded-bl-xs border border-slate-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>

                    {/* Citations section for Assistant responses */}
                    {!isUser && hasCitations && (
                      <div className="rounded-xl border border-indigo-100/80 bg-indigo-50/40 p-2.5 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleCitation(msg.id)}
                          className="flex w-full items-center justify-between text-indigo-700 font-bold hover:text-indigo-900"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{msg.citations!.length} Source Citation(s) Found</span>
                          </span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 space-y-2 border-t border-indigo-100 pt-2">
                            {msg.citations!.map((cit) => (
                              <div
                                key={cit.index}
                                className="rounded-lg bg-white p-2.5 shadow-2xs border border-indigo-100/50"
                              >
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-800">
                                    {cit.label}
                                  </span>
                                  <span className="text-slate-600">
                                    {cit.filename} (Page {cit.page_number})
                                  </span>
                                  <span className="text-emerald-600">
                                    {Math.round(cit.similarity * 100)}% Match
                                  </span>
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded">
                                  "{cit.content_snippet}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-2xs">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500 border border-slate-100">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>DocuMind is retrieving document chunks & reasoning...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => handleSend(e)} className="border-t border-slate-100 p-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about your documents (e.g. 'What is the leave policy?', 'Yess ERP features')..."
              disabled={sending}
              className="w-full rounded-2xl border border-indigo-100 bg-[#f8f9fd] py-3.5 pr-14 pl-4 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-3 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sending}
              className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 transition hover:opacity-95 disabled:opacity-50 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
