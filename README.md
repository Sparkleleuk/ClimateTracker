# 🌿 Climate Candidate Tracker

**A nonpartisan, AI-powered tool that tracks, analyzes, and rates 2026 US congressional and gubernatorial candidates on their climate and environmental records — and their positions on AI governance and data center regulation.**

![Build Status](https://img.shields.io/github/actions/workflow/status/Sparkleleuk/ClimateTracker/build.yml?label=Build)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)
![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20(Anthropic)-blueviolet)

---

## Overview

The Climate Candidate Tracker gives voters, journalists, and researchers a clear, evidence-based picture of where 2026 candidates stand on two independent policy dimensions:

**🌿 Climate Score** — alignment with climate science on energy, land, transportation, pollution, resilience, and federal climate policy.

**⚡ AI Policy Score** — positions on AI governance and data center regulation: renewable energy requirements for data centers, water usage limits, AI safety oversight, algorithmic accountability, election integrity, and worker protections.

Both scores are **fully independent**. A candidate's climate record does not affect their AI policy score, and vice versa. A high fossil-fuel senator could still earn a high AI safety score; a green champion might oppose data center regulation.

**Elections covered:**
- 2026 US Senate primaries and midterm elections (competitive and key races)
- 2026 gubernatorial races (states with significant climate or AI policy relevance)
- 2026 US House battleground districts

**Currently tracking 542 candidates** across Senate, Governor, and House races.

All analysis is **nonpartisan**. Scores reflect policy alignment — not party affiliation.

---

## Features

### Climate Scoring
- **AI-powered climate analysis** — Claude (Anthropic) produces a 0–100 climate score with a full written breakdown
- **Multi-dimensional scoring** — Analysis spans 6 climate dimensions: energy, land, transportation, pollution, resilience, and policy commitment
- **Senate vs. Governor analysis** — Separate prompts tuned to federal vs. state-level climate powers

### AI Policy Scoring *(new)*
- **Independent AI policy analysis** — Completely separate scoring system; does not touch climate scores or data
- **7 scored dimensions** with weighted aggregate score (see methodology below)
- **Data center district mapping** — Candidates in major data center states (Virginia, Texas, Iowa, etc.) are flagged with contextual analysis
- **Big Tech PAC donation tracking** — FEC-sourced donation data flags potential conflicts of interest on AI regulation votes
- **AI bill co-sponsorship tracking** — Congress.gov data shows which AI governance bills each candidate has sponsored

### Shared Tools
- **Candidate comparison tool** — Compare two candidates on any climate **or** AI policy dimension
- **Dual leaderboards** — Top 10 by climate score, AI policy score, or combined average
- **Advanced filters** — Filter by AI score range, data center district, Big Tech funding, or AI bill co-sponsorship
- **Automated weekly sync** — Candidate data syncs from Ballotpedia every Monday
- **Fossil fuel donation tracking** — Each candidate flagged with donation level (low / moderate / high / unknown)
- **Congressional district maps** — Interactive Leaflet maps showing US Census 119th Congress district boundaries
- **Race competitiveness ratings** — Cook Political Report and Sabato's Crystal Ball

### Candidate Request Flow
- **Zero-result search empty state** — When a name search returns no results, users see a "No candidates found for [term]" prompt with a **+ Request be added** button
- **Inline request form** — Expands in place with name pre-filled; fields for state, office, optional party, and optional source URL
- **Duplicate detection** — Before saving, the API checks the candidates table with a case-insensitive match; duplicates show a mini candidate card with Yes/No confirmation instead of a form error
- **Rate limiting** — Cookie-based limit of 5 submissions per session per 24 hours
- **Search analytics** — Every zero-result search is logged to `search_analytics` (debounced, once per unique term); a separate log entry records when users click through to the request form

### Admin Review Panel *(at ?admin=true)*
- **Candidate Requests section** — Appears above the candidate list; shows a pending count badge and a full table of pending requests
- **Pending table columns** — Name, State, Office, editable Party dropdown, Source URL link, Submitted date, Add Candidate button, Reject button
- **Add Candidate** — Inserts directly into the `candidates` table using request data; disabled until party is set (required by schema); marks request `approved` and moves it to the archive instantly
- **Reject** — Marks request `rejected` and moves it to the archive
- **Collapsible archive** — Shows all approved and rejected requests with status badges and reviewed dates

---

## Climate Scoring Methodology

### The 0–100 Scale

| Score | Meaning |
|---|---|
| 0–20 | Climate denier or active fossil fuel champion |
| 21–39 | Weak record; opposes most climate action |
| 40–69 | Mixed or moderate record |
| 70–89 | Strong climate record with some gaps |
| 90–100 | Ambitious climate leader |

### Scoring Dimensions

| Dimension | What it covers |
|---|---|
| **Energy & Emissions** | Clean energy support, fossil fuel opposition, grid modernization, carbon pricing |
| **Land & Water** | Public lands protection, water rights, deforestation, ocean and biodiversity policy |
| **Transportation** | EV adoption, public transit investment, aviation and shipping emissions |
| **Pollution & Health** | Air quality, chemical regulation, plastics policy, environmental justice |
| **Climate Resilience** | Flood and sea level preparedness, wildfire policy, drought and heat response, disaster funding |
| **Policy Commitment** | Paris Agreement support, IRA/GND positions, EPA authority, climate finance, NEPA |

### Senate vs. Governor Analysis

**Senate candidates** are analyzed on their federal legislative record: votes, co-sponsorships, committee positions, and stances on federal climate bills and agency authority.

**Governor candidates** are analyzed on state-level climate powers: renewable energy standards, utility regulation, executive orders, land use authority, building codes, and climate resilience investment.

---

## AI Policy Scoring Methodology

### The 0–100 Scale

| Score | Meaning |
|---|---|
| 0–20 | Actively opposes AI regulation; no data center requirements |
| 21–39 | Weak or absent AI governance positions |
| 40–69 | Mixed positions or limited public record |
| 70–89 | Strong AI governance advocate with some gaps |
| 90–100 | Comprehensive AI oversight champion |

### Scoring Dimensions and Weights

| Dimension | Weight | What it covers |
|---|---|---|
| **Data Center Energy** | 25% | Supports renewable energy requirements for AI data centers |
| **AI Safety & Oversight** | 25% | Supports federal AI safety testing and oversight frameworks |
| **Algorithmic Accountability** | 15% | Supports transparency and accountability for automated decision-making |
| **Water Usage Policy** | 10% | Supports water usage limits and disclosure for data centers |
| **Grid Impact** | 10% | Supports grid modernization to handle AI infrastructure load |
| **AI in Elections** | 10% | Supports disclosure requirements for AI-generated political content |
| **AI Economic Policy** | 5% | Supports worker protections and creator rights in the AI economy |

### Score Modifiers

| Factor | Impact |
|---|---|
| High Big Tech PAC donations (>$10k) | −10 points |
| Moderate Big Tech PAC donations ($1k–$10k) | −5 points |
| Co-sponsored an AI safety bill | +10 points |
| Member of Senate AI Caucus | +5 points |
| Commerce Committee member | +5 points |
| Made AI regulation a campaign issue | +5 points |

### Independence Guarantee

AI policy scoring is architecturally independent of climate scoring:
- Separate prompt (`lib/prompts/aiPolicyPrompts.js`) explicitly instructs the model to ignore climate positions
- Separate storage tables (`ai_analyses`, `ai_analyses_lite`) — no shared columns with climate analysis
- Separate API route (`/api/analyze-ai`) — no shared code with `/api/analyze`
- Separate score badge (⚡ blue) displayed alongside but independent of climate badge (🌿 green)

---

## Data Sources

| Source | Use |
|---|---|
| [Ballotpedia](https://ballotpedia.org) | Candidate data, race information, weekly automated sync |
| Wikipedia | Candidate background, incumbency history, race context |
| [FEC API](https://api.open.fec.gov) | Big Tech PAC donation data for AI policy conflict-of-interest flags |
| [Congress.gov API](https://api.congress.gov) | AI bill co-sponsorship tracking (DEFIANCE Act, NO FAKES Act, etc.) |
| Data Center District Map | Hardcoded map of states/districts with significant data center presence (`lib/data/dataCenterDistricts.js`) |
| [OpenStates API](https://openstates.org/api/) | State legislature voting records *(planned)* |
| [Cook Political Report](https://cookpolitical.com) | Race competitiveness ratings |
| [Sabato's Crystal Ball](https://centerforpolitics.org/crystalball/) | Race competitiveness ratings |
| [Anthropic Claude API](https://console.anthropic.com) | AI analysis engine (Opus for Tier 1, Haiku for Tier 2) |
| [US Census TIGERweb API](https://tigerweb.geo.census.gov) | 119th Congress congressional district boundaries for interactive maps |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (Pages Router) | Server-side rendering, API routes |
| UI | React 18 | Component-based interface |
| Styling | CSS custom properties | Dark/light theming, responsive layout |
| Database | Supabase (PostgreSQL) | Candidate storage, persistent analysis, caching |
| AI | Anthropic Claude API | Climate and AI policy scoring and analysis |
| Maps | Leaflet.js | Interactive congressional district and state boundary maps |
| Scraping | Cheerio + node-fetch | Ballotpedia HTML scraping |
| Hosting | Vercel | Deployment, serverless functions |
| Automation | Vercel Cron | Weekly Ballotpedia sync (Mondays 6am UTC) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic](https://console.anthropic.com) account with API credits

### Installation

```bash
git clone https://github.com/Sparkleleuk/ClimateTracker.git
cd ClimateTracker
npm install
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your credentials:

| Variable | Where to find it | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | ✅ Required |
| `SUPABASE_URL` | Supabase → your project → Settings → API | ✅ Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → your project → Settings → API → Secret key | ✅ Required |
| `SYNC_SECRET` | Any long random string — e.g. `openssl rand -hex 32` | ✅ Required |
| `FEC_API_KEY` | [api.open.fec.gov](https://api.open.fec.gov/developers/) | Optional — enables Big Tech PAC data |
| `CONGRESS_API_KEY` | [api.congress.gov](https://api.congress.gov/sign-up/) | Optional — enables AI bill tracking |

### Database Setup

1. Open your Supabase project → **SQL Editor**
2. Paste and run the full contents of `supabase/schema.sql`
3. Run migrations in order:
   ```
   supabase/migrations/005_ai_policy_scoring.sql
   supabase/migrations/006_candidate_requests.sql
   ```
4. Run the seed script to populate all candidates:

```bash
node scripts/seed.mjs
```

5. *(Optional)* Run AI policy analysis on Senate/Governor candidates:

```bash
node scripts/runAIPolicyAnalysis.mjs
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

The app deploys automatically to Vercel on every push to `main`.

### Vercel Environment Variables

Add these in Vercel → your project → Settings → Environment Variables:

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SYNC_SECRET`
- `FEC_API_KEY` *(optional)*
- `CONGRESS_API_KEY` *(optional)*

### Manual Sync

Visit `/?admin=true` in the browser and click the **Sync** button. You will be prompted for your `SYNC_SECRET` value.

---

## Project Structure

```
ClimateTracker/
├── components/
│   ├── ClimateTracker.jsx       # Main UI — candidate list, dual scoring, leaderboards, modals
│   └── DistrictMap.jsx          # Leaflet district/state boundary map modal
├── pages/
│   ├── index.js                 # Entry point — loads candidates via getServerSideProps
│   └── api/
│       ├── analyze.js               # Climate analysis endpoint
│       ├── analyze-ai.js            # AI policy analysis endpoint (independent)
│       ├── compare.js               # Climate comparison endpoint
│       ├── compare-ai.js            # AI policy comparison endpoint (by dimension)
│       ├── candidates.js            # Returns candidate list from Supabase
│       ├── sync.js                  # Ballotpedia sync endpoint (cron + admin)
│       ├── request-candidate.js     # Save user candidate requests; dupe check + rate limit
│       ├── log-search.js            # Log zero-result searches to search_analytics
│       ├── admin-requests.js        # Admin: fetch pending + archived candidate requests
│       └── admin-request-action.js  # Admin: approve (insert candidate) or reject a request
├── lib/
│   ├── constants/
│   │   ├── tiers.js             # Analysis tier definitions
│   │   └── aiDimensions.js      # AI policy dimension weights and rubric modifiers
│   ├── prompts/
│   │   ├── housePrompts.js      # Tier 1/2 climate prompts for House candidates
│   │   └── aiPolicyPrompts.js   # Tier 1/2 AI policy prompts (independent)
│   ├── data/
│   │   ├── candidatesFallback.js  # Static fallback if Supabase is unavailable
│   │   ├── bigTechDonations.js    # FEC API fetcher — Big Tech PAC donations
│   │   ├── aiBillsTracker.js      # Congress.gov API fetcher — AI bill co-sponsors
│   │   └── dataCenterDistricts.js # Hardcoded data center district map
│   ├── analysis/
│   │   └── batchAnalyzer.js     # Anthropic Batch API — climate and ai_policy types
│   ├── sync/
│   │   └── candidateSync.js     # Sync logic — upsert, status detection, AI data refresh
│   ├── scoring/
│   │   └── algorithmicScore.js  # Tier 3 rule-based scoring for House candidates
│   └── supabaseClient.js        # Supabase client (server-side only)
├── services/
│   ├── climateApi.js            # Client-side fetch wrapper for /api/analyze
│   └── compareApi.js            # Client-side fetch wrapper for /api/compare
├── scripts/
│   ├── seed.mjs                 # Programmatic seed script — run once after schema setup
│   ├── scrapeHouseToSupabase.mjs # Run locally to bypass Ballotpedia WAF (AWS IPs blocked)
│   └── runAIPolicyAnalysis.mjs  # Batch AI policy analysis for Senate/Gov candidates
├── supabase/
│   ├── schema.sql               # Full database schema
│   └── migrations/
│       ├── 001_candidates.sql
│       ├── 002_filing_deadlines.sql
│       ├── 003_office_types.sql
│       ├── 004_house_candidates.sql
│       ├── 005_ai_policy_scoring.sql  # ai_analyses, big_tech_donations, ai_bill_cosponsors
│       └── 006_candidate_requests.sql # candidate_requests, search_analytics
├── styles/
│   └── climate.css              # Theme tokens, filter layout, responsive breakpoints
├── .env.example                 # Required environment variables (safe to commit)
└── vercel.json                  # Cron job configuration (Mondays 6am UTC)
```

---

## Candidate Sync

The automated sync pipeline runs every Monday and:

1. Scrapes Ballotpedia for Senate and Governor candidate pages
2. Adds any new candidates not yet in the database
3. Updates candidacy statuses as races evolve
4. Refreshes Big Tech PAC donation data for Senate and incumbent House candidates
5. Never deletes historical candidates or their stored analysis

---

## Roadmap

| Feature | Status | Priority |
|---|---|---|
| US Senate candidates | ✅ Complete | — |
| Gubernatorial candidates | ✅ Complete | — |
| Supabase persistence | ✅ Complete | — |
| Ballotpedia auto-sync | ✅ Complete | — |
| Candidate comparison tool | ✅ Complete | — |
| US House candidates (battleground districts) | ✅ Complete | — |
| Congressional district maps (Census TIGERweb) | ✅ Complete | — |
| AI Policy Scoring System | ✅ Complete | — |
| FEC Big Tech PAC donation integration | ✅ Complete | — |
| Congress.gov AI bill co-sponsorship tracking | ✅ Complete | — |
| Data center district mapping | ✅ Complete | — |
| Candidate request flow (user submissions) | ✅ Complete | — |
| Search analytics (zero-result logging) | ✅ Complete | — |
| Admin candidate request review panel | ✅ Complete | — |
| FEC fossil fuel donation data (full integration) | 🔲 Planned | High |
| State legislature candidates | 🔲 Planned | Medium |
| Per-issue scoring breakdown | 🔲 Planned | Medium |
| Email alerts for score changes | 🔲 Planned | Low |
| Public API for researchers | 🔲 Planned | Low |
| Mobile app | 🔲 Planned | Low |

---

## Important Disclaimers

- **Nonpartisan** — Both scores reflect policy alignment only. Party affiliation is not a scoring factor.
- **AI may contain errors** — Analysis is AI-generated and may mischaracterize a candidate's record. Always verify with primary sources before publishing.
- **Scores are independent** — A candidate's climate score has no bearing on their AI policy score and vice versa. The scoring systems are architecturally separated.
- **Positions change** — Candidates update their platforms. Check the analysis date on each card and re-analyze if needed.
- **Not a voting guide** — This tracker covers climate and AI policy positions only. It does not evaluate candidates on any other issue or their overall fitness for office.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Anthropic](https://anthropic.com) for the Claude API
- [Ballotpedia](https://ballotpedia.org) for open candidate data
- [Supabase](https://supabase.com) for database infrastructure
- [US Census Bureau](https://www.census.gov) for TIGERweb district boundary API
- [Cook Political Report](https://cookpolitical.com) and [Sabato's Crystal Ball](https://centerforpolitics.org/crystalball/) for race ratings
