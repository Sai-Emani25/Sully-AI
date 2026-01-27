
import React, { useState, useRef, useEffect } from 'react';
import { Lead, Asset, CSVRow } from '../types';
import { MOCK_LEADS } from '../constants';
import { campaignGeneratorAgent, leadResponseAnalystAgent } from '../geminiService';
import { Project } from '../App';

interface CampaignsPageProps {
  project: Project;
}

const CampaignsPage: React.FC<CampaignsPageProps> = ({ project }) => {
  const sharedStrategyKey = `sully_shared_strategy_${project.id}`;
  const visionKey = `sully_vision_${project.id}`;
  const inboxKey = `sully_inbox_${project.id}`;
  const taskKey = `sully_task_desc_${project.id}`;

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
        const content = await campaignGeneratorAgent({ name: updated[i].name, email: updated[i].email, sharedStrategy: sharedStrategy || undefined }, taskDescription, assets);
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Operations</h2>
          <p className="text-slate-500 tracking-tight">Isolated Workspace: <span className="text-indigo-600 font-bold">{project.name}</span></p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Workspace Inbox</h3>
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[400px]">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h3 className="font-bold text-slate-800 tracking-tight">Campaign Queue</h3>
                <span className="text-xs font-medium text-slate-400">{batchLeads.length} items</span>
             </div>
             <div className="p-4 overflow-y-auto space-y-2 max-h-[600px]">
                {batchLeads.length === 0 && <div className="text-center py-20 text-slate-300 italic text-sm">Upload a CSV to generate workspace-specific content.</div>}
                {batchLeads.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${l.status === 'completed' ? 'bg-green-500 shadow-lg shadow-green-100' : l.status === 'processing' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <div><p className="text-xs font-bold text-slate-800">{l.name}</p><p className="text-[10px] text-slate-400">{l.email}</p></div>
                    </div>
                    {l.result && <button onClick={() => setPreviewContent(l.result!)} className="text-[10px] font-bold text-indigo-600 uppercase underline decoration-2 underline-offset-4 hover:text-indigo-800 transition-colors">View Draft</button>}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
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
