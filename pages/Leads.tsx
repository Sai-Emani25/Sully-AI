import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { MOCK_LEADS } from '../constants';
import { leadScorerAgent, synthesizeDynamicICP } from '../geminiService';
import { Project } from '../App';

interface LeadsPageProps {
  project: Project;
}

const EditableWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`relative group flex items-center gap-2 rounded-lg transition-all ${className}`}>
    <div className="flex-1 w-full">
      {children}
    </div>
    <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </div>
  </div>
);

const LeadsPage: React.FC<LeadsPageProps> = ({ project }) => {
  const leadsKey = `sully_leads_data_${project.id}`;
  const actionsKey = `sully_custom_actions_${project.id}`;
  const visionKey = `sully_vision_${project.id}`;
  const chatKey = `sully_chat_history_${project.id}`;

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(leadsKey);
    if (saved) return JSON.parse(saved);

    if (project.id === 'proj-1') return MOCK_LEADS.filter(l => l.industry === 'tech' || l.industry === 'finance');
    if (project.id === 'proj-2') return MOCK_LEADS.filter(l => l.industry === 'healthcare');
    if (project.id === 'proj-3') return MOCK_LEADS.filter(l => l.industry === 'retail');
    
    return [];
  });
  
  const [actions, setActions] = useState<string[]>(() => {
    const saved = localStorage.getItem(actionsKey);
    if (saved) return JSON.parse(saved);
    
    if (project.id === 'proj-1') return ["Security Audit", "Vulnerability Report", "Compliance Check"];
    if (project.id === 'proj-2') return ["Patient Privacy Review", "Medical Records Sync", "Healthcare Outreach"];
    return ["Follow-up Email", "Product Demo", "LinkedIn Outreach"];
  });

  const [scoringStatus, setScoringStatus] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAction, setNewAction] = useState('');
  const [newLead, setNewLead] = useState<Partial<Lead>>({ 
    name: '', 
    email: '', 
    company: '', 
    industry: 'tech', 
    location: '', 
    title: '', 
    status: 'new',
    lastContacted: new Date().toISOString().split('T')[0],
    skills: '',
    assignedAction: '',
    lastResponse: ''
  });

  useEffect(() => {
    localStorage.setItem(leadsKey, JSON.stringify(leads));
  }, [leads, leadsKey]);

  useEffect(() => {
    localStorage.setItem(actionsKey, JSON.stringify(actions));
  }, [actions, actionsKey]);

  const handleScoreLead = async (leadId: string) => {
    setScoringStatus(prev => ({ ...prev, [leadId]: 'Consulting Strategy Brain...' }));
    
    try {
      const lead = leads.find(l => l.id === leadId);
      const vision = localStorage.getItem(visionKey) || "";
      
      const chatHistorySaved = localStorage.getItem(chatKey);
      const chatHistory = chatHistorySaved ? JSON.parse(chatHistorySaved) : [];
      
      const dynamicICP = await synthesizeDynamicICP(vision, chatHistory);
      
      setScoringStatus(prev => ({ ...prev, [leadId]: 'Researching Market Signals...' }));

      if (lead) {
        const res = await leadScorerAgent(lead, dynamicICP);
        
        const newHistory = [
          ...(lead.scoreHistory || []),
          { date: new Date().toISOString(), score: res.score }
        ];

        setLeads(prev => prev.map(l => l.id === leadId ? { 
          ...l, 
          score: res.score, 
          scoreHistory: newHistory,
          icpReasoning: res.reasoning, 
          scoreSources: res.sources,
          scoreBreakdown: res.breakdown,
          status: 'scored' 
        } : l));
      }
    } finally { 
      setScoringStatus(prev => {
        const next = { ...prev };
        delete next[leadId];
        return next;
      });
    }
  };

  const addLead = () => {
    if (!newLead.name || !newLead.email) return;
    const l: Lead = { 
      ...newLead as Lead, 
      id: Math.random().toString(36).substr(2, 9), 
      lastActivity: new Date().toISOString(), 
      status: 'new',
      scoreHistory: []
    };
    setLeads([...leads, l]);
    setIsAddModalOpen(false);
    setNewLead({ 
      name: '', 
      email: '', 
      company: '', 
      industry: 'tech', 
      location: '', 
      title: '', 
      status: 'new',
      lastContacted: new Date().toISOString().split('T')[0],
      skills: '',
      assignedAction: '',
      lastResponse: ''
    });
  };

  const updateLeadField = (id: string, field: keyof Lead, value: any) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const getScoreTrend = (lead: Lead) => {
    if (!lead.scoreHistory || lead.scoreHistory.length < 2) return null;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    
    // Sort history by date descending
    const sortedHistory = [...lead.scoreHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const latestScore = sortedHistory[0].score;
    // Find earliest score within the last 7 days (or the absolute earliest if all are newer than 7 days)
    const weekAgoEntries = sortedHistory.filter(h => new Date(h.date) >= sevenDaysAgo);
    const comparisonEntry = weekAgoEntries.length > 0 ? weekAgoEntries[weekAgoEntries.length - 1] : sortedHistory[sortedHistory.length - 1];
    
    const diff = latestScore - comparisonEntry.score;
    return {
      diff,
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable'
    };
  };

  const ProgressBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-400">
        <span>{label}</span>
        <span className={color}>{value}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-700 ease-out`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );

  const getRecencyBadge = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let colorClass = "bg-slate-100 text-slate-500";
    let label = `${diffDays}d ago`;

    if (diffDays === 0) {
      colorClass = "bg-emerald-100 text-emerald-600";
      label = "Today";
    } else if (diffDays <= 3) {
      colorClass = "bg-emerald-50 text-emerald-500";
    } else if (diffDays <= 14) {
      colorClass = "bg-amber-50 text-amber-500";
    } else {
      colorClass = "bg-rose-50 text-rose-500";
      label = diffDays > 30 ? `${Math.floor(diffDays/30)}mo ago` : `${diffDays}d ago`;
    }

    return (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Lead Command Center</h2>
          <p className="text-slate-500 font-medium tracking-tight">
            Isolated Workspace: <span className="text-indigo-600 font-bold">{project.name}</span>
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center gap-2">
          <span>➕</span> Add Prospect
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name & Title</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company & Industry</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Contacted</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy Configuration</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Response</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fit Score</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trend (7d)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leads.map((lead) => {
                    const trend = getScoreTrend(lead);
                    return (
                      <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <EditableWrapper>
                              <input 
                                type="text" 
                                className="text-sm font-bold text-slate-900 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 outline-none w-full border border-transparent focus:border-indigo-100 transition-all" 
                                value={lead.name} 
                                onChange={(e) => updateLeadField(lead.id, 'name', e.target.value)} 
                              />
                            </EditableWrapper>
                            <EditableWrapper>
                              <input 
                                type="text" 
                                className="text-[10px] text-slate-400 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 outline-none w-full border border-transparent focus:border-indigo-100 transition-all" 
                                value={lead.title} 
                                placeholder="Job Title"
                                onChange={(e) => updateLeadField(lead.id, 'title', e.target.value)} 
                              />
                            </EditableWrapper>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <EditableWrapper>
                              <input 
                                type="text" 
                                className="text-sm font-medium text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 outline-none w-full border border-transparent focus:border-indigo-100 transition-all" 
                                value={lead.company} 
                                onChange={(e) => updateLeadField(lead.id, 'company', e.target.value)} 
                              />
                            </EditableWrapper>
                            <EditableWrapper>
                              <select 
                                className="text-[10px] font-bold text-slate-400 bg-transparent hover:bg-slate-100/50 focus:bg-white outline-none w-full cursor-pointer uppercase tracking-tighter border border-transparent focus:border-indigo-100 rounded transition-all px-1"
                                value={lead.industry}
                                onChange={(e) => updateLeadField(lead.id, 'industry', e.target.value as any)}
                              >
                                <option value="tech">Technology</option>
                                <option value="finance">Finance</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="retail">Retail</option>
                                <option value="manufacturing">Manufacturing</option>
                              </select>
                            </EditableWrapper>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <EditableWrapper>
                            <input 
                              type="text" 
                              placeholder="Location..." 
                              className="text-xs text-slate-600 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 py-1 outline-none w-full border border-transparent focus:border-indigo-100 transition-all" 
                              value={lead.location} 
                              onChange={(e) => updateLeadField(lead.id, 'location', e.target.value)} 
                            />
                          </EditableWrapper>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <EditableWrapper>
                              <input 
                                type="date" 
                                className="text-xs font-bold text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded-lg px-2 py-1.5 outline-none w-full cursor-pointer transition-all" 
                                value={lead.lastContacted || ''} 
                                onChange={(e) => updateLeadField(lead.id, 'lastContacted', e.target.value)} 
                              />
                            </EditableWrapper>
                            <div className="flex justify-start">
                              {getRecencyBadge(lead.lastContacted)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <EditableWrapper>
                              <div className="relative w-full">
                                <select 
                                  className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 outline-none w-full appearance-none hover:bg-indigo-100 transition-colors cursor-pointer" 
                                  value={lead.assignedAction || ''} 
                                  onChange={(e) => updateLeadField(lead.id, 'assignedAction', e.target.value)}
                                >
                                  <option value="">Select Action...</option>
                                  {actions.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-indigo-400 italic">action</div>
                              </div>
                            </EditableWrapper>
                            <EditableWrapper>
                              <input 
                                type="text" 
                                placeholder="Add skills (e.g. AI, React)..." 
                                className="text-[11px] font-medium text-slate-600 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded-lg px-2 py-1.5 outline-none w-full transition-all placeholder:text-slate-300" 
                                value={lead.skills || ''} 
                                onChange={(e) => updateLeadField(lead.id, 'skills', e.target.value)} 
                              />
                            </EditableWrapper>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <EditableWrapper>
                            <textarea 
                              className="text-[10px] text-slate-500 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded px-1 py-1 outline-none w-full min-h-[60px] resize-none border border-transparent focus:border-indigo-100 transition-all placeholder:text-slate-300" 
                              placeholder="Awaiting response from lead..." 
                              value={lead.lastResponse || ''} 
                              onChange={(e) => updateLeadField(lead.id, 'lastResponse', e.target.value)} 
                            />
                          </EditableWrapper>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {lead.score ? (
                            <div className="flex flex-col items-center group/tooltip relative">
                              <span className={`text-sm font-black ${lead.score > 80 ? 'text-emerald-600' : lead.score > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {lead.score}%
                              </span>
                              <button onClick={() => handleScoreLead(lead.id)} className="text-[9px] text-slate-300 hover:text-indigo-400 font-bold uppercase transition-colors">Re-evaluate</button>
                              
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 p-4 bg-slate-900/95 backdrop-blur-xl text-white text-[10px] rounded-[1.5rem] opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl border border-white/10 scale-95 group-hover/tooltip:scale-100">
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                  <p className="font-black text-indigo-400 uppercase tracking-widest text-[9px]">Strategic Analysis</p>
                                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold text-[8px]">Agent Intelligence</span>
                                </div>
                                
                                <div className="space-y-3 mb-4">
                                  {lead.scoreBreakdown && (
                                    <>
                                      <ProgressBar label="Industry Signal" value={lead.scoreBreakdown.industry} color="text-emerald-400" />
                                      <ProgressBar label="Regional Hub" value={lead.scoreBreakdown.location} color="text-blue-400" />
                                      <ProgressBar label="Authority Level" value={lead.scoreBreakdown.authority} color="text-amber-400" />
                                      <ProgressBar label="Dynamic Fit" value={lead.scoreBreakdown.vision} color="text-purple-400" />
                                    </>
                                  )}
                                </div>

                                <p className="leading-relaxed text-slate-300 mb-4 bg-white/5 p-2 rounded-xl border border-white/5 italic">
                                  "{lead.icpReasoning}"
                                </p>

                                {lead.scoreSources && lead.scoreSources.length > 0 && (
                                  <div className="pt-3 border-t border-white/10">
                                    <p className="font-bold text-slate-500 mb-2 uppercase tracking-widest text-[8px]">Research Grounding</p>
                                    <div className="flex flex-col gap-1.5">
                                      {lead.scoreSources.map((s, i) => (
                                        <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white transition-colors truncate block flex items-center gap-1.5 pointer-events-auto">
                                          <span className="text-[10px]">🔗</span> {s.title}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleScoreLead(lead.id)} 
                              disabled={!!scoringStatus[lead.id]} 
                              className={`text-[10px] font-black uppercase border px-4 py-2 rounded-xl transition-all ${
                                scoringStatus[lead.id] 
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-500 animate-pulse' 
                                  : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm hover:shadow-indigo-100 active:scale-95'
                              }`}
                            >
                              {scoringStatus[lead.id] || 'Run Agent Score'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {trend ? (
                            <div className="flex flex-col items-center justify-center">
                              <div className={`flex items-center gap-1 font-bold text-sm ${trend.direction === 'up' ? 'text-emerald-500' : trend.direction === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                                <span>{trend.direction === 'up' ? '↗️' : trend.direction === 'down' ? '↘️' : '➡️'}</span>
                                <span className="text-[10px]">{Math.abs(trend.diff)}%</span>
                              </div>
                              <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter mt-0.5">Change</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs font-bold">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setLeads(leads.filter(l => l.id !== lead.id))} className="text-slate-300 hover:text-red-500 p-2 transition-colors">🗑️</button>
                        </td>
                      </tr>
                    );
                  })}
                  {leads.length === 0 && <tr><td colSpan={9} className="py-20 text-center opacity-30 text-sm italic font-medium text-slate-400">Workspace is empty. Start your B2B strategy for {project.name} by adding a prospect.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full max-w-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><span>📋</span> Global Action Library</h3>
              <div className="space-y-2 mb-4">
                {actions.map(a => (
                  <div key={a} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group transition-all hover:bg-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">{a}</span>
                    <button onClick={() => setActions(actions.filter(x => x !== a))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-colors p-1">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="New action..." className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500" value={newAction} onChange={(e) => setNewAction(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && newAction && (setActions([...actions, newAction]), setNewAction(''))} />
                <button onClick={() => newAction && (setActions([...actions, newAction]), setNewAction(''))} className="bg-indigo-600 text-white px-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm">+</button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl animate-fadeIn border border-white max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Prospect</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">Manual CRM Entry</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-2">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="John Smith" 
                  value={newLead.name} 
                  onChange={(e) => setNewLead({...newLead, name: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="john@company.com" 
                  value={newLead.email} 
                  onChange={(e) => setNewLead({...newLead, email: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Job Title</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="VP Engineering" 
                  value={newLead.title} 
                  onChange={(e) => setNewLead({...newLead, title: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Company Name</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="Acme Corp" 
                  value={newLead.company} 
                  onChange={(e) => setNewLead({...newLead, company: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Industry</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    value={newLead.industry}
                    onChange={(e) => setNewLead({...newLead, industry: e.target.value as any})}
                  >
                    <option value="tech">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                <input 
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="San Francisco, CA" 
                  value={newLead.location} 
                  onChange={(e) => setNewLead({...newLead, location: e.target.value})} 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Initial Action</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    value={newLead.assignedAction}
                    onChange={(e) => setNewLead({...newLead, assignedAction: e.target.value})}
                  >
                    <option value="">No Initial Action</option>
                    {actions.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Initial Contact Date</label>
                <input 
                  type="date" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" 
                  value={newLead.lastContacted} 
                  onChange={(e) => setNewLead({...newLead, lastContacted: e.target.value})} 
                />
              </div>

              <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expertise / Key Skills</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all pl-10 placeholder:text-slate-300" 
                    placeholder="e.g. Cloud Security, Zero Trust, ISO 27001..." 
                    value={newLead.skills} 
                    onChange={(e) => setNewLead({...newLead, skills: e.target.value})} 
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">✨</span>
                </div>
                <p className="text-[9px] text-slate-400 italic px-1 mt-1">Sully uses these skills to tailor outreach and intelligence scoring.</p>
              </div>

              <div className="space-y-1 col-span-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Last Known Response</label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px] placeholder:text-slate-300" 
                  placeholder="Paste lead's latest message or specific feedback from their last response..." 
                  value={newLead.lastResponse} 
                  onChange={(e) => setNewLead({...newLead, lastResponse: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-10">
              <button onClick={addLead} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Create Lead</button>
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;