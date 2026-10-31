import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { CopilotResponse } from '../../types';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers
} from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

interface Message {
  sender: 'user' | 'assistant';
  text?: string;
  data?: CopilotResponse;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose, companyId }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your NEXORA AI Business Analyst. Ask me about root causes, forecasts, inventory risks, margins, or regional performance."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    "Why did revenue decrease recently?",
    "Which region contributes most to profit?",
    "What are our critical inventory stockouts?",
    "What are the projected sales for next month?",
    "Which products have margin erosion?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await apiService.chatCopilot(companyId, q);
      setMessages((prev) => [...prev, { sender: 'assistant', data: resp }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Unable to process query: ${err.message || 'Service connection error'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">AI Analyst Copilot</div>
            <div className="text-[10px] text-teal-400 font-mono">Grounded Tool Execution</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested quick pills */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Suggested Analytical Inquiries
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors shadow-2xs text-left"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-900 border border-slate-200'
              }`}
            >
              {m.text && <p className="leading-relaxed">{m.text}</p>}

              {m.data && (
                <div className="space-y-2.5">
                  {/* Tool used badge */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 w-fit">
                    <Cpu className="w-3 h-3" />
                    <span>Tool: {m.data.tool_used}</span>
                  </div>

                  {/* Direct Answer */}
                  <div className="font-semibold text-slate-900 text-xs">
                    {m.data.response.direct_answer}
                  </div>

                  {/* Supporting Metrics */}
                  {m.data.response.supporting_metrics && (
                    <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Supporting Facts
                      </div>
                      {Object.entries(m.data.response.supporting_metrics).map(([k, v], sIdx) => (
                        <div key={sIdx} className="flex justify-between text-[11px]">
                          <span className="text-slate-600">{k}:</span>
                          <span className="font-mono font-medium text-slate-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interpretation */}
                  <div className="text-[11px] text-slate-700 leading-normal">
                    <span className="font-semibold text-slate-900">Interpretation: </span>
                    {m.data.response.interpretation}
                  </div>

                  {/* Suggested actions */}
                  {m.data.response.suggested_actions && m.data.response.suggested_actions.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-200">
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        Recommended Actions
                      </div>
                      {m.data.response.suggested_actions.map((act, aIdx) => (
                        <div key={aIdx} className="flex items-start gap-1.5 text-[11px] text-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Limitations */}
                  {m.data.response.limitations && (
                    <div className="text-[10px] text-slate-400 italic pt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{m.data.response.limitations}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-xs text-indigo-600 animate-pulse p-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Analyzing empirical datasets...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about revenue, roots, forecast..."
            className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
