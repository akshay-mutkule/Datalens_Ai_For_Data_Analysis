import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  Loader2,
  Terminal,
  Brain,
  BarChart3,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { DatasetState, ChatMessage } from '../types/dataset';
import { useTheme } from '../context/ThemeContext';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DatasetState | null;
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  dataset,
  activeTab,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: dataset
        ? `Hello! I'm your DataLens Intelligence Copilot. I'm actively monitoring **${dataset.profile.fileName}** across all ${dataset.profile.totalColumns} features.\n\nAsk me for real-time statistical breakdowns, SQL queries, ML interpretations, or strategic insights!`
        : `Hello! I'm your DataLens Intelligence Copilot. Upload or select a dataset to start exploring autonomous analytics!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Summarize key performance drivers',
        'Identify highest-risk anomalies',
        'Recommend 3 high-impact actions',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isLoading || !dataset) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/dataset/${dataset.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `[Context: Active View = ${activeTab}] ${textToSend}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'assistant',
          text: data.answer.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: data.answer.suggestions,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'Failed to formulate response');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: `Analysis error: ${err.message || 'AI service unavailable.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Context-specific prompts based on active tab
  const getContextPrompts = () => {
    switch (activeTab) {
      case 'sql':
        return [
          'Generate SQL to group revenue by category',
          'Write a window function query for cumulative sales',
          'Optimize this query for large datasets',
        ];
      case 'ml':
        return [
          'Which features have the strongest predictive power?',
          'How can I reduce Root Mean Squared Error?',
          'Explain the model coefficients simply',
        ];
      case 'clustering':
        return [
          'Interpret the behavioral characteristics of Cluster 1',
          'What is the optimal K value for this data?',
          'Which features separate the clusters most clearly?',
        ];
      case 'anomalies':
        return [
          'What root causes explain these outlier records?',
          'Are any anomalies potential data entry errors?',
          'Should we cap or remove these extreme values?',
        ];
      case 'cohorts':
        return [
          'Why did retention drop in month 3?',
          'Which cohort had the highest lifetime value?',
          'How to improve retention curve trajectory?',
        ];
      default:
        return [
          'What is the most profitable category?',
          'Summarize top bivariate correlations',
          'Provide 3 executive takeaways',
        ];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Over Panel */}
      <div
        className={`relative w-full max-w-lg h-full flex flex-col shadow-2xl z-10 border-l transition-all duration-300 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Drawer Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight">AI Data Copilot</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Active Tab: {activeTab.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Context-aware analytical reasoning & SQL assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Close Drawer (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`space-y-1.5 max-w-[85%] ${isUser ? 'items-end text-right' : ''}`}>
                  <div
                    className={`relative group p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : isDark
                        ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition text-[10px] ${
                          isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono px-1">{msg.timestamp}</div>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(sug)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition text-left ${
                            isDark
                              ? 'bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border-indigo-500/30'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div
                className={`p-3.5 rounded-2xl rounded-tl-none border text-xs flex items-center gap-2 ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>Computing statistical answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Tab Context Chips */}
        <div
          className={`px-4 py-2 border-t overflow-x-auto scrollbar-none flex items-center gap-1.5 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0">
            Suggested:
          </span>
          {getContextPrompts().map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading || !dataset}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap transition shrink-0 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Footer Input */}
        <div
          className={`p-4 border-t ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                dataset ? `Ask Copilot about ${dataset.profile.fileName}...` : 'Select a dataset first...'
              }
              disabled={isLoading || !dataset}
              className={`flex-1 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 font-medium border focus:outline-none transition ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading || !dataset}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-40 transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
