
import React, { useState, useEffect } from 'react';
import { Project } from '../App';

interface AgentTask {
  id: string;
  agentName: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  step: string;
  timestamp: string;
}

const AGENTS = [
  { id: 'ls', name: 'Lead Scorer Agent', role: 'ICP Audit', status: 'Online', load: '12%', latency: '0.8s', icon: '🔍' },
  { id: 'cg', name: 'Campaign Gen Agent', role: 'Outreach', status: 'Online', load: '35%', latency: '1.9s', icon: '✉️' },
  { id: 'kr', name: 'Knowledge RAG Agent', role: 'Intelligence', status: 'Online', load: '8%', latency: '1.2s', icon: '🧠' },
];

const AgentsPage: React.FC<{ project: Project }> = ({ project }) => {
  const tasksKey = `sully_agent_tasks_${project.id}`;
  const logsKey = `sully_agent_logs_${project.id}`;

  const [tasks, setTasks] = useState<AgentTask[]>(() => {
    const saved = localStorage.getItem(tasksKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<{time: string, agent: string, msg: string, type: 'info' | 'success' | 'warning' | 'error'}[]>(() => {
    const saved = localStorage.getItem(logsKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].name);
  const [taskDesc, setTaskDesc] = useState('');

  useEffect(() => { localStorage.setItem(tasksKey, JSON.stringify(tasks)); }, [tasks, tasksKey]);
  useEffect(() => { localStorage.setItem(logsKey, JSON.stringify(logs)); }, [logs, logsKey]);

  const assignTask = () => {
    if (!taskDesc.trim()) return;
    const newTask: AgentTask = { 
      id: Math.random().toString(36).substr(2, 9), 
      agentName: selectedAgent, 
      description: taskDesc, 
      status: 'pending', 
      progress: 0, 
      step: 'Initializing...',
      timestamp: new Date().toLocaleTimeString() 
    };
    setTasks([newTask, ...tasks]);
    setLogs([{ 
      time: new Date().toLocaleTimeString(), 
      agent: selectedAgent, 
      msg: `Task Assigned: ${taskDesc}`, 
      type: 'info' 
    }, ...logs]);
    setTaskDesc('');
  };

  useEffect(() => {
    const steps = ['Researching', 'Analyzing Signals', 'Synthesizing Response', 'Validating Outcome', 'Finalizing'];
    const interval = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === 'completed') return t;
        if (t.status === 'pending') return { ...t, status: 'running', progress: 5, step: steps[0] };
        
        const nextProgress = t.progress + Math.floor(Math.random() * 15);
        const stepIdx = Math.min(Math.floor((nextProgress / 100) * steps.length), steps.length - 1);
        
        if (nextProgress >= 100) {
          if (t.status !== 'completed') {
            setLogs(prevLogs => [{ 
              time: new Date().toLocaleTimeString(), 
              agent: t.agentName, 
              msg: `Completed: ${t.description}`, 
              type: 'success' 
            }, ...prevLogs]);
          }
          return { ...t, status: 'completed', progress: 100, step: 'Execution Finished' };
        }
        
        return { ...t, progress: nextProgress, step: steps[stepIdx] };
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const getAgentMetric = (agentName: string) => {
    const active = tasks.find(t => t.agentName === agentName && t.status === 'running');
    return active ? `${active.progress}%` : 'Idle';
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Agent Command Center</h2>
          <p className="text-slate-500 font-medium tracking-tight">Orchestrating GTM agents for <span className="text-indigo-600 font-bold">{project.name}</span> clients & startup deals.</p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            All Systems Nominal
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 ${agent.id === 'ls' ? 'bg-blue-50' : agent.id === 'cg' ? 'bg-indigo-50' : 'bg-emerald-50'} -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-150`}></div>
            <div className="relative z-10">
              <div className="text-3xl mb-4">{agent.icon}</div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{agent.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{agent.role}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Load</p>
                  <p className="text-xs font-bold text-slate-700">{agent.load}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Latency</p>
                  <p className="text-xs font-bold text-slate-700">{agent.latency}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{getAgentMetric(agent.name)}</span>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${agent.id === 'ls' ? 'bg-blue-500' : agent.id === 'cg' ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                        style={{ width: getAgentMetric(agent.name) === 'Idle' ? '0%' : getAgentMetric(agent.name) }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase flex items-center gap-2"><span>⚡</span> Task Dispatcher</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-shrink-0">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign To</label>
                <select 
                  value={selectedAgent} 
                  onChange={(e) => setSelectedAgent(e.target.value)} 
                  className="w-full md:w-48 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {AGENTS.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Task Description</label>
                <input 
                  type="text" 
                  value={taskDesc} 
                  onChange={(e) => setTaskDesc(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && assignTask()}
                  placeholder="e.g. Analyze top 10 leads for security signals..." 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={assignTask} 
                  className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  Dispatch
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Task Queue</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{tasks.length} Total</span>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {tasks.length === 0 && (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                  <span className="text-4xl mb-4">💤</span>
                  <p className="italic text-sm">No workspace-specific tasks assigned.</p>
                </div>
              )}
              {tasks.map(t => (
                <div key={t.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1 block">{t.agentName}</span>
                      <h5 className="text-sm font-black text-slate-800 tracking-tight">{t.description}</h5>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span> {t.step}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700 animate-pulse'}`}>
                        {t.status}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{t.timestamp}</span>
                    </div>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold inline-block text-indigo-600 uppercase">Progress</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold inline-block text-indigo-600">{t.progress}%</span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-slate-200">
                      <div 
                        style={{ width: `${t.progress}%` }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ${t.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden flex flex-col h-full">
             <div className="p-6 bg-slate-800/50 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Real-time Agent Logs</h3>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 delay-150"></div>
                </div>
             </div>
             <div className="p-6 font-mono text-[10px] space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar flex-1">
                {logs.length === 0 && <p className="opacity-30 italic text-slate-400 text-center py-10">No logs for this project yet.</p>}
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-3 leading-relaxed animate-fadeIn">
                    <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
                    <div>
                      <span className={`font-black uppercase tracking-tighter ${
                        log.type === 'info' ? 'text-indigo-400' : 
                        log.type === 'success' ? 'text-emerald-400' : 
                        'text-amber-400'
                      }`}>{log.agent}:</span>
                      <span className="text-slate-300 ml-2">{log.msg}</span>
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-4 bg-black/20 text-center border-t border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Encrypted Workspace Stream</p>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
