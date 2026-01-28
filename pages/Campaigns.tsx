
import React, { useState, useRef, useEffect } from 'react';
import { Lead, Asset, CSVRow } from '../types';
import { MOCK_LEADS } from '../constants';
import { campaignGeneratorAgent, leadResponseAnalystAgent, analyzeEmailPerformance } from '../geminiService';
import { Project } from '../App';

interface CampaignsPageProps {
  project: Project;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ project }) => {
  const sharedStrategyKey = `sully_shared_strategy_${project.id}`;
  const visionKey = `sully_vision_${project.id}`;
  const inboxKey = `sully_inbox_${project.id}`;
  const taskKey = `sully_task_desc_${project.id}`;
  const campaignChatKey = `sully_campaign_chat_${project.id}`;

  const [taskDescription, setTaskDescription] = useState(() => {
    const saved = localStorage.getItem(taskKey);
    if (saved) return saved;
    return project.id === 'proj-1' ? 'Secure potential client cloud infra.' : 
           project.id === 'proj-2' ? 'Propose HIPAA compliant storage.' : 
           'Engage leads with new retail platform.';
  });
  
  const [batchLeads, setBatchLeads] = useState<CSVRow[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [sharedStrategy, setSharedStrategy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'email-responses'>('inbox');
  const [campaignQuery, setCampaignQuery] = useState('');
  const [campaignMessages, setCampaignMessages] = useState<{role: 'user' | 'agent', text: string, minitasks?: string[]}[]>(() => {
    const saved = localStorage.getItem(campaignChatKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [loadingChat, setLoadingChat] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadSelector, setShowLeadSelector] = useState(false);
  const [currentMinitasks, setCurrentMinitasks] = useState<string[] | null>(null);
  const [emailResponses, setEmailResponses] = useState<{leadName: string, email: string, subject: string, response: string, timestamp: string, status: 'new' | 'read'}[]>(() => {
    const emailKey = `sully_email_responses_${project.id}`;
    const saved = localStorage.getItem(emailKey);
    if (saved) return JSON.parse(saved);
    
    // Demo email responses per project
    if (project.id === 'proj-1') {
      return [
        { leadName: 'Vikram Singh', email: 'vikram@techcorp.in', subject: 'Re: Cloud Infrastructure Proposal', response: 'Thanks for the detailed proposal. I\'m particularly interested in your multi-cloud security approach. Can we schedule a call next week?', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'new' as const },
        { leadName: 'Priya Kumar', email: 'priya@startupxyz.com', subject: 'Re: Scaling Solutions', response: 'Your timing is perfect. We\'re evaluating providers this quarter. What\'s your pricing for 50-100 users?', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'read' as const }
      ];
    }
    if (project.id === 'proj-2') {
      return [
        { leadName: 'Anjali Sharma', email: 'anjali@healthtech.in', subject: 'Re: HIPAA Compliant Storage', response: 'We need this urgently. Do you have case studies from other Indian healthcare startups?', timestamp: new Date(Date.now() - 43200000).toISOString(), status: 'new' as const }
      ];
    }
    return [];
  });

  const [incomingResponses, setIncomingResponses] = useState(() => {
    const saved = localStorage.getItem(inboxKey);
    if (saved) return JSON.parse(saved);
    
    // Distinct demo data per project
    if (project.id === 'proj-1') {
      return [{ leadId: '3', text: "What's your stance on multi-cloud security?", name: 'Vikram Singh', status: 'new' }];
    }
    if (project.id === 'proj-2') {
      return [{ leadId: '2', text: "Do you integrate with Indian health stack APIs?", name: 'Anjali Sharma', status: 'new' }];
    }
    if (project.id === 'proj-3') {
      return [{ leadId: '1', text: "Can you help with omnichannel inventory?", name: 'Ramesh Babu', status: 'new' }];
    }
    
    return []; // Scratch for others
  });

  const csvInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSharedStrategy(localStorage.getItem(sharedStrategyKey)); }, [sharedStrategyKey, project.id]);
  useEffect(() => { localStorage.setItem(inboxKey, JSON.stringify(incomingResponses)); }, [incomingResponses, inboxKey]);
  useEffect(() => { localStorage.setItem(taskKey, taskDescription); }, [taskDescription, taskKey]);
  useEffect(() => { 
    const emailKey = `sully_email_responses_${project.id}`;
    localStorage.setItem(emailKey, JSON.stringify(emailResponses)); 
  }, [emailResponses, project.id]);
  useEffect(() => {
    localStorage.setItem(campaignChatKey, JSON.stringify(campaignMessages));
  }, [campaignMessages, campaignChatKey]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const header = lines[0].toLowerCase().split(',');
      const nameIdx = header.findIndex(h => h.includes('name'));
      const emailIdx = header.findIndex(h => h.includes('email'));
      const parsed = lines.slice(1).filter(l => l.trim() !== '').map(l => {
        const cols = l.split(',');
        return { name: cols[nameIdx]?.trim() || 'Prospect', email: cols[emailIdx]?.trim() || 'N/A', status: 'pending' as const };
      });
      setBatchLeads(parsed);
    };
    reader.readAsText(file);
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Fix: Explicitly type 'file' as 'File' to avoid 'unknown' type inference errors
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setAssets(prev => [...prev, { name: file.name, data, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const executeTask = async () => {
    if (batchLeads.length === 0) return alert("Upload CSV first.");
    setIsProcessing(true);
    const updated = [...batchLeads];
    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'processing';
      setBatchLeads([...updated]);
      try {
        const content = await campaignGeneratorAgent({ name: updated[i].name, email: updated[i].email, sharedStrategy: sharedStrategy || undefined }, taskDescription, assets, project.startupMode || false);
        updated[i].status = 'completed';
        updated[i].result = content;
      } catch (err) { updated[i].status = 'failed'; }
      setBatchLeads([...updated]);
    }
    setIsProcessing(false);
  };

  const analyzeResponse = async (resp: any) => {
    const vision = localStorage.getItem(visionKey) || '';
    const leadKey = `sully_leads_data_${project.id}`;
    const leadsSaved = localStorage.getItem(leadKey);
    const currentLeads: Lead[] = leadsSaved ? JSON.parse(leadsSaved) : MOCK_LEADS;
    const lead = currentLeads.find(l => l.id === resp.leadId);
    if (!lead) return alert("Lead not found in this specific workspace.");
    
    setIsProcessing(true);
    try {
      const result = await leadResponseAnalystAgent(lead, resp.text, vision);
      setIncomingResponses(prev => prev.map(r => r.leadId === resp.leadId ? { ...r, status: 'analyzed', analysis: result } : r));
      setPreviewContent(`Lead ${lead.name} Alignment Score: ${result.alignmentScore}/100\n\nNeeds: ${result.extractedNeeds}\n\nStrategic Shift: ${result.strategicShift}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeEmailAndUpdateScore = async (email: any, index: number) => {
    const vision = localStorage.getItem(visionKey) || '';
    const leadKey = `sully_leads_data_${project.id}`;
    const leadsSaved = localStorage.getItem(leadKey);
    const currentLeads: Lead[] = leadsSaved ? JSON.parse(leadsSaved) : MOCK_LEADS;
    
    // Find lead by email or name
    const lead = currentLeads.find(l => l.email === email.email || l.name === email.leadName);
    if (!lead) {
      setPreviewContent(`From: ${email.leadName} <${email.email}>\nSubject: ${email.subject}\nDate: ${new Date(email.timestamp).toLocaleString()}\n\n${email.response}\n\n⚠️ Lead not found in current workspace - score not updated.`);
      setEmailResponses(prev => prev.map((e, idx) => idx === index ? {...e, status: 'read' as const} : e));
      return;
    }
    
    setIsProcessing(true);
    try {
      const performance = await analyzeEmailPerformance(
        email.response,
        email.leadName,
        lead.company,
        lead.score || 0,
        vision,
        project.startupMode || false
      );
      
      // Update lead score and add to history
      const updatedLeads = currentLeads.map(l => {
        if (l.id === lead.id) {
          const scoreHistory = l.scoreHistory || [];
          scoreHistory.push({ date: new Date().toISOString(), score: performance.newScore });
          return {
            ...l,
            score: performance.newScore,
            scoreHistory,
            status: performance.engagementLevel === 'high' ? 'opportunity' as const : 'nurturing' as const,
            lastActivity: new Date().toISOString(),
            lastResponse: email.response
          };
        }
        return l;
      });
      
      localStorage.setItem(leadKey, JSON.stringify(updatedLeads));
      
      // Mark email as read and show detailed preview
      setEmailResponses(prev => prev.map((e, idx) => idx === index ? {...e, status: 'read' as const} : e));
      
      const scoreChange = performance.newScore - (lead.score || 0);
      const changeIndicator = scoreChange > 0 ? `📈 +${scoreChange}` : scoreChange < 0 ? `📉 ${scoreChange}` : '➡️ No change';
      
      setPreviewContent(
        `From: ${email.leadName} <${email.email}>\n` +
        `Subject: ${email.subject}\n` +
        `Date: ${new Date(email.timestamp).toLocaleString()}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `${email.response}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 PERFORMANCE ANALYSIS\n\n` +
        `Lead Score: ${lead.score || 0} → ${performance.newScore} ${changeIndicator}\n` +
        `Engagement Level: ${performance.engagementLevel.toUpperCase()}\n` +
        `Status Updated: ${performance.engagementLevel === 'high' ? 'OPPORTUNITY' : 'NURTURING'}\n\n` +
        `Key Indicators:\n${performance.keyIndicators.map((k: string) => `  • ${k}`).join('\n')}\n\n` +
        `Performance Report:\n${performance.performanceReport}\n\n` +
        `✅ Lead data automatically updated in ${project.name} workspace`
      );
    } catch (error) {
      console.error('Email analysis error:', error);
      setEmailResponses(prev => prev.map((e, idx) => idx === index ? {...e, status: 'read' as const} : e));
      setPreviewContent(`From: ${email.leadName} <${email.email}>\nSubject: ${email.subject}\nDate: ${new Date(email.timestamp).toLocaleString()}\n\n${email.response}\n\n⚠️ Error analyzing email - please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCampaignChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignQuery.trim()) return;

    const userMsg = campaignQuery;
    setCampaignQuery('');
    setCampaignMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoadingChat(true);

    try {
      const vision = localStorage.getItem(visionKey) || '';
      // Generate minitasks based on campaign idea
      const prompt = `Generate 5-7 specific, actionable minitasks for this campaign idea: "${userMsg}"
      
Context: ${vision}
Project: ${project.name}

Provide ONLY a numbered list of concrete action items. Each task should be 1-2 sentences max. Format:
1. [Task]
2. [Task]
etc.`;
      
      const response = await campaignGeneratorAgent(
        { name: 'Campaign Planner', email: '', sharedStrategy: sharedStrategy || undefined },
        prompt,
        [],
        project.startupMode || false
      );
      
      // Extract tasks from response
      const taskLines = response.split('\n').filter(line => /^\d+\./.test(line.trim()));
      const tasks = taskLines.map(line => line.replace(/^\d+\.\s*/, '').trim());
      
      setCampaignMessages(prev => [...prev, { role: 'agent', text: response, minitasks: tasks }]);
      setCurrentMinitasks(tasks);
    } catch (err) {
      console.error(err);
      setCampaignMessages(prev => [...prev, { role: 'agent', text: 'Error generating minitasks. Please try again.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const sendMinitasksTolead = () => {
    if (!selectedLead || !currentMinitasks) return;
    
    const pdfContent = `CAMPAIGN MINITASKS FOR ${selectedLead.company}\n` +
      `Generated for ${project.name}\n` +
      `Date: ${new Date().toLocaleDateString()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      currentMinitasks.map((task, i) => `${i + 1}. ${task}`).join('\n\n') +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `\nThis action plan was generated by Sully.AI based on your strategic objectives.`;
    
    setPreviewContent(pdfContent);
    setShowLeadSelector(false);
    alert(`Minitasks PDF sent to ${selectedLead.name} at ${selectedLead.email} ✅\n\n(Demo mode - email not actually sent)`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Operations Studio</h2>
          <p className="text-slate-500 tracking-tight">
            Channel execution for <span className="text-indigo-600 font-bold">{project.name}</span>  b7 Clients & founders
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'inbox' 
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span> Inbox
                </span>
              </button>
              <button 
                onClick={() => setActiveTab('email-responses')}
                className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === 'email-responses' 
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  📧 Email Replies {emailResponses.filter(e => e.status === 'new').length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{emailResponses.filter(e => e.status === 'new').length}</span>}
                </span>
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'inbox' && (
                <div className="space-y-4">
                  {incomingResponses.map((resp, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition">
                      <p className="text-xs font-bold text-slate-800">{resp.name}</p>
                      <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-2">"{resp.text}"</p>
                      <button onClick={() => analyzeResponse(resp)} disabled={isProcessing} className="mt-3 w-full text-[10px] font-bold text-indigo-600 border border-indigo-200 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition uppercase tracking-wider disabled:opacity-50">
                        {isProcessing ? 'Analyzing...' : 'Analyze Sentiment'}
                      </button>
                    </div>
                  ))}
                  {incomingResponses.length === 0 && <p className="text-center py-4 text-xs text-slate-300 italic">No incoming responses for this workspace.</p>}
                </div>
              )}
              
              {activeTab === 'email-responses' && (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {emailResponses.map((email, i) => (
                    <div key={i} className={`p-4 rounded-xl border transition ${
                      email.status === 'new' 
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{email.leadName}</p>
                          <p className="text-[10px] text-slate-500">{email.email}</p>
                        </div>
                        {email.status === 'new' && <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">NEW</span>}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 mb-1">Re: {email.subject}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{email.response}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                        <span className="text-[9px] text-slate-400">{new Date(email.timestamp).toLocaleString()}</span>
                        <button 
                          onClick={() => analyzeEmailAndUpdateScore(email, i)}
                          disabled={isProcessing}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Analyzing...' : 'View & Score'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {emailResponses.length === 0 && <p className="text-center py-8 text-xs text-slate-300 italic">No email responses yet. Automated campaigns will appear here.</p>}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
             <h3 className="text-sm font-bold text-slate-400 uppercase">Task Configuration</h3>
             <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none min-h-[80px]" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Objective..." />
             <div className="grid grid-cols-2 gap-3">
               <button onClick={() => csvInputRef.current?.click()} className="p-2 border border-slate-100 bg-slate-50 rounded-lg text-xs font-bold flex flex-col items-center gap-1 hover:bg-white transition-colors">📄 CSV<input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleCSVUpload} /></button>
               <button onClick={() => assetInputRef.current?.click()} className="p-2 border border-slate-100 bg-slate-50 rounded-lg text-xs font-bold flex flex-col items-center gap-1 hover:bg-white transition-colors">🖼️ Asset<input type="file" ref={assetInputRef} className="hidden" multiple accept="image/*" onChange={handleAssetUpload} /></button>
             </div>
             {assets.length > 0 && (
               <div className="flex flex-wrap gap-2 pt-2">
                 {assets.map((a, i) => (
                   <span key={i} className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                     {a.name} <button onClick={() => setAssets(assets.filter((_, idx) => idx !== i))} className="hover:text-red-500">✕</button>
                   </span>
                 ))}
               </div>
             )}
             <button onClick={executeTask} disabled={isProcessing} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-indigo-100">
               {isProcessing ? 'Agent Thinking...' : 'Generate Drafts'}
             </button>
          </section>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[600px]">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                <div>
                  <h3 className="font-bold text-slate-800 tracking-tight">Campaign Strategy Chat</h3>
                  <p className="text-xs text-slate-500 mt-1">Generate minitasks and send to leads</p>
                </div>
                {currentMinitasks && (
                  <button 
                    onClick={() => setShowLeadSelector(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md"
                  >
                    📧 Send to Lead
                  </button>
                )}
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {campaignMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <span className="text-6xl mb-4">💡</span>
                    <p className="font-bold text-lg">Campaign Ideation Assistant</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-md">
                      Describe a campaign idea and I'll break it down into actionable minitasks you can send to your leads
                    </p>
                    <div className="mt-6 text-left bg-slate-50 p-4 rounded-xl max-w-md">
                      <p className="text-xs font-bold text-slate-600 mb-2">Try asking:</p>
                      <p className="text-xs text-slate-500">• "Create a product launch campaign for our new feature"</p>
                      <p className="text-xs text-slate-500">• "Plan a customer retention email sequence"</p>
                      <p className="text-xs text-slate-500">• "Design a referral program for our best clients"</p>
                    </div>
                  </div>
                )}
                {campaignMessages.map((m, idx) => (
                  <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-2xl ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-50 border border-slate-100 text-gray-800 rounded-bl-none shadow-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                      
                      {m.role === 'agent' && m.minitasks && m.minitasks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-xs font-bold text-indigo-600 mb-2">✅ {m.minitasks.length} Minitasks Generated</p>
                          <button
                            onClick={() => {
                              setCurrentMinitasks(m.minitasks || []);
                              setShowLeadSelector(true);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                          >
                            Select Lead & Send →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                )}
             </div>

             <form onSubmit={handleCampaignChat} className="p-4 bg-slate-50 border-t border-gray-100 flex gap-3">
               <input 
                 className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                 placeholder="Describe your campaign idea..."
                 value={campaignQuery}
                 onChange={(e) => setCampaignQuery(e.target.value)}
               />
               <button type="submit" disabled={loadingChat} className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md disabled:opacity-50">
                 Generate Tasks
               </button>
             </form>
          </div>
        </div>
      </div>
      
      {showLeadSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowLeadSelector(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Select Lead to Send Minitasks</h3>
            <p className="text-sm text-slate-500 mb-6">Choose which lead should receive the campaign minitask PDF</p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {(() => {
                const leadKey = `sully_leads_data_${project.id}`;
                const leadsSaved = localStorage.getItem(leadKey);
                const allLeads: Lead[] = leadsSaved ? JSON.parse(leadsSaved) : MOCK_LEADS;
                
                return allLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                      selectedLead?.id === lead.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{lead.name}</p>
                        <p className="text-sm text-slate-600">{lead.company} • {lead.email}</p>
                        <p className="text-xs text-slate-500 mt-1">{lead.title} | {lead.industry}</p>
                      </div>
                      {selectedLead?.id === lead.id && (
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeadSelector(false)}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={sendMinitasksTolead}
                disabled={!selectedLead}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                📧 Send PDF via Email
              </button>
            </div>
          </div>
        </div>
      )}

      {previewContent && (
        <div className="bg-slate-950 rounded-3xl p-10 shadow-2xl animate-fadeIn relative border border-white/5">
          <button onClick={() => setPreviewContent(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white font-bold transition-colors">✕ Close</button>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 font-serif text-slate-300 text-base whitespace-pre-wrap leading-relaxed shadow-inner max-h-[500px] overflow-y-auto scrollbar-hide">
            {previewContent}
          </div>
          <div className="mt-8 flex justify-end gap-4">
             <button onClick={() => { navigator.clipboard.writeText(previewContent); alert("Copied to clipboard!"); }} className="px-6 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-all">Copy Text</button>
             <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40">Send to CRM</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
