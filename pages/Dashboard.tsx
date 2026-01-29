
import React, { useState, useEffect, useMemo } from 'react';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Line, ComposedChart, Legend } from 'recharts';
import { Project } from '../App';
import { CalendarEvent, Lead } from '../types';
import { getCalendarEvents, saveCalendarEvents } from '../googleCalendarService';

const KPI_DATA_BASE = [
  { title: 'Conv. Uplift', baseValue: 32.4, suffix: '%', change: 'Lead to Opp', trend: '+4.2%', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '📈' },
  { title: 'Manual Savings', baseValue: 42, suffix: '%', change: 'Hours Saved', trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-50', icon: '⚡' },
  { title: 'CRM Sync', baseValue: 1.2, suffix: 's', change: 'Avg. Latency', trend: '-0.3s', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '🔄' },
  { title: 'Personalization', baseValue: 88, suffix: '%', change: 'NLP Score', trend: '+2.1%', color: 'text-purple-600', bg: 'bg-purple-50', icon: '🧠' },
];

const WORKSPACE_MEMBERS: Record<string, {name: string, role: string, avatar: string}[]> = {
  'proj-1': [
    { name: 'Sanjay R.', role: 'SecOps Strategy', avatar: 'SR' },
    { name: 'Meera K.', role: 'Compliance Expert', avatar: 'MK' },
    { name: 'Arjun P.', role: 'Cloud Architect', avatar: 'AP' },
    { name: 'Deepika S.', role: 'Lead Researcher', avatar: 'DS' }
  ],
  'proj-2': [
    { name: 'Dr. Priya M.', role: 'Health Consultant', avatar: 'PM' },
    { name: 'Rahul V.', role: 'Data Architect', avatar: 'RV' },
    { name: 'Ishaan K.', role: 'Privacy Officer', avatar: 'IK' },
    { name: 'Kavya B.', role: 'Clinical Ops', avatar: 'KB' }
  ],
  'proj-3': [
    { name: 'Amit V.', role: 'Growth Specialist', avatar: 'AV' },
    { name: 'Sara L.', role: 'Brand Strategist', avatar: 'SL' },
    { name: 'Nisha G.', role: 'Customer Success', avatar: 'NG' },
    { name: 'Rohan M.', role: 'Retail Analyst', avatar: 'RM' }
  ]
};

const Dashboard: React.FC<{ project: Project }> = ({ project }) => {
  const syncKey = `sully_sync_${project.id}`;
  const [lastSync, setLastSync] = useState(() => localStorage.getItem(syncKey) || "Never");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showScoreChart, setShowScoreChart] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const eventsKey = `sully_calendar_events_${project.id}`;
  
  // Get leads data for score tracking
  const leads = useMemo(() => {
    const leadsKey = `sully_leads_data_${project.id}`;
    const saved = localStorage.getItem(leadsKey);
    if (saved) {
      const parsedLeads: Lead[] = JSON.parse(saved);
      return parsedLeads.filter(l => l.score && l.score > 0);
    }
    return [];
  }, [project.id, lastSync]); // Re-fetch when sync happens
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const existing = getCalendarEvents(project.id);
    if (existing.length > 0) return existing;

    const baseDate = new Date();
    const day = (offset: number) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset);
      d.setHours(11, 0, 0, 0);
      return d.toISOString();
    };

    const samples: Record<string, CalendarEvent[]> = {
      'proj-1': [
        {
          id: 'cal-sample-1', projectId: project.id, leadId: '1', leadName: 'CISO, AP Government',
          title: 'Security posture review (client)', start: day(1), location: 'Google Meet', status: 'scheduled', source: 'sample'
        },
        {
          id: 'cal-sample-2', projectId: project.id, leadId: '2', leadName: 'Cloud infra lead',
          title: 'Multi-cloud threat modelling (startup)', start: day(3), location: 'Zoom', status: 'scheduled', source: 'sample'
        }
      ],
      'proj-2': [
        {
          id: 'cal-sample-3', projectId: project.id, leadId: '1', leadName: 'Hospital COO',
          title: 'OPD workflow + HIPAA review', start: day(2), location: 'Google Meet', status: 'scheduled', source: 'sample'
        }
      ],
      'proj-3': [
        {
          id: 'cal-sample-4', projectId: project.id, leadId: '1', leadName: 'Retail expansion head',
          title: 'Tier-2 omni-channel rollout', start: day(1), location: 'Client HQ', status: 'scheduled', source: 'sample'
        }
      ]
    };

    const seeded = samples[project.id] || [];
    if (seeded.length) {
      saveCalendarEvents(project.id, seeded);
    }
    return seeded;
  });

  // Lead Score Chart Data - Reality vs Expectation
  const scoreChartData = useMemo(() => {
    if (!selectedLead || !selectedLead.scoreHistory) return [];
    
    const history = selectedLead.scoreHistory;
    const currentScore = selectedLead.score || 0;
    
    // Generate expectation projection (optimistic linear growth)
    const initialScore = history[0]?.score || currentScore;
    const targetScore = Math.min(100, currentScore + 25); // Expected improvement
    const daysBetween = history.length > 1 ? 7 : 5;
    
    return Array.from({ length: daysBetween }).map((_, i) => {
      const realScore = history[i]?.score || (i < history.length ? history[history.length - 1].score : currentScore);
      const expectedScore = initialScore + ((targetScore - initialScore) / (daysBetween - 1)) * i;
      
      return {
        name: `Day ${i + 1}`,
        reality: Math.round(realScore),
        expectation: Math.round(expectedScore)
      };
    });
  }, [selectedLead]);

  // Unique Chart Data per Project
  const chartData = useMemo(() => {
    const seed = project.id.split('-')[1] || '1';
    

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowScoreChart(true);
  };const base = 20 + parseInt(seed) * 5;
    return Array.from({ length: 7 }).map((_, i) => ({
      name: `Day ${i + 1}`,
      efficiency: base + Math.sin(i + parseInt(seed)) * 10 + i * 5,
      engagement: (base + 10) + Math.cos(i) * 5 + i * 3
    }));
  }, [project.id]);

  const getProjectValue = (base: number, suffix: string) => {
    const seed = project.id.split('-')[1] || '1';
    const multiplier = 1 + (parseInt(seed) * 0.08);
    const finalVal = (base * multiplier).toFixed(1);
    return `${finalVal}${suffix}`;
  };

  useEffect(() => { localStorage.setItem(syncKey, lastSync); }, [lastSync, syncKey]);
  useEffect(() => { localStorage.setItem(eventsKey, JSON.stringify(calendarEvents)); }, [calendarEvents, eventsKey]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => { 
      setLastSync(new Date().toLocaleTimeString()); 
      setIsSyncing(false); 
    }, 1200);
  };

  const members = WORKSPACE_MEMBERS[project.id] || [
    { name: 'Alex J.', role: 'Admin', avatar: 'AJ' },
    { name: 'Jordan K.', role: 'Member', avatar: 'JK' }
  ];

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${project.color}`}>{project.icon}</div>
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{project.name}</h2>
            <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> 
              Performance Hub • {project.id === 'proj-1' ? 'Sector Focus: Cybersecurity' : project.id === 'proj-2' ? 'Sector Focus: Healthcare' : 'Sector Focus: Retail'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Sync Status</p>
            <p className="text-xs font-mono font-bold text-slate-700">{lastSync === 'Never' ? 'Pending First Sync' : lastSync}</p>
          </div>
          <button 
            onClick={handleSync} 
            disabled={isSyncing} 
            className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2 ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
          >
            {isSyncing ? 'Syncing...' : 'Sync CRM Data'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_DATA_BASE.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} text-2xl`}>{kpi.icon}</div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${kpi.bg} ${kpi.color}`}>{kpi.trend}</span>
            </div>
            <div className="mt-5">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{kpi.title}</h4>
              <span className="text-3xl font-black text-slate-900">{getProjectValue(kpi.baseValue, kpi.suffix)}</span>
              <p className="text-[11px] font-medium text-slate-500 mt-1">{kpi.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-2 bg-indigo-500 h-full group-hover:w-3 transition-all"></div>
           <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="font-black text-xl text-slate-900 tracking-tight">
                 {showScoreChart && selectedLead ? `Lead Score Tracking: ${selectedLead.name}` : 'Agent Efficiency Over Time'}
               </h3>
               <p className="text-sm text-slate-500">
                 {showScoreChart && selectedLead 
                   ? `Current Score: ${selectedLead.score}/100 • ${selectedLead.company}` 
                   : 'Automated versus manual engagement metrics.'}
               </p>
             </div>
             <div className="flex items-center gap-4">
               {showScoreChart ? (
                 <>
                   <button 
                     onClick={() => setShowScoreChart(false)}
                     className="text-[10px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                   >
                     ← Back to Overview
                   </button>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Reality</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Expectation</span></div>
                 </>
               ) : (
                 <>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">AI Efficiency</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Engagement</span></div>
                 </>
               )}
             </div>
           </div>
           <div className="h-[300px] w-full">
             {showScoreChart && selectedLead ? (
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={scoreChartData}>
                   <defs>
                     <linearGradient id="colorReality" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                     dataKey="name" 
                     tick={{ fontSize: 11, fill: '#64748b' }}
                     stroke="#cbd5e1"
                   />
                   <YAxis 
                     domain={[0, 100]}
                     tick={{ fontSize: 11, fill: '#64748b' }}
                     stroke="#cbd5e1"
                     label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                   />
                   <Tooltip 
                     contentStyle={{ 
                       borderRadius: '16px', 
                       border: 'none', 
                       boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                       fontSize: '12px'
                     }}
                     formatter={(value: number, name: string) => [
                       `${value}/100`,
                       name === 'reality' ? 'Actual Score' : 'Projected Score'
                     ]}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="reality" 
                     stroke="#4f46e5" 
                     strokeWidth={4} 
                     fillOpacity={1} 
                     fill="url(#colorReality)"
                     dot={{ fill: '#4f46e5', r: 5 }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="expectation" 
                     stroke="#cbd5e1" 
                     strokeWidth={2} 
                     strokeDasharray="5 5"
                     dot={{ fill: '#94a3b8', r: 3 }}
                   />
                 </ComposedChart>
               </ResponsiveContainer>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                       <stop offsgradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-white/10 rounded-full blur-[60px] group-hover:bg-white/20 transition-colors"></div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-3">CRM Lead Scores</h3>
             <p className="text-lg font-black text-white leading-tight mb-4">Click to view score analytics</p>
             
             <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
               {leads.length > 0 ? leads.slice(0, 5).map((lead, i) => (
                 <button
                   key={lead.id}
                   onClick={() => handleLeadClick(lead)}
                   className="w-full p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all group/item text-left border border-white/20"
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex-1">
                       <p className="text-xs font-bold text-white">{lead.name}</p>
                       <p className="text-[10px] text-indigo-200">{lead.company}</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="text-2xl font-black text-white">{lead.score}</span>
                       <div className="flex flex-col items-end">
                         <span className="text-[8px] text-indigo-200 font-bold">SCORE</span>
                         {lead.scoreHistory && lead.scoreHistory.length > 1 && (
                           <span className={`text-[9px] font-bold ${
                             (lead.scoreHistory[lead.scoreHistory.length - 1]?.score || 0) > (lead.scoreHistory[lead.scoreHistory.length - 2]?.score || 0)
                               ? 'text-emerald-300'
                               : 'text-red-300'
                           }`}>
                             {(lead.scoreHistory[lead.scoreHistory.length - 1]?.score || 0) > (lead.scoreHistory[lead.scoreHistory.length - 2]?.score || 0) ? '▲' : '▼'}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                 </button>
               )) : (
                 <p className="text-xs text-indigo-200 italic py-4">No scored leads yet. Score leads in the Leads page.</p>
               )}
             </div>
             
             {leads.length > 5 && (
               <p className="text-[10px] text-indigo-200 mt-3 text-center">+ {leads.length - 5} more leads</p>
             )}
          </section>

          <section className="bg-et="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                       <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" hide />
                   <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                   />
                   <Area type="monotone" dataKey="efficiency" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                   <Area type="monotone" dataKey="engagement" stroke="#e2e8f0" strokeWidth={2} fill="transparent" />
                 </AreaChart>
               </ResponsiveContainer>
             )} top-0 left-0 w-2 bg-indigo-500 h-full group-hover:w-3 transition-all"></div>
           <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="font-black text-xl text-slate-900 tracking-tight">Agent Efficiency Over Time</h3>
               <p className="text-sm text-slate-500">Automated versus manual engagement metrics.</p>
             </div>
             <div className="flex gap-4">
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">AI Efficiency</span></div>
               <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Engagement</span></div>
             </div>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" hide />
                 <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                 />
                 <Area type="monotone" dataKey="efficiency" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                 <Area type="monotone" dataKey="engagement" stroke="#e2e8f0" strokeWidth={2} fill="transparent" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-lg text-slate-900 mb-6 flex items-center gap-3">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">👥</span> Workspace Team
            </h3>
            <div className="space-y-5">
              {members.map((m, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-xl group-hover:scale-110 transition-transform">
                      {m.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{m.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role}</p>
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 text-xs font-black text-indigo-600 border-2 border-indigo-50 rounded-2xl hover:bg-indigo-50 transition-all uppercase tracking-widest">
              Manage Access
            </button>
          </section>

          <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">📅</span>
              Upcoming meetings (Google Calendar demo)
            </h3>
            {calendarEvents.length === 0 && (
              <p className="text-[11px] text-slate-400 italic">No meetings yet for this workspace.</p>
            )}
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar mt-2">
              {calendarEvents.map((ev) => {
                const d = new Date(ev.start);
                return (
                  <div key={ev.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{ev.title}</p>
                      {ev.leadName && (
                        <p className="text-[10px] text-slate-500">With: {ev.leadName}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {d.toLocaleDateString()} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {ev.source === 'sample' ? 'Sample' : 'Auto'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-indigo-600/30 rounded-full blur-[60px] group-hover:bg-indigo-600/50 transition-colors"></div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Agent Status</h3>
             <p className="text-xl font-black text-white leading-tight">3 Dedicated Agents optimized for {project.name}.</p>
             <p className="text-slate-500 text-xs mt-3 leading-relaxed">System healthy. Currently processing ICP signals from local markets.</p>
             <div className="mt-6 flex gap-2">
               <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white uppercase border border-white/10 tracking-widest">Online</span>
               <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white uppercase border border-white/10 tracking-widest">Secure</span>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
