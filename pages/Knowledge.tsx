
import React, { useState, useEffect } from 'react';
import { knowledgeAgentRAG } from '../geminiService';
import { Project } from '../App';
import { Lead } from '../types';
import { MOCK_LEADS } from '../constants';

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
  const [showSamples, setShowSamples] = useState(true);
  const [showLeadSelector, setShowLeadSelector] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [reportPreview, setReportPreview] = useState<string | null>(null);

  // Sample conversation trees demonstrating AI behavior difference
  const sampleConversations = {
    client: [
      { role: 'user' as const, text: "We're thinking about adding a subscription model to our product. What do you think?" },
      { role: 'agent' as const, text: "That's a solid direction to explore. A subscription model can provide predictable revenue streams and deeper customer relationships.\n\nBased on your vision of building a B2B marketing funnel, I'd recommend:\n\n✓ Start with a tiered pricing structure (Basic, Professional, Enterprise)\n✓ Include a 14-day free trial to reduce friction\n✓ Focus on annual contracts for enterprise clients (better retention)\n\nThis aligns well with your high-intent decision maker focus. The subscription model will help you track engagement metrics and identify upsell opportunities.\n\nWould you like me to help you map out the specific tiers and features for each level?" },
      { role: 'user' as const, text: "Yes, please help with the tier structure. We serve mid-market companies mainly." },
      { role: 'agent' as const, text: "Perfect. For mid-market B2B, here's a proven tier structure:\n\n📦 STARTER ($99/mo)\n- Up to 5 users\n- Core features\n- Email support\n- Best for: Teams testing the waters\n\n📦 PROFESSIONAL ($299/mo) ⭐ Most Popular\n- Up to 25 users\n- Advanced analytics\n- Priority support\n- API access\n- Best for: Growing teams scaling operations\n\n📦 ENTERPRISE (Custom)\n- Unlimited users\n- Custom integrations\n- Dedicated success manager\n- SLA guarantees\n- Best for: Large organizations with complex needs\n\nThis structure preserves your core offering while creating clear upgrade paths. The Professional tier should be your sweet spot for mid-market clients." }
    ],
    startup: [
      { role: 'user' as const, text: "We're thinking about adding a subscription model to our product. What do you think?" },
      { role: 'agent' as const, text: "Hold on - before you jump into subscriptions, let's challenge this assumption. Why subscription? Have you validated that your target users want to pay monthly, or are you just following the SaaS playbook?\n\n🔍 Hard questions:\n1. What's your current customer LTV? If it's low, subscriptions might not move the needle\n2. Can you deliver continuous value monthly? Or is your product more transactional?\n3. What's your churn risk? Mid-market churns fast if they don't see ROI in 90 days\n\n💡 Alternative angles to consider:\n- Usage-based pricing (pay for what you use - scales with their growth)\n- Freemium with premium features (faster user acquisition)\n- One-time licenses with annual maintenance (higher upfront cash)\n\nI'm not saying subscription is wrong - but let's make sure it's the RIGHT model for YOUR specific market dynamics. What problem are you really trying to solve: predictable revenue, or customer retention?" },
      { role: 'user' as const, text: "Good point. We want predictable revenue but our users have seasonal demand." },
      { role: 'agent' as const, text: "AH - that's the real insight! Seasonal demand + subscription = churn disaster waiting to happen.\n\n🚀 Here's a better play:\n\n**HYBRID MODEL** (Credits + Subscription)\n- Base subscription: $149/mo (access to platform + 100 credits)\n- Credits = usage units that roll over 12 months\n- Users buy credit packs when they need them ($500 = 500 credits)\n- High season? They load up. Low season? Base subscription keeps you funded.\n\nWhy this crushes traditional subscriptions for you:\n✓ Customers don't churn in off-season (their credits are still there)\n✓ You get both predictable base + seasonal upside\n✓ Creates a switching cost (unused credits = lock-in)\n✓ Usage data helps you predict their business cycles\n\n**Scaling strategy:** Once you hit 100 customers on this model, you'll have enough data to offer annual pre-paid packages at 20% discount. Boom - you just turned seasonal cash flow into upfront capital for growth.\n\nWant me to help you calculate the unit economics on this?" }
    ]
  };

  const loadSampleConversation = () => {
    const samples = project.startupMode ? sampleConversations.startup : sampleConversations.client;
    setMessages(samples);
    setShowSamples(false);
  };

  const clearChat = () => {
    setMessages([]);
    setShowSamples(true);
  };

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
      const result = await knowledgeAgentRAG(userMsg, vision, project.startupMode || false);
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

  const generateClientNeedsReport = () => {
    if (messages.length === 0) {
      alert('No conversation to export. Start a strategy discussion first.');
      return;
    }
    setShowLeadSelector(true);
  };

  const sendReportToLead = () => {
    if (!selectedLead) return;
    
    const date = new Date().toLocaleDateString();
    const conversationLog = messages.map(m => 
      `${m.role === 'user' ? '👤 CLIENT INQUIRY' : '🤖 SULLY AI ANALYSIS'}\n${m.text}`
    ).join('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

    const reportContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRATEGIC NEEDS ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prepared for: ${selectedLead.name}
Company: ${selectedLead.company}
Title: ${selectedLead.title}
Date: ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISION CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"${vision}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETAILED CONVERSATION LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${conversationLog}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY INSIGHTS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Exchanges: ${messages.filter(m => m.role === 'user').length}
AI Mode Used: ${project.startupMode ? 'STARTUP BUILDER MODE (Business Partner)' : 'CLIENT MODE (Idea Preserver)'}
Project: ${project.name}

This report captures the strategic consultation conducted through 
Sully.AI's knowledge system. All insights are tailored to the 
Master Vision defined for this workspace.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated by Sully.AI Strategic Intelligence System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    setReportPreview(reportContent);
    setShowLeadSelector(false);
    
    // Simulate email send
    setTimeout(() => {
      alert(`📧 Client Needs Analysis Report successfully sent to ${selectedLead.name} (${selectedLead.email})`);
      setReportPreview(null);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto pb-20 px-4">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">Knowledge / RAG</p>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Strategic Brain for {project.name}</h2>
          <p className="text-gray-500 mt-2 text-base">Workspace knowledge graph scoped to this client / startup.</p>
        </div>
        <div className="flex gap-3 justify-start md:justify-end">
          {messages.length > 0 && (
            <>
              <button 
                onClick={clearChat}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition text-sm"
              >
                <span>🗑️</span> Clear Chat
              </button>
              <button 
                onClick={generateClientNeedsReport}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-sm"
              >
                <span>📧</span> Send to Lead
              </button>
            </>
          )}
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm text-sm"
          >
            <span>📄</span> Export Strategy
          </button>
        </div>
      </header>

      {/* Master Vision Bar */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-6 rounded-2xl shadow-md border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-base font-bold text-indigo-900 uppercase tracking-wider">Master Vision</h3>
          <span className="text-xs text-indigo-600 ml-auto">Guides all AI responses for {project.name}</span>
        </div>
        <textarea 
          className="w-full text-sm bg-white p-4 rounded-xl border-2 border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px] leading-relaxed shadow-inner resize-none"
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          placeholder="Enter your core workspace-specific objective and strategic goals..."
        />
      </div>

      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[550px]">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.length === 0 && showSamples && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-8">
              <span className="text-7xl mb-6">🧠</span>
              <p className="font-bold text-lg mb-2">Strategize for {project.name}</p>
              <p className="text-sm text-gray-500 mb-6">
                {project.startupMode 
                  ? 'AI acts as your business partner - challenging assumptions and pushing for scale'
                  : 'AI acts as your idea preserver - building on your vision and helping execute'
                }
              </p>
              
              <div className="w-full max-w-2xl space-y-3 mb-6">
                <p className="text-xs font-bold text-slate-600 mb-3">Example Questions:</p>
                <button
                  onClick={() => setQuery(project.startupMode 
                    ? "How can I achieve 10x growth in the next 6 months?" 
                    : "What's the best approach to improve our customer retention rate?"
                  )}
                  className="w-full text-left p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:shadow-md transition text-sm text-slate-700"
                >
                  💡 {project.startupMode 
                    ? "How can I achieve 10x growth in the next 6 months?" 
                    : "What's the best approach to improve our customer retention rate?"}
                </button>
                <button
                  onClick={() => setQuery(project.startupMode
                    ? "Should I pivot my product strategy or double down on current features?"
                    : "How do we structure our sales team for enterprise clients?"
                  )}
                  className="w-full text-left p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:shadow-md transition text-sm text-slate-700"
                >
                  💡 {project.startupMode
                    ? "Should I pivot my product strategy or double down on current features?"
                    : "How do we structure our sales team for enterprise clients?"}
                </button>
                <button
                  onClick={() => setQuery(project.startupMode
                    ? "What unconventional marketing channels should I explore for rapid user acquisition?"
                    : "What metrics should we track for our B2B marketing funnel?"
                  )}
                  className="w-full text-left p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:shadow-md transition text-sm text-slate-700"
                >
                  💡 {project.startupMode
                    ? "What unconventional marketing channels should I explore for rapid user acquisition?"
                    : "What metrics should we track for our B2B marketing funnel?"}
                </button>
              </div>
              
              <button
                onClick={loadSampleConversation}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md mb-4"
              >
                💬 View Sample {project.startupMode ? 'Partner' : 'Client'} Conversation
              </button>
              <p className="text-xs text-gray-400 max-w-md">
                See how the AI responds differently in {project.startupMode ? 'Startup' : 'Client'} mode
              </p>
            </div>
          )}
          {messages.length === 0 && !showSamples && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
              <span className="text-7xl mb-6">🧠</span>
              <p className="font-bold text-lg">Strategize for {project.name}</p>
              <p className="text-sm mt-2">RAG processing is isolated to this project.</p>
            </div>
          )}
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-6 rounded-2xl ${
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

        <form onSubmit={handleAsk} className="p-6 bg-slate-50 border-t border-gray-100 flex gap-4">
          <input 
            className="flex-1 bg-white border border-slate-200 rounded-xl px-6 py-4 text-base focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            placeholder={`Ask intelligence for ${project.name}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md text-base disabled:opacity-50">
            {loading ? 'Thinking...' : 'Ask Consultant'}
          </button>
        </form>
      </div>

      {/* Lead Selector Modal */}
      {showLeadSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLeadSelector(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Select Lead to Send Report</h3>
              <button onClick={() => setShowLeadSelector(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Choose a lead to receive the Client Needs Analysis Report</p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {MOCK_LEADS.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    selectedLead?.id === lead.id 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-600">{lead.title} at {lead.company}</p>
                      <p className="text-xs text-gray-400 mt-1">{lead.email}</p>
                    </div>
                    {selectedLead?.id === lead.id && (
                      <span className="text-indigo-600 text-xl">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeadSelector(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={sendReportToLead}
                disabled={!selectedLead}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📧 Send Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {reportPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setReportPreview(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Report Preview</h3>
              <button onClick={() => setReportPreview(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-6 border border-slate-200">
              <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                {reportPreview}
              </pre>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setReportPreview(null)}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
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

export default KnowledgePage;
