import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { CopilotResponse, Company } from '../../types';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Building2
} from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  activeCompany?: Company;
}

interface Message {
  sender: 'user' | 'assistant';
  text?: string;
  data?: CopilotResponse;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose, companyId, activeCompany }) => {
  const industry = (activeCompany?.industry || 'RETAIL').toUpperCase();
  const isBanking = industry.includes('BANK');
  const isMfg = industry.includes('MANUF');

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `Hello! I am your NEXORA AI Analyst for ${activeCompany?.name || companyId}. I provide evidence-backed business interpretations grounded strictly in your ${industry} dataset.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getSuggestedQuestions = () => {
    if (isBanking) {
      return [
        "What is our current loan delinquency and fraud incident rate?",
        "Which channel exhibits the highest fraud risk?",
        "What is our total transaction value and volume?",
        "What are our high-risk transactions?"
      ];
    }
    if (isMfg) {
      return [
        "What is our production efficiency and defect rate?",
        "Which work center has the highest downtime?",
        "How much output was produced against plan?",
        "What is our scrap rate across shifts?"
      ];
    }
    return [
      "Why did revenue decrease recently?",
      "Which region contributes most to profit?",
      "What are our critical inventory stockouts?",
      "What are the projected sales for next month?",
      "Which products have margin erosion?"
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

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
            <div className="text-[10px] text-teal-400 font-mono truncate max-w-[190px]">
              {activeCompany?.name || companyId} &bull; {industry}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested quick pills */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Suggested {industry} Inquiries
        </div>
        <div className="flex flex-col gap-1.5">
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="text-left text-xs bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 px-2.5 py-1.5 rounded-md transition-all truncate cursor-pointer"
            >
              &bull; {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-2'
              }`}
            >
              {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}

              {m.data && (
                <div className="space-y-2.5">
                  {/* Tool Badge */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 border-b border-slate-200 pb-1.5">
                    <Cpu className="w-3 h-3 text-indigo-500" />
                    <span>Tool: {m.data.tool_used}</span>
                    <span className="text-teal-600 font-semibold ml-auto">
                      {m.data.source === 'gemini_grounded' ? 'Gemini AI' : 'Deterministic'}
                    </span>
                  </div>

                  {/* Direct Answer */}
                  <div className="font-medium text-slate-900 text-xs">
                    {m.data.response?.direct_answer}
                  </div>

                  {/* Supporting Metrics Badges */}
                  {m.data.response?.supporting_metrics && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Verifiable Evidence
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(m.data.response.supporting_metrics).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11px]">
                            <span className="text-slate-500">{k}:</span>
                            <span className="font-semibold font-mono text-slate-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  {m.data.response?.interpretation && (
                    <p className="text-slate-600 text-[11px] italic bg-slate-100/60 p-2 rounded">
                      &ldquo;{m.data.response.interpretation}&rdquo;
                    </p>
                  )}

                  {/* Suggested Actions */}
                  {m.data.response?.suggested_actions && m.data.response.suggested_actions.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                        Prescribed Actions:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
                        {m.data.response.suggested_actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-xs text-slate-400 p-2 bg-slate-50 rounded-lg animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
            <span>Analyzing {industry} dataset & executing verified analytical tools...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 bg-white flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${activeCompany?.name || companyId} metrics...`}
          disabled={loading}
          className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
