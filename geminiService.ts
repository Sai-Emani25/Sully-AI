
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Asset } from "./types";
import { ICP_DEFINITION } from "./constants";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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
export const leadScorerAgent = async (lead: Lead, dynamicICP: string, startupMode: boolean = false) => {
  const modeContext = startupMode 
    ? `STARTUP MODE ACTIVE: Focus on growth potential, founder quality, innovative mindset, early adopter profile, and willingness to experiment. De-prioritize budget size and established processes. Look for scrappy, fast-moving teams.`
    : `CLIENT MODE: Focus on established authority, budget availability, proven track record, and traditional B2B fit criteria.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as Sully.AI's Chief Intelligence Agent. 
    Evaluate this prospect's fit against our DYNAMIC STRATEGY.
    
    ${modeContext}
    
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
    3. SCORING: Provide 0-100 scores for:
       ${startupMode 
         ? 'Growth Potential (instead of Industry), Market Timing (instead of Location), Founder Quality (instead of Authority), Innovation Mindset (instead of Vision)'
         : 'Industry, Location, Authority, and Vision'
       }
    
    --- RESPONSE FORMAT ---
    SCORE: [Final Score]
    BREAKDOWN: [${startupMode ? 'GROWTH:XX, TIMING:XX, FOUNDER:XX, INNOVATION:XX' : 'INDUSTRY:XX, LOCATION:XX, AUTHORITY:XX, VISION:XX'}]
    REASONING: [Explain how the specific 'Dynamic Strategy' points were or weren't met based on your findings and their response. ${startupMode ? 'Focus on startup potential signals like funding, team pedigree, market opportunity.' : 'Focus on traditional B2B signals.'} Max 50 words.]`,
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
 * Email Performance Analyzer - Updates lead score based on email response quality.
 * Analyzes engagement, intent, and business fit from automated campaign responses.
 */
export const analyzeEmailPerformance = async (emailResponse: string, leadName: string, leadCompany: string, currentScore: number, clientVision: string, startupMode: boolean = false) => {
  const modeInstructions = startupMode
    ? `STARTUP MODE: Prioritize signals of innovation, speed of response, founder involvement, willingness to try new things, and growth mindset. Look for phrases indicating agility, experimentation, and forward-thinking.`
    : `CLIENT MODE: Prioritize traditional B2B signals like budget authority, established processes, formal timelines, and decision-making hierarchy.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are analyzing an email response from a lead to determine their engagement quality and update their lead score.
    
    ${modeInstructions}
    
    Lead: ${leadName} from ${leadCompany}
    Current Score: ${currentScore}
    Email Response: "${emailResponse}"
    Client Vision: "${clientVision}"
    
    Analyze the email response for:
    ${startupMode 
      ? `1. Innovation Signals (Mentions of experimentation, new approaches, growth hacking)
    2. Founder Engagement (Personal involvement, quick decision-making, hands-on approach)
    3. Growth Mindset (Scalability mentions, rapid expansion plans, ambitious goals)
    4. Speed & Agility (Fast response time, urgency, willingness to move quickly)`
      : `1. Engagement Level (Positive questions, specific requests, timeline mentions = high engagement)
    2. Purchase Intent (Budget mentions, timeline, comparison shopping = high intent)
    3. Business Fit (Mentions needs that align with our solution)
    4. Response Quality (Detailed vs generic, professional tone)`
    }
    
    Provide:
    - newScore: Adjusted score (0-100). ${startupMode 
      ? 'Add 15-30 points for high startup potential signals, 8-20 for medium, 0-10 for low.'
      : 'Add 10-25 points for high engagement, 5-15 for medium, 0-5 for low.'
    }
    - engagementLevel: "high", "medium", or "low"
    - performanceReport: Brief 2-3 sentence analysis of what this response indicates about lead quality
    - keyIndicators: Array of specific phrases/signals that influenced the score (max 3)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          newScore: { type: Type.NUMBER },
          engagementLevel: { type: Type.STRING },
          performanceReport: { type: Type.STRING },
          keyIndicators: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["newScore", "engagementLevel", "performanceReport", "keyIndicators"]
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
  assets: Asset[] = [],
  startupMode: boolean = false
): Promise<string> => {
  const toneGuidance = startupMode
    ? `Tone: Conversational, founder-to-founder, innovative, and action-oriented. Use phrases like "let's experiment", "rapid growth", "game-changing", "move fast". Keep it casual but ambitious. Appeal to their entrepreneurial spirit.`
    : `Tone: Professional B2B, authoritative, data-driven. Use phrases like "proven ROI", "enterprise-grade", "streamlined processes". Appeal to their need for reliability and established solutions.`;

  const parts: any[] = [
    {
      text: `Compose a high-conversion ${startupMode ? 'founder' : 'B2B'} outreach email for ${lead.name} at ${lead.company}.
      
      Objective: ${taskDescription}
      Strategic Reference: ${lead.sharedStrategy || (startupMode ? 'Help startups scale rapidly with innovative solutions.' : 'Standard product-led growth.')}
      
      ${toneGuidance}
      
      Requirements: 
      - Mention the prospect's industry signals.
      - Keep it under 150 words.
      - ${startupMode ? 'Include a bold call-to-action that suggests experimentation or a pilot program.' : 'Include a clear next step (demo, call, meeting).'}
      - ${startupMode ? 'Reference growth potential and agility benefits.' : 'Reference proven results and enterprise reliability.'}`
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
export const knowledgeAgentRAG = async (query: string, clientVision: string, startupMode: boolean = false) => {
  const roleDefinition = startupMode
    ? `You are a BUSINESS PARTNER and co-founder advisor. Your job is to CHALLENGE assumptions, push for scalability, and suggest bold improvements. Be direct, ask hard questions, and propose alternative approaches. Think like a startup advisor who's seen 100 companies scale. Don't just validate - push them to think bigger and move faster.`
    : `You are a CLIENT INTERPRETER and idea preserver. Your job is to UNDERSTAND their vision, BUILD ON their existing ideas, and help them execute what they already want to do. Be supportive, validate their direction, and provide structured frameworks to implement their concepts. Think like a trusted consultant who helps refine and execute.`;

  const responseStyle = startupMode
    ? `Style: Direct and challenging. Use phrases like \"Hold on\", \"Let's challenge this\", \"What if instead...\", \"Here's a better play\". Include hard questions (🔍), alternative angles (💡), and scaling strategies (🚀). Push them out of comfort zone.`
    : `Style: Supportive and structured. Use phrases like \"That's a solid direction\", \"I'd recommend\", \"This aligns well with\". Include checkmarks (✓), clear frameworks, and step-by-step guidance. Build confidence in their direction.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `${roleDefinition}
    
    Workspace Vision: "${clientVision}"
    
    Query: "${query}"
    
    ${responseStyle}
    
    ${startupMode 
      ? `Provide advice that:
- Questions the premise and offers alternatives
- Focuses on 10x thinking and rapid scaling
- Highlights risks they might be missing
- Suggests unconventional approaches
- Ends with a provocative question or next-level challenge`
      : `Provide advice that:
- Validates and builds on their existing direction
- Offers proven frameworks and best practices
- Provides clear, actionable next steps
- Reinforces their strategic vision
- Ends with an offer to help with specific implementation`
    }
    
    Use Google Search for current data if relevant. Keep response concise but impactful (150-250 words).`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web) || []
  };
};
