import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CornerDownLeft,
  Loader2,
  Zap,
} from 'lucide-react';
import { DatasetState, ChatMessage } from '../types/dataset';

interface AIChatViewProps {
  dataset: DatasetState;
}

export const AIChatView: React.FC<AIChatViewProps> = ({ dataset }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello! I am your AI Data Analyst for **${dataset.profile.fileName}**.\n\nI have parsed ${dataset.profile.totalRows.toLocaleString()} rows and ${dataset.profile.totalColumns} columns, audited data quality (${dataset.profile.qualityScore}/100), computed descriptive statistics, and mapped key bivariate correlations.\n\nAsk me anything about statistical trends, performance drivers, anomalies, or strategic recommendations!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'What is the most profitable category or segment?',
        'Which variables have the strongest correlation?',
        'What data quality issues were found?',
        'Give me 5 key strategic recommendations',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
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
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        const aiMsg: ChatMessage = {
          id: 'msg_ai_' + Date.now(),
          sender: 'assistant',
          text: data.answer.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: data.answer.suggestions,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'Failed to retrieve analysis');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        text: `Error analyzing query: ${err.message || 'Unable to connect to AI server.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePromptChips = [
    'What is the highest-performing category?',
    'What are the strongest correlations?',
    'Explain any outliers or anomalies',
    'Summarize data quality and hygiene',
    'What are the key growth opportunities?',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-950 to-blue-950 text-white rounded-3xl p-6 shadow-md flex items-center justify-between border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">DataLens AI Analyst</h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Grounded in schema distributions & descriptive statistics from <span className="font-bold text-white">{dataset.profile.fileName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[580px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div className={`space-y-2 max-w-2xl ${msg.sender === 'user' ? 'items-end text-right' : ''}`}>
                <div
                  className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-blue-500/10'
                      : 'bg-slate-50/90 text-slate-800 border border-slate-200/80 rounded-tl-none shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>

                <div className="text-[10px] text-slate-400 px-2 font-mono">{msg.timestamp}</div>

                {/* AI Follow-up Suggestion Pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {msg.suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(sug)}
                        className="text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition-all hover:scale-[1.01] text-left shadow-2xs"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-3xl rounded-tl-none flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Formulating analytical breakdown from statistical metrics...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts Bar */}
        <div className="px-6 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Prompts:
          </span>
          {samplePromptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 hover:border-indigo-200 transition shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputQuery);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask DataLens AI anything about ${dataset.profile.fileName}...`}
              disabled={isLoading}
              className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
