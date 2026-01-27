
import React, { useState, useEffect } from 'react';
import { knowledgeAgentRAG } from '../geminiService';
import { Project } from '../App';

interface KnowledgePageProps {
  project: Project;
}

const KnowledgePage: React.FC<KnowledgePageProps> = ({ project }) => {
  const visionKey = `sully_vision_${project.id}`;
  const strategyKey = `sully_shared_strategy_${project.id}`;
  const chatKey = `sully_chat_history_${project.id}`;

  const [vision, setVision] = useState(() => {
    const saved = localStorage.getItem(visionKey);
    if (saved) return saved;
    return `Specific strategic objective for ${project.name}: Build a localized B2B marketing funnel focusing on high-intent decision makers in the region.`;
  });

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'agent', text: string, sources?: any[]}[]>(() => {
    const saved = localStorage.getItem(chatKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(visionKey, vision);
  }, [vision, visionKey]);

  useEffect(() => {
    localStorage.setItem(chatKey, JSON.stringify(messages));
  }, [messages, chatKey]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const result = await knowledgeAgentRAG(userMsg, vision);
      setMessages(prev => [...prev, { role: 'agent', text: result.text || '', sources: result.sources }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shareToCampaign = (text: string) => {
    localStorage.setItem(strategyKey, text);
    alert(`Strategy for ${project.name} shared successfully with Campaign Agents.`);
  };

  const exportToPDF = () => {
    const printEl = document.getElementById('print-report');
    if (!printEl) return;

    const date = new Date().toLocaleDateString();
    const chatContent = messages.map(m => `
      <div style="margin-bottom: 20px; border-left: 4px solid ${m.role === 'user' ? '#4f46e5' : '#e2e8f0'}; padding-left: 15px;">
        <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
          ${m.role === 'user' ? 'Client Inquiry' : 'Sully Intelligence Agent'}
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">
          ${m.text}
        </div>
      </div>
    `).join('');

    const htmlReport = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">Sully.AI Strategy Report - ${project.name}</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px; font-weight: bold;">CONFIDENTIAL INTELLIGENCE • ${date}</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4f46e5; margin-top: 0; margin-bottom: 10px;">Master Vision Context</h2>
          <p style="font-size: 15px; color: #1e293b; margin: 0; font-style: italic; line-height: 1.6;">"${vision}"</p>
        </div>

        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4f46e5; margin-bottom: 20px;">Conversation Log</h2>
          ${chatContent || '<p style="color: #94a3b8; font-style: italic;">No history for this workspace.</p>'}
        </div>
      </div>
    `;

    printEl.innerHTML = htmlReport;
    printEl.classList.remove('hidden');
    window.print();
    printEl.classList.add('hidden');
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-6xl mx-auto pb-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Strategic Brain: <span className="text-indigo-600">{project.name}</span></h2>
          <p className="text-gray-500">Knowledge isolation active for this workspace.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <span>📄</span> Export Strategy
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3">Master Vision</h3>
            <textarea 
              className="w-full text-sm bg-indigo-50/30 p-3 rounded-lg border border-indigo-100 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[150px]"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Enter your core workspace-specific objective..."
            />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                <span className="text-6xl mb-4">🧠</span>
                <p className="font-bold">Strategize for {project.name}</p>
                <p className="text-sm">RAG processing is isolated to this project.</p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-2xl ${
                  m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-50 border border-slate-100 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  
                  {m.role === 'agent' && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <button 
                        onClick={() => shareToCampaign(m.text)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider"
                      >
                        📎 Share with {project.name} Campaigns
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="p-4 bg-slate-50 border-t border-gray-100 flex gap-3">
            <input 
              className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              placeholder={`Ask intelligence for ${project.name}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">
              Ask Consultant
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KnowledgePage;
