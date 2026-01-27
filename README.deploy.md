
# Sully.AI Deployment Guide

## 1. Frontend (Vercel)
The current implementation is a high-fidelity React SPA that simulates the agentic backend using Gemini API directly for demonstration purposes.

To deploy on Vercel:
```bash
npm install
npm run build
vercel --prod
```

## 2. Backend (AWS Lambda + Python)
For a true multi-agent system as specified in the RGES requirements, deploy the backend agents using the Serverless Framework.

**Tech Stack:** LangChain, CrewAI, Pinecone (Vector DB), FastAPI.

### Infrastructure setup:
```bash
# Install serverless
npm install -g serverless

# Deploy to Mumbai region
sls deploy --region ap-south-1 --stage prod
```

### Mock Lead Scorer Agent (Python snippet):
```python
from crewai import Agent, Task, Crew
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

lead_scorer = Agent(
    role='ICP Lead Scorer',
    goal='Assess B2B leads for Indian market fit (Andhra Pradesh/Cybersec)',
    backstory='Ex-CMO of a top Indian cybersecurity firm with 20 years experience.',
    llm=llm
)

# Example CRM sync logic (Salesforce)
def sync_crm(lead_id, score):
    # logic to call simple-salesforce or zoho API
    pass
```

## 3. Environment Variables
Ensure the following are set in Vercel/AWS:
- `API_KEY`: Google Gemini API Key
- `SALESFORCE_CREDENTIALS`: JSON for CRM access
- `PINECONE_API_KEY`: For Knowledge RAG Vector DB
