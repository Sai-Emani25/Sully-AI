import React from 'react';
import { Lead } from './types';

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Ramesh Babu',
    email: 'ramesh.b@apretail.co.in',
    company: 'AP Retail Corp',
    industry: 'retail',
    location: 'Vijayawada, Andhra Pradesh',
    title: 'IT Director',
    status: 'new',
    lastActivity: '2024-05-20T10:30:00Z',
    lastContacted: '2024-05-15',
    lastResponse: 'Looking for a solution that handles multi-store inventory sync.',
    score: 45,
    scoreHistory: [
      { date: new Date(Date.now() - 8 * 86400000).toISOString(), score: 40 },
      { date: new Date(Date.now() - 4 * 86400000).toISOString(), score: 42 },
      { date: new Date().toISOString(), score: 45 }
    ]
  },
  {
    id: '2',
    name: 'Anjali Sharma',
    email: 'anjali@healthpoint.in',
    company: 'HealthPoint India',
    industry: 'healthcare',
    location: 'Hyderabad, Telangana',
    title: 'Chief Information Security Officer',
    status: 'new',
    lastActivity: '2024-05-21T09:15:00Z',
    lastContacted: '2024-05-20',
    lastResponse: 'Our current priority is HIPAA compliance auditing.',
    score: 72,
    scoreHistory: [
      { date: new Date(Date.now() - 10 * 86400000).toISOString(), score: 85 },
      { date: new Date(Date.now() - 3 * 86400000).toISOString(), score: 75 },
      { date: new Date().toISOString(), score: 72 }
    ]
  },
  {
    id: '3',
    name: 'Vikram Singh',
    email: 'v.singh@indbank.com',
    company: 'Industrial Bank of Mumbai',
    industry: 'finance',
    location: 'Mumbai, Maharashtra',
    title: 'VP Operations',
    status: 'scored',
    score: 88,
    icpReasoning: 'High fit for cybersecurity services in BFS sector.',
    lastActivity: '2024-05-18T14:45:00Z',
    lastContacted: '2024-05-10',
    lastResponse: 'Can you provide a technical whitepaper on your encryption standards?',
    scoreHistory: [
      { date: new Date(Date.now() - 15 * 86400000).toISOString(), score: 80 },
      { date: new Date(Date.now() - 7 * 86400000).toISOString(), score: 82 },
      { date: new Date().toISOString(), score: 88 }
    ]
  }
];

export const ICP_DEFINITION = `
Target ICP: Mid-to-large B2B firms in India, specifically Cybersecurity, Healthcare, and Retail. 
Focus regions: Andhra Pradesh, Telangana, Maharashtra. 
Job titles: IT Director, CISO, VP Operations, Marketing Head.
Pain points: Fragmented workflows, manual lead nurturing, siloed CRM data.
`;