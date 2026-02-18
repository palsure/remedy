# Remedy — AI Health Research Agent

**Research medication interactions, supplement evidence, and wellness claims with AI-powered, citation-backed analysis.**

Remedy is an AI health research agent that helps people make informed health decisions. It uses You.com's Search, Contents, and Advanced Agents APIs to plan multi-step research workflows, search live medical data, extract content from authoritative sources, and deliver structured, evidence-based reports — all while making its reasoning process visible in real-time.

## The Problem

People make health decisions based on bad information every day:

- 70% of Americans take supplements, most without checking interactions with their medications
- Drug interactions cause ~125,000 deaths per year in the US alone
- Wellness misinformation spreads faster than evidence-based research
- Doctors have 15-minute appointments — not enough time for thorough Q&A

## What Remedy Does

Remedy is an AI agent that researches health questions the way a pharmacist or medical researcher would:

1. **Plans** what to research based on your question
2. **Searches** live medical sources using You.com Search API
3. **Reads** full articles from authoritative sources (NIH, Mayo Clinic, PubMed) using Contents API
4. **Reasons** through the evidence using the Advanced Agents API with research + compute tools
5. **Delivers** a structured report with safety ratings, evidence assessments, and full citations

Every step is visible in real-time so you can watch the agent think.

### Core Use Cases

| Mode | Description | Example |
|------|-------------|---------|
| **Interaction Checker** | Check medication & supplement interactions | "Is it safe to take magnesium with lisinopril?" |
| **Supplement Research** | Evidence-based supplement analysis | "Does ashwagandha actually reduce cortisol?" |
| **Wellness Claims** | Fact-check health trends & claims | "Is intermittent fasting safe for women?" |
| **Health Q&A** | Research any health question | "What are the benefits of omega-3 fatty acids?" |

## You.com API Integration

Remedy combines **all three** You.com public APIs:

- **Search API** (`GET /v1/search`) — Finds medical evidence with targeted queries, freshness filters, and livecrawl for enriched results
- **Contents API** (`POST /v1/contents`) — Extracts clean markdown from authoritative medical URLs for deep analysis
- **Advanced Agents API** (`POST /v1/agents/runs`) — Powers the reasoning engine with `research` + `compute` tools and multi-step workflows

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Agent UI**: Framer Motion animations, Server-Sent Events streaming
- **Markdown**: react-markdown + remark-gfm for rich report rendering
- **Icons**: Lucide React
- **Deployment**: Docker (multi-stage build, node:20-alpine)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- A You.com API key ([get one free](https://you.com/platform))

### Run with Docker

```bash
# Clone the repository
git clone <repo-url>
cd remedy

# Set your API key
cp .env.example .env
# Edit .env and add your YOU_API_KEY

# Build and run
docker compose up --build -d

# Open http://localhost:3000
```

### Run Locally (Development)

```bash
# Install dependencies
npm install

# Set your API key
cp .env.example .env
# Edit .env and add your YOU_API_KEY

# Start dev server
npm run dev

# Open http://localhost:3000
```

## Architecture

```
remedy/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with branding
│   │   ├── page.tsx                # Home page (chat interface)
│   │   ├── globals.css             # Medical teal/blue theme
│   │   └── api/research/
│   │       └── route.ts            # SSE streaming endpoint
│   ├── lib/
│   │   ├── you-client.ts           # You.com API wrappers (Search, Contents, Agents)
│   │   ├── agent.ts                # Health research agent orchestrator
│   │   ├── prompts.ts              # Medical-focused agent prompts
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── utils.ts                # Helpers (SSE encoding, parsing)
│   └── components/
│       ├── ChatInterface.tsx        # Main chat with SSE streaming
│       ├── MessageBubble.tsx        # Message rendering with markdown
│       ├── AgentStep.tsx            # Animated agent step card
│       ├── AgentTimeline.tsx        # Step-by-step timeline
│       ├── SafetyRating.tsx         # Color-coded safety badge
│       ├── EvidenceLevel.tsx        # Evidence quality indicator
│       ├── SourceCard.tsx           # Citation card with link
│       ├── ResearchModeCards.tsx    # Welcome screen mode cards
│       └── ...                     # Header, Disclaimer, etc.
├── Dockerfile                       # Multi-stage production build
├── docker-compose.yml               # Single-command deployment
└── .env.example                     # API key template
```

### Agent Flow

```
User Question
     │
     ▼
 ┌─ PLAN ──────────────────────────────────┐
 │  Classify query, generate search queries │
 └────────────────────┬────────────────────┘
                      │
     ┌────────────────▼────────────────────┐
     │         SEARCH (You.com Search API) │
     │  Multiple targeted medical queries   │
     └────────────────┬────────────────────┘
                      │
     ┌────────────────▼────────────────────┐
     │       READ (You.com Contents API)   │
     │  Extract full content from top URLs  │
     └────────────────┬────────────────────┘
                      │
     ┌────────────────▼────────────────────┐
     │      REASON (You.com Agents API)    │
     │  Analyze evidence, generate report   │
     └────────────────┬────────────────────┘
                      │
                      ▼
           Structured Health Report
      (Safety Rating + Evidence Level +
       Analysis + Citations + Disclaimer)
```

## Disclaimer

Remedy provides research-based information only. This is **not medical advice**. Always consult your healthcare provider before making medication or supplement changes.

## License

MIT

---

Built for the You.com Hackathon Track at DevWeek 2026.
