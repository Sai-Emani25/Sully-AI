
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Asset } from "./types";
import { ICP_DEFINITION } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Stage 1: Strategy Synthesizer.
 * Condenses Master Vision and Chat History into a set of explicit, 
 * weighted ICP criteria for the current workspace.
 */
export const synthesizeDynamicICP = async (vision: string, chatHistory: any[]) => {
  const historyText = chatHistory
    .slice(-5)
    .map((m: any) => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are the Sully.AI Strategy Brain. 
    Analyze the current Master Vision and recent strategic discussions to extract the *current* ICP requirements.
    
    --- MASTER VISION ---
    "${vision}"
    
    --- RECENT STRATEGY CHAT ---
    ${historyText || 'No recent pivots.'}
    
    --- BASELINE ICP ---
    "${ICP_DEFINITION}"
    
    Task: Output a concise, bulleted list of 3-5 specific "Fit Triggers" we are looking for right now. 
    Focus on nuances discussed in the chat that deviate or refine the baseline ICP.`,
  });

  return response.text || "Standard B2B high-growth alignment.";
};

/**
 * Stage 2: Advanced Market Intelligence Agent.
 * Performs deep research and evaluates fit against the Synthesized Dynamic ICP.
 */
export const leadScorerAgent = async (lead: Lead, dynamicICP: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as Sully.AI's Chief Intelligence Agent. 
    Evaluate this prospect's fit against our DYNAMIC STRATEGY.
    
    --- PROSPECT PROFILE ---
    Lead: ${lead.name} (${lead.title})
    Company: ${lead.company}
    Industry: ${lead.industry}
    Location: ${lead.location}
    Last Response from Prospect: "${lead.lastResponse || 'No response recorded yet.'}"
    
    --- DYNAMIC STRATEGY (CURRENT ICP) ---
    "${dynamicICP}"
    
    --- AGENTIC TASKS ---
    1. RESEARCH: Use Google Search to find recent (last 6 months) news for "${lead.company}". 
    2. ALIGNMENT: Grade the lead strictly against the DYNAMIC STRATEGY provided.
    3. SCORING: Provide 0-100 scores for Industry, Location, Authority, and Vision.
    
    --- RESPONSE FORMAT ---
    SCORE: [Final Score]
    BREAKDOWN: [INDUSTRY:XX, LOCATION:XX, AUTHORITY:XX, VISION:XX]
    REASONING: [Explain how the specific 'Dynamic Strategy' points were or weren't met based on your findings and their response. Max 50 words.]`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean) || [];
  
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const breakdownMatch = text.match(/BREAKDOWN:\s*\[INDUSTRY:(\d+),\s*LOCATION:(\d+),\s*AUTHORITY:(\d+),\s*VISION:(\d+)\]/i);
  const reasoningMatch = text.match(/REASONING:\s*([\s\S]+)/i);
  
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : "Dynamic analysis completed.";
  
  const breakdown = breakdownMatch ? {
    industry: parseInt(breakdownMatch[1]),
    location: parseInt(breakdownMatch[2]),
    authority: parseInt(breakdownMatch[3]),
    vision: parseInt(breakdownMatch[4])
  } : { industry: score, location: score, authority: score, vision: score };

  return {
    score,
    reasoning,
    breakdown,
    sources: sources.map((s: any) => ({ title: s.title, uri: s.uri }))
  };
};

/**
 * Analyzes lead replies and scores alignment with client vision.
 */
export const leadResponseAnalystAgent = async (lead: Lead, responseText: string, clientVision: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this lead's direct response to our campaign.
    
    Lead: ${lead.name} from ${lead.company}
    Response: "${responseText}"
    Workspace Strategy: "${clientVision}"
    
    Tasks:
    1. Identify intent (High/Med/Low).
    2. Extract specific technical or business needs.
    3. Suggest a strategic pivot if necessary.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extractedNeeds: { type: Type.STRING },
          alignmentScore: { type: Type.NUMBER },
          strategicShift: { type: Type.STRING }
        },
        required: ["extractedNeeds", "alignmentScore", "strategicShift"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

/**
 * Personalized Campaign Content Generator.
 */
export const campaignGeneratorAgent = async (
  lead: Partial<Lead> & { message?: string, sharedStrategy?: string }, 
  taskDescription: string,
  assets: Asset[] = []
): Promise<string> => {
  const parts: any[] = [
    {
      text: `Compose a high-conversion B2B outreach email for ${lead.name} at ${lead.company}.
      
      Objective: ${taskDescription}
      Strategic Reference: ${lead.sharedStrategy || 'Standard product-led growth.'}
      
      Requirements: 
      - Mention the prospect's industry signals.
      - Keep it under 150 words.
      - Professional yet agentic tone.`
    }
  ];

  assets.forEach(asset => {
    parts.push({
      inlineData: {
        data: asset.data.split(',')[1],
        mimeType: asset.mimeType
      }
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts }
  });
  
  return response.text || '';
};

/**
 * Strategy Consultant RAG Agent.
 */
export const knowledgeAgentRAG = async (query: string, clientVision: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Context: You are the Sully.AI Chief Strategy Officer. 
    Current Workspace Vision: "${clientVision}"
    
    User Query: "${query}"
    
    Provide actionable, research-backed advice. Use Google Search to find current market trends if necessary.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web) || []
  };
};
