<div align="center">
   <h1><strong>Sully.AI — Agentic Marketing Automation Hub</strong></h1>
   <p>High‑fidelity React demo of a multi‑agent B2B marketing platform powered by Google Gemini.</p>
</div>

---

## Overview

Sully.AI is a single‑page React application that showcases an **agentic marketing automation workspace** for B2B teams in India.

Each workspace (project) has its own:
- **Dashboard** with synthetic KPIs and CRM sync simulation
- **Lead Command Center** with AI‑driven ICP scoring per lead
- **Campaign Operations** for batch email generation and response analysis
- **Strategic Brain (Knowledge)** with a RAG‑style strategy consultant
- **Agent Command Center** to orchestrate and monitor background agents

All AI behavior is powered directly from the browser using **Google Gemini** (via `@google/genai`).

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **Charts & UI:** Recharts + custom Tailwind‑style utility classes
- **AI:** `@google/genai` (Gemini 3 Flash / Pro models, tools, schemas)
- **State & Storage:** Local component state + `localStorage` for per‑workspace isolation

---

## Features (By Screen)

### 1. Dashboard

Source: `pages/Dashboard.tsx`

- Workspace‑specific KPIs (conversion uplift, manual hour savings, CRM sync latency, personalization score)
- Synthetic **Agent Efficiency Over Time** chart using Recharts
- "Sync CRM Data" button simulating a CRM sync with last‑sync timestamp
- Team panel listing workspace members
- Agent status card summarizing health for the three core agents

### 2. Lead Command Center

Source: `pages/Leads.tsx`, `constants.tsx`, `types.ts`

- Uses `MOCK_LEADS` and an `ICP_DEFINITION` tuned to Indian B2B markets
- Per‑workspace lead list stored in `localStorage` (`sully_leads_data_<projectId>`)
- Inline‑editable lead fields (name, title, company, industry, etc.)
- **AI lead scoring pipeline**:
   - `synthesizeDynamicICP` in `geminiService.ts` condenses the workspace vision + recent strategy chat into a dynamic ICP
   - `leadScorerAgent` calls Gemini with Google Search tools enabled and parses:
      - Final score (0–100)
      - Score breakdown (industry, location, authority, vision)
      - Reasoning + grounded web sources
   - Score history and 7‑day trend visualization per lead

### 3. Campaign Operations

Source: `pages/Campaigns.tsx`, `geminiService.ts`

- Workspace inbox with demo inbound messages per project
- Task configuration area to define a campaign objective
- **CSV upload** to import a batch of prospects (name + email) into a queue
- **Asset upload** (images as base64) to condition email generation
- `campaignGeneratorAgent` builds short, personalized outreach emails using Gemini
- `leadResponseAnalystAgent` analyzes replies vs. workspace vision and returns:
   - Extracted needs
   - Alignment score
   - Suggested strategic shift

### 4. Strategic Brain (Knowledge)

Source: `pages/Knowledge.tsx`, `geminiService.ts`

- "Master Vision" text area persisted per workspace
- Chat interface with a **strategy/RAG agent** (`knowledgeAgentRAG`)
   - Uses Gemini Pro with Google Search tools
   - Answers are stored as a conversation log in `localStorage`
- Ability to **share answers to Campaigns** as a shared strategy
- One‑click **Export Strategy** to a print‑ready HTML report (for PDF export)

### 5. Agent Command Center

Source: `pages/Agents.tsx`

- Three conceptual agents:
   - Lead Scorer Agent (ICP Audit)
   - Campaign Gen Agent (Outreach)
   - Knowledge RAG Agent (Intelligence)
- Task Dispatcher to assign natural‑language tasks to any agent
- Animated progress simulation (status, step, and progress %)
- Real‑time **agent logs** persisted per workspace

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- A **Google Gemini API key**

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

The app expects a Gemini key exposed to Vite as `GEMINI_API_KEY`. Vite then injects it as `process.env.API_KEY` inside the browser bundle (see `vite.config.ts` and `geminiService.ts`).

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

> Never commit real API keys to source control.

### 3. Run the dev server

```bash
npm run dev
```

Then open the URL printed by Vite (by default `http://localhost:3000`).

Log in with the mock "Sign in with Google" button and explore the sidebar sections.

---

## Building & Deployment

### Vite Build

```bash
npm run build
```

This outputs a static bundle to `dist/`.

### GitHub Pages

This project ships with a simple GitHub Pages flow (using `gh-pages`):

- `vite.config.ts` sets `base: './'` for static hosting
- `package.json` scripts include:

```jsonc
"deploy": "npm run build && gh-pages -d dist"
```

Deploy steps:

1. Push this repo to GitHub
2. Run:
    ```bash
    npm run deploy
    ```
3. In your GitHub repo → Settings → Pages, configure the **gh-pages** branch as the source

---

## Notes & Limitations

- This is a **frontend‑only demo**; there is no real CRM or email provider integration.
- AI calls run entirely in the browser using your Gemini key; treat it as a prototype, not production‑grade security.
- Workspace isolation (per project) is simulated using `localStorage` keys scoped by `project.id`.

For a production‑grade multi‑agent backend (CrewAI, LangChain, vector DB, etc.), see the separate guidance in `README.deploy.md`.
