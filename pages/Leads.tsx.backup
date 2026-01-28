import React, { useState, useEffect } from 'react';
import { Lead, CalendarEvent } from '../types';
import { MOCK_LEADS } from '../constants';
import { leadScorerAgent, synthesizeDynamicICP } from '../geminiService';
import { Project } from '../App';
import { addCalendarEvent, isCalendarConnected } from '../googleCalendarService';

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
  const [searchQuery, setSearchQuery] = useState('');
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

  const scheduleMeetingForLead = (lead: Lead) => {
    if (!isCalendarConnected()) {
      alert('In this demo, calendar access is simulated. Please log in with Google on the landing screen first.');
      return;
    }
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(11, 0, 0, 0);
    const event: CalendarEvent = {
      id: `cal-${Date.now()}`,
      projectId: project.id,
      leadId: lead.id,
      leadName: lead.name,
      title: `Intro with ${lead.name} (${lead.company || 'Prospect'})`,
      start: start.toISOString(),
      location: lead.location || 'Google Meet',
      status: 'scheduled',
      source: 'auto'
    };
    addCalendarEvent(project.id, event);
    alert('Sample Google Calendar event created for this lead (demo only).');
  };

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

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: string }> = {
      new: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✨' },
      contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📧' },
      qualified: { label: 'Qualified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: '✅' },
      scored: { label: 'Scored', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🎯' },
      nurturing: { label: 'Nurturing', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🌱' },
      lost: { label: 'Lost', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '💤' }
    };
    const config = configs[status] || configs.new;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${config.color} uppercase tracking-wider`}>
        <span>{config.icon}</span> {config.label}
      </span>
    );
  };

  const getLeadInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-indigo-500 to-purple-500',
      'bg-gradient-to-br from-emerald-500 to-teal-500',
      'bg-gradient-to-br from-amber-500 to-orange-500',
      'bg-gradient-to-br from-rose-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-violet-500 to-fuchsia-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      (lead.company || '').toLowerCase().includes(query) ||
      (lead.title || '').toLowerCase().includes(query)
    );
  });

  const leadStats = {
    total: leads.length,
    avgScore: leads.filter(l => l.score).length > 0 
      ? Math.round(leads.filter(l => l.score).reduce((sum, l) => sum + (l.score || 0), 0) / leads.filter(l => l.score).length)
      : 0,
    scored: leads.filter(l => l.score).length,
    highValue: leads.filter(l => (l.score || 0) > 80).length
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Lead Command Center</h2>
          <p className="text-slate-500 font-medium tracking-tight">
            Pipeline for <span className="text-indigo-600 font-bold">{project.name}</span> · Clients & startup deals
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
          <span>➕</span> Add Prospect
        </button>
      </header>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-1">Total Leads</p>
              <p className="text-3xl font-black text-indigo-900">{leadStats.total}</p>
            </div>
            <div className="text-4xl opacity-20">👥</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Avg Fit Score</p>
              <p className="text-3xl font-black text-emerald-900">{leadStats.avgScore}%</p>
            </div>
            <div className="text-4xl opacity-20">📊</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">AI Scored</p>
              <p className="text-3xl font-black text-amber-900">{leadStats.scored}</p>
            </div>
            <div className="text-4xl opacity-20">🤖</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-1">High Value</p>
              <p className="text-3xl font-black text-rose-900">{leadStats.highValue}</p>
            </div>
            <div className="text-4xl opacity-20">⭐</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search leads by name, email, company, or title..."
            className="w-full pl-12 pr-4 py-3 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-9 space-y-6">
          {filteredLeads.map((lead) => {
            const trend = getScoreTrend(lead);
            return (
              <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden">
                {/* Priority Indicator */}
                {lead.score && lead.score > 80 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl">
                    ⭐ HIGH VALUE
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Section: Lead Info */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${getAvatarColor(lead.name)} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                          {getLeadInitials(lead.name)}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <EditableWrapper className="flex-1">
                              <input 
                                type="text" 
                                className="text-xl font-bold text-slate-900 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full border border-transparent focus:border-indigo-200 transition-all" 
                                value={lead.name} 
                                onChange={(e) => updateLeadField(lead.id, 'name', e.target.value)} 
                              />
                            </EditableWrapper>
                          </div>
                          
                          <EditableWrapper>
                            <input 
                              type="text" 
                              className="text-sm text-slate-500 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-1.5 outline-none w-full border border-transparent focus:border-indigo-200 transition-all" 
                              value={lead.title} 
                              placeholder="Job Title"
                              onChange={(e) => updateLeadField(lead.id, 'title', e.target.value)} 
                            />
                          </EditableWrapper>

                          {/* Email */}
                          <EditableWrapper>
                            <input 
                              type="email" 
                              className="text-xs text-indigo-600 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-1.5 outline-none w-full border border-transparent focus:border-indigo-200 transition-all flex items-center gap-1" 
                              value={lead.email} 
                              onChange={(e) => updateLeadField(lead.id, 'email', e.target.value)} 
                            />
                          </EditableWrapper>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(lead.status)}
                          </div>
                        </div>

                        {lead.score && (
                          <div className="flex flex-col items-center group/tooltip relative flex-shrink-0">
                            <div className={`text-3xl font-black ${lead.score > 80 ? 'text-emerald-600' : lead.score > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {lead.score}%
                            </div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Fit Score</span>
                            
                            <div className="absolute bottom-full right-0 mb-4 w-80 p-5 bg-slate-900/95 backdrop-blur-xl text-white text-xs rounded-3xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl border border-white/10 scale-95 group-hover/tooltip:scale-100 max-h-[500px] overflow-y-auto">
                              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                                <p className="font-black text-indigo-400 uppercase tracking-widest text-[10px]">Strategic Analysis</p>
                                <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-bold text-[9px]">Agent Intelligence</span>
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

                              <p className="leading-relaxed text-slate-300 mb-4 bg-white/5 p-3 rounded-xl border border-white/5 italic text-[11px]">
                                "{lead.icpReasoning}"
                              </p>

                              {lead.scoreSources && lead.scoreSources.length > 0 && (
                                <div className="pt-3 border-t border-white/10">
                                  <p className="font-bold text-slate-500 mb-2 uppercase tracking-widest text-[9px]">Research Grounding</p>
                                  <div className="flex flex-col gap-2">
                                    {lead.scoreSources.map((s, i) => (
                                      <a
                                        key={i}
                                        href={s.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-300 hover:text-white transition-colors truncate block flex items-center gap-2 pointer-events-auto text-[10px]"
                                      >
                                        <span>🔗</span> {s.title}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-full right-6 border-8 border-transparent border-t-slate-900/95"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div> 
                            value={lead.name} 
                            onChange={(e) => updateLeadField(lead.id, 'name', e.target.value)} 
                          />
                        </EditableWrapper>
                        {lead.score && (
                          <div className="flex flex-col items-center group/tooltip relative flex-shrink-0">
                            <div className={`text-3xl font-black ${lead.score > 80 ? 'text-emerald-600' : lead.score > 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {lead.score}%
                            </div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Fit Score</span>
                            
                            <div className="absolute bottom-full right-0 mb-4 w-80 p-5 bg-slate-900/95 backdrop-blur-xl text-white text-xs rounded-3xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[100] shadow-2xl border border-white/10 scale-95 group-hover/tooltip:scale-100">
                              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                                    <ProgressBar label="Dynamic Fit" value={lead.scoreBreakdown.vision} color="text-purple-400" />
                                  </>
                                )}
                              </div>

                              <p className="leading-relaxed text-slate-300 mb-4 bg-white/5 p-3 rounded-xl border border-white/5 italic text-[11px]">
                                "{lead.icpReasoning}"
                              </p>

                              {lead.scoreSources && lead.scoreSources.length > 0 && (
                                <div className="pt-3 border-t border-white/10">
                                  <p className="font-bold text-slate-500 mb-2 uppercase tracking-widest text-[9px]">Research Grounding</p>
                                  <div className="flex flex-col gap-2">
                                    {lead.scoreSources.map((s, i) => (
                                      <a
                                        key={i}
                                        href={s.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-300 hover:text-white transition-colors truncate block flex items-center gap-2 pointer-events-auto text-[10px]"
                                      >
                                        <span>🔗</span> {s.title}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="absolute top-full right-6 border-8 border-transparent border-t-slate-900/95"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <EditableWrapper>
                        <input 
                          type="text" 
                          className="text-sm text-slate-500 bg-transparent hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-1.5 outline-none w-full border border-transparent focus:border-indigo-200 transition-all" 
                          value={lead.title} 
                          placeholder="Job Title"
                          onChange={(e) => updateLeadField(lead.id, 'title', e.target.value)} 
                        />
                      </EditableWrapper>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Company</label>
                        <EditableWrapper>
                          <input 
                            type="text" 
                            className="text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full border border-slate-100 focus:border-indigo-200 transition-all" 
                            value={lead.company} 
                            onChange={(e) => updateLeadField(lead.id, 'company', e.target.value)} 
                          />
                        </EditableWrapper>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Industry</label>
                        <EditableWrapper>
                          <select 
                            className="text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full border border-slate-100 focus:border-indigo-200 transition-all cursor-pointer"
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
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Location</label>
                      <EditableWrapper>
                        <input 
                          type="text" 
                          placeholder="City, Country..." 
                          className="text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full border border-slate-100 focus:border-indigo-200 transition-all" 
                          value={lead.location} 
                          onChange={(e) => updateLeadField(lead.id, 'location', e.target.value)} 
                        />
                      </EditableWrapper>
                    </div>
                  </div>

                  {/* Middle Section: Strategy & Response */}
                  <div className="lg:col-span-4 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Assigned Action</label>
                      <EditableWrapper>
                        <select 
                          className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 focus:bg-white focus:ring-2 focus:ring-indigo-200 rounded-lg px-3 py-2.5 outline-none w-full transition-all cursor-pointer" 
                          value={lead.assignedAction || ''} 
                          onChange={(e) => updateLeadField(lead.id, 'assignedAction', e.target.value)}
                        >
                          <option value="">Select Action...</option>
                          {actions.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </EditableWrapper>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Skills & Expertise</label>
                      <EditableWrapper>
                        <input 
                          type="text" 
                          placeholder="AI, Cloud Security, React..." 
                          className="text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full border border-slate-100 focus:border-indigo-200 transition-all placeholder:text-slate-300" 
                          value={lead.skills || ''} 
                          onChange={(e) => updateLeadField(lead.id, 'skills', e.target.value)} 
                        />
                      </EditableWrapper>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Last Response</label>
                      <EditableWrapper>
                        <textarea 
                          className="text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full min-h-[80px] resize-none border border-slate-100 focus:border-indigo-200 transition-all placeholder:text-slate-300" 
                          placeholder="Last message from lead..." 
                          value={lead.lastResponse || ''} 
                          onChange={(e) => updateLeadField(lead.id, 'lastResponse', e.target.value)} 
                        />
                      </EditableWrapper>
                    </div>
                  </div>

                  {/* Right Section: Actions & Metrics */}
                  <div className="lg:col-span-3 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider px-1">Last Contacted</label>
                      <div className="flex flex-col gap-2">
                        <EditableWrapper>
                          <input 
                            type="date" 
                            className="text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-lg px-3 py-2 outline-none w-full border border-slate-100 focus:border-indigo-200 transition-all cursor-pointer" 
                            value={lead.lastContacted || ''} 
                            onChange={(e) => updateLeadField(lead.id, 'lastContacted', e.target.value)} 
                          />
                        </EditableWrapper>
                        {getRecencyBadge(lead.lastContacted)}
                      </div>
                    </div>

                    {trend && (
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 block">7-Day Trend</label>
                        <div className={`flex items-center gap-2 font-bold text-xl ${trend.direction === 'up' ? 'text-emerald-500' : trend.direction === 'down' ? 'text-rose-500' : 'text-slate-400'}`}>
                          <span className="text-2xl">{trend.direction === 'up' ? '↗️' : trend.direction === 'down' ? '↘️' : '➡️'}</span>
                          <span>{Math.abs(trend.diff)}%</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      {!lead.score ? (
                        <button 
                          onClick={() => handleScoreLead(lead.id)} 
                          disabled={!!scoringStatus[lead.id]} 
                          className={`text-sm font-black uppercase border px-5 py-3 rounded-xl transition-all ${
                            scoringStatus[lead.id] 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-500 animate-pulse' 
                              : 'bg-gradient-to-r from-indigo-600 to-purple-600 border-transparent text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-95'
                          }`}
           filteredLeads.length === 0 && leads.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg font-bold text-slate-400">No leads match your search</p>
              <p className="text-sm text-slate-300 mt-2">Try adjusting your search terms</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Clear search
              </button>
            </div>space-y-6 sticky top-6">
            <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-lg border border-slate-200">
              <div className="space-y-2 mb-4">
                {actions.map(a => (
                  <div key={a} className="flex items-center justify-between p-3 bg-white rounded-xl group transition-all hover:shadow-md hover:border-indigo-100 border border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{a}</span>
                    <button onClick={() => setActions(actions.filter(x => x !== a))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="New action..." 
                  className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                  value={newAction} 
                  onChange={(e) => setNewAction(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && newAction && (setActions([...actions, newAction]), setNewAction(''))} 
                />
                <button 
                  onClick={() => newAction && (setActions([...actions, newAction]), setNewAction(''))} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 rounded-lg font-bold hover:shadow-lg transition-all active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2">Pro Tip</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Leads scoring 80+ are high-value prospects. Prioritize calendar meetings and personalized outreach for maximum conversion.
                  </p>
                </div>
              </div  </button>
                      )}
                      
                      <button 
                        onClick={() => scheduleMeetingForLead(lead)}
                        className="text-sm font-bold text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                      >
                        <span>📅</span> Add to Calendar
                      </button>
                      
                      <button 
                        onClick={() => setLeads(leads.filter(l => l.id !== lead.id))} 
                        className="text-sm font-bold text-rose-600 border border-rose-200 px-5 py-2.5 rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                      >
                        <span>🗑️</span> Remove Lead
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {leads.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-20 text-center">
              <div className="text-6xl mb-4 opacity-20">📋</div>
              <p className="text-lg font-bold text-slate-400">No leads yet</p>
              <p className="text-sm text-slate-300 mt-2">Start your B2B strategy for {project.name} by adding a prospect</p>
            </div>
          )}
        </div>

        {/* Sidebar: Action Library */}
        <div className="xl:col-span-3">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><span>📋</span> Action Library</h3>
            <div className="space-y-2 mb-4">
              {actions.map(a => (
                <div key={a} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group transition-all hover:bg-slate-100">
                  <span className="text-xs font-bold text-slate-600">{a}</span>
                  <button onClick={() => setActions(actions.filter(x => x !== a))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-colors p-1">✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="New action..." 
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" 
                value={newAction} 
                onChange={(e) => setNewAction(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && newAction && (setActions([...actions, newAction]), setNewAction(''))} 
              />
              <button 
                onClick={() => newAction && (setActions([...actions, newAction]), setNewAction(''))} 
                className="bg-indigo-600 text-white px-4 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm"
              >
                +
              </button>
            </div>
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