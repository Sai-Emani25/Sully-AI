export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: 'retail' | 'healthcare' | 'finance' | 'manufacturing' | 'tech';
  location: string;
  title: string;
  score?: number;
  scoreHistory?: { date: string, score: number }[];
  status: 'new' | 'scored' | 'nurturing' | 'opportunity' | 'closed';
  lastActivity: string;
  lastContacted?: string;
  icpReasoning?: string;
  lastResponse?: string;
  alignmentScore?: number; // How well the lead's reply aligns with client goals
  skills?: string;
  assignedAction?: string;
  scoreSources?: { title: string, uri: string }[];
  scoreBreakdown?: {
    industry: number;
    location: number;
    authority: number;
    vision: number;
  };
}

export interface Asset {
  name: string;
  data: string; // base64
  mimeType: string;
}

export interface CSVRow {
  name: string;
  email: string;
  message?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
}

export interface StrategyInsight {
  id: string;
  title: string;
  content: string;
  timestamp: string;
}