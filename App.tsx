
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/Leads';
import CampaignsPage from './pages/Campaigns';
import KnowledgePage from './pages/Knowledge';
import AgentsPage from './pages/Agents';

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'AP Cybersecurity', icon: '🛡️', color: 'bg-blue-500' },
  { id: 'proj-2', name: 'Karnataka Health', icon: '🏥', color: 'bg-emerald-500' },
  { id: 'proj-3', name: 'Retail Growth', icon: '🛍️', color: 'bg-amber-500' },
];

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl animate-fadeIn relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-3xl text-white font-bold">S</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Sully.AI</h1>
          <p className="text-slate-400 mt-2 text-sm">Agentic Marketing Automation Hub</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-100 transition shadow-xl active:scale-95 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-8 leading-relaxed uppercase tracking-tighter">
          By continuing, you agree to Sully.AI's <br/>
          <span className="text-indigo-400 font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-indigo-400 font-bold hover:underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

const Sidebar = ({ 
  projects, 
  activeProject, 
  onProjectChange, 
  onAddProject, 
  onRemoveProject, 
  onLogout 
}: { 
  projects: Project[],
  activeProject: Project, 
  onProjectChange: (p: Project) => void,
  onAddProject: () => void,
  onRemoveProject: (id: string) => void,
  onLogout: () => void
}) => {
  const location = useLocation();
  const [showProjects, setShowProjects] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Leads', path: '/leads', icon: '👥' },
    { name: 'Campaigns', path: '/campaigns', icon: '✉️' },
    { name: 'Knowledge', path: '/knowledge', icon: '💡' },
    { name: 'Agents', path: '/agents', icon: '⚡' },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col fixed left-0 top-0 text-white shadow-xl z-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
          <span>Sully.AI</span>
          <span className="text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-tighter">Pro</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Agentic Marketing Automation</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              location.pathname === item.path
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="relative">
          {showProjects && (
            <div className="absolute bottom-full left-0 w-full bg-slate-800 border border-slate-700 rounded-xl mb-2 p-2 shadow-2xl animate-fadeIn">
              <div className="flex justify-between items-center px-2 py-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Switch Workspace</p>
                <button onClick={onAddProject} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase">+ New</button>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar mt-1 space-y-1">
                {projects.map((proj) => (
                  <div key={proj.id} className="group flex items-center gap-1">
                    <button
                      onClick={() => { onProjectChange(proj); setShowProjects(false); }}
                      className={`flex-1 flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                        activeProject.id === proj.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${proj.color}`}></span>
                      <span className="flex-1 text-left font-medium line-clamp-1">{proj.name}</span>
                      <span>{proj.icon}</span>
                    </button>
                    {projects.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); onRemoveProject(proj.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-500 transition-all">🗑️</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={() => setShowProjects(!showProjects)} className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 group">
            <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-inner ${activeProject.color} group-hover:scale-110 transition-transform`}>{activeProject.icon}</div>
               <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase leading-none">Workspace</p>
                  <p className="text-xs font-bold text-white mt-1 line-clamp-1">{activeProject.name}</p>
               </div>
            </div>
            <span className="text-slate-500">↕️</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-slate-800">JD</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">John Doe</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Admin Account</span>
            </div>
          </div>
          <button onClick={onLogout} className="text-slate-500 hover:text-white p-1">🚪</button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sully_auth') === 'true');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('sully_projects_list');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [activeProject, setActiveProject] = useState<Project>(() => {
    const saved = localStorage.getItem('sully_active_project');
    const parsed = saved ? JSON.parse(saved) : projects[0];
    return projects.find(p => p.id === parsed.id) || projects[0];
  });

  useEffect(() => localStorage.setItem('sully_projects_list', JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem('sully_active_project', JSON.stringify(activeProject)), [activeProject]);

  const handleLogin = () => { setIsLoggedIn(true); localStorage.setItem('sully_auth', 'true'); };
  const handleLogout = () => { setIsLoggedIn(false); localStorage.removeItem('sully_auth'); };

  const handleAddProject = () => {
    const name = window.prompt("Enter workspace name:");
    if (!name?.trim()) return;
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
    const icons = ['🛡️', '🏥', '🛍️', '💰', '🚀'];
    const newProject: Project = { id: `proj-${Date.now()}`, name: name.trim(), icon: icons[Math.floor(Math.random() * icons.length)], color: colors[Math.floor(Math.random() * colors.length)] };
    setProjects([...projects, newProject]);
    setActiveProject(newProject);
  };

  const handleRemoveProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj && window.confirm(`Permanently remove workspace "${proj.name}"?`)) {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      if (activeProject.id === id) setActiveProject(updated[0]);
    }
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <HashRouter>
      <div className="flex min-h-screen">
        <Sidebar projects={projects} activeProject={activeProject} onProjectChange={setActiveProject} onAddProject={handleAddProject} onRemoveProject={handleRemoveProject} onLogout={handleLogout} />
        <main className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard key={activeProject.id} project={activeProject} />} />
            <Route path="/leads" element={<LeadsPage key={activeProject.id} project={activeProject} />} />
            <Route path="/campaigns" element={<CampaignsPage key={activeProject.id} project={activeProject} />} />
            <Route path="/knowledge" element={<KnowledgePage key={activeProject.id} project={activeProject} />} />
            <Route path="/agents" element={<AgentsPage key={activeProject.id} project={activeProject} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
