# Climate Candidate Tracker

An AI-powered tracker for the 2026 U.S. Senate primaries and midterm elections. Expand any candidate card to run a nonpartisan climate policy analysis powered by Claude.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org/) 15 (Pages Router) |
| UI | React 18 — inline styles, no CSS framework |
| AI | [Anthropic Claude](https://www.anthropic.com/) (`claude-opus-4-6`) via `@anthropic-ai/sdk` |
| Fonts | Google Fonts — Playfair Display, DM Sans, DM Mono |
| Runtime | Node.js 18+ |

## Required API Keys

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `ANTHROPIC_API_KEY` | Authenticates requests to the Claude API. Used **server-side only** — never sent to the browser. | [console.anthropic.com](https://console.anthropic.com/) → API Keys |

That's the only key this app needs. No database, no auth service, no third-party analytics.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Sparkleleuk/ClimateTracker.git
cd ClimateTracker
npm install
```

### 2. Add your API key

Create `.env.local` in the project root (this file is gitignored):

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
.
├── components/
│   └── ClimateTracker.jsx   # Main UI — candidate cards, filters, scoring
├── pages/
│   ├── _app.js              # Next.js app wrapper
│   ├── index.js             # Root page
│   └── api/
│       └── analyze.js       # Server-side proxy to the Anthropic API
├── .env.local               # Your secrets — never committed
├── next.config.js
└── package.json
```

## How the AI integration works

Clicking **Run Climate Analysis** on a candidate card sends a `POST` request to `/api/analyze` — a Next.js API route that runs on the server. That route calls the Anthropic API using the SDK and streams the response with `.finalMessage()`. The API key stays in the server process; the browser only ever talks to your own `/api/analyze` endpoint.

```
Browser → POST /api/analyze → Node.js (ANTHROPIC_API_KEY) → Claude API
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `http://localhost:3000` |
| `npm run build` | Build for production |
| `npm start` | Start production server (requires a prior build) |

## Data Sources

Candidate data sourced from Wikipedia, Ballotpedia, and news reporting (as of March 2026). Race competitiveness ratings from Cook Political Report / Sabato's Crystal Ball. Fossil fuel donation levels are indicative estimates pending FEC data integration.
