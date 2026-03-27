# 🌿 Climate Candidate Tracker

**A nonpartisan, AI-powered tool that tracks, analyzes, and rates 2026 US congressional and gubernatorial candidates on their climate and environmental records.**

![Build Status](https://img.shields.io/github/actions/workflow/status/Sparkleleuk/ClimateTracker/build.yml?label=Build)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)
![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20(Anthropic)-blueviolet)

---

## Overview

The Climate Candidate Tracker is an open-source tool that gives voters, journalists, and researchers a clear, evidence-based picture of where 2026 candidates stand on climate and environmental policy. Every candidate receives an AI-generated climate score (0–100) grounded in their voting record, public statements, fossil fuel donations, and known policy positions.

**Elections covered:**
- 2026 US Senate primaries and midterm elections (competitive and key races)
- 2026 gubernatorial races (states with significant climate policy relevance)

**Currently tracking 37 candidates** across Senate and Governor races.

All analysis is **nonpartisan**. Scores reflect alignment with climate science consensus — not party affiliation. A Republican with a strong conservation record scores higher than a Democrat with deep fossil fuel ties.

---

## Features

- **AI-powered climate analysis** — Each candidate is analyzed by Claude (Anthropic) and receives a 0–100 climate score with a full written breakdown
- **Multi-dimensional scoring** — Analysis spans 6 climate dimensions: energy, land, transportation, pollution, resilience, and policy commitment
- **Candidate comparison tool** — Compare any two candidates in the same race, issue by issue, with structured AI analysis
- **Senate & Governor coverage** — Separate analysis prompts tuned to federal vs. state-level climate powers
- **Automated weekly sync** — Candidate data syncs from Ballotpedia every Monday; statuses update automatically as races evolve
- **Fossil fuel donation tracking** — Each candidate is flagged with donation level (low / moderate / high / unknown)
- **Race competitiveness ratings** — Sourced from Cook Political Report and Sabato's Crystal Ball
- **Filter & search** — Filter by office, party, state, race rating, issue tag, or analysis status; search by name
- **Persistent analysis** — Scores and analysis are stored in Supabase and load instantly on every page visit

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

### Transparency Statement

Methodology is versioned in this repository. Every score links back to source quotes, votes, or donation data that informed it. AI analysis may contain errors or gaps — **human review is strongly recommended before publishing or citing any individual score.** Candidate positions change over time; check the analysis timestamp on each card.

---

## Data Sources

| Source | Use |
|---|---|
| [Ballotpedia](https://ballotpedia.org) | Candidate data, race information, weekly automated sync |
| Wikipedia | Candidate background, incumbency history, race context |
| [FEC API](https://api.open.fec.gov) | Fossil fuel donation data *(integration planned)* |
| [OpenStates API](https://openstates.org/api/) | State legislature voting records *(planned)* |
| [Cook Political Report](https://cookpolitical.com) | Race competitiveness ratings |
| [Sabato's Crystal Ball](https://centerforpolitics.org/crystalball/) | Race competitiveness ratings |
| [Anthropic Claude API](https://console.anthropic.com) | AI analysis engine |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (Pages Router) | Server-side rendering, API routes |
| UI | React 18 | Component-based interface |
| Styling | CSS custom properties | Dark/light theming, responsive layout |
| Database | Supabase (PostgreSQL) | Candidate storage, persistent analysis |
| AI | Anthropic Claude API | Climate scoring and analysis |
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

| Variable | Where to find it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `SUPABASE_URL` | Supabase → your project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → your project → Settings → API → Secret key |
| `SYNC_SECRET` | Any long random string — e.g. `openssl rand -hex 32` |

### Database Setup

1. Open your Supabase project → **SQL Editor**
2. Paste and run the full contents of `supabase/schema.sql`
3. Run the seed script to populate all candidates:

```bash
node scripts/seed.mjs
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

### Cron Job

`vercel.json` configures a cron job that runs `GET /api/sync` every Monday at 6:00am UTC. This scrapes Ballotpedia, adds new candidates, and updates statuses automatically. No action needed after initial deployment.

### Manual Sync

Visit `/?admin=true` in the browser and click the **Sync** button. You will be prompted for your `SYNC_SECRET` value.

---

## Project Structure

```
ClimateTracker/
├── components/
│   └── ClimateTracker.jsx      # Main UI — candidate list, filters, modals
├── pages/
│   ├── index.js                # Entry point — loads candidates via getServerSideProps
│   └── api/
│       ├── analyze.js          # Claude analysis endpoint — scores one candidate
│       ├── compare.js          # Claude comparison endpoint — compares two candidates
│       ├── candidates.js       # Returns candidate list from Supabase
│       └── sync.js             # Ballotpedia sync endpoint (cron + admin)
├── lib/
│   ├── scrapers/
│   │   └── ballotpedia.js      # Ballotpedia HTML scraper (Senate + Governor)
│   ├── sync/
│   │   └── candidateSync.js    # Sync logic — upsert, status detection
│   ├── data/
│   │   └── candidatesFallback.js # Static fallback if Supabase is unavailable
│   └── supabaseClient.js       # Supabase client (server-side only)
├── services/
│   ├── climateApi.js           # Client-side fetch wrapper for /api/analyze
│   └── compareApi.js           # Client-side fetch wrapper for /api/compare
├── styles/
│   └── climate.css             # Theme tokens, filter layout, responsive breakpoints
├── supabase/
│   └── schema.sql              # Full database schema, migrations, and seed data
├── scripts/
│   └── seed.mjs                # Programmatic seed script — run once after schema setup
├── .env.example                # Required environment variables (safe to commit)
├── .env.local                  # Your local secrets — never committed
├── QA-ISSUES.md                # Known non-critical issues with priority levels
└── vercel.json                 # Cron job configuration (Mondays 6am UTC)
```

---

## Candidate Sync

The automated sync pipeline runs every Monday and:

1. Scrapes Ballotpedia for Senate and Governor candidate pages
2. Adds any new candidates not yet in the database
3. Updates candidacy statuses as races evolve
4. Never deletes historical candidates or their stored analysis

### Candidacy Status Badges

| Badge | Meaning |
|---|---|
| `DECLARED` | Officially running |
| `NOMINEE` | Won their party primary |
| `WITHDREW` | Dropped out of the race |
| `ELIMINATED` | Lost in primary |

### Filing Deadlines

Each state has a filing deadline tracked in the `filing_deadlines` table. States past their deadline are marked **Filing Closed**; states still accepting candidates are marked **Filing Open**.

---

## Contributing

### Reporting a Factual Error

If you believe a candidate's score or analysis contains a factual error:

1. Open an issue on [GitHub](https://github.com/Sparkleleuk/ClimateTracker/issues) with the candidate's name, the specific claim, and a source
2. Label it `factual-error`
3. We will re-analyze with updated position data and publish a corrected score

### Suggesting a Candidate

Open an issue labeled `new-candidate` with the candidate's name, state, office, and a Ballotpedia or Wikipedia link.

### Contributing Code

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
# make your changes
git push origin feature/your-feature-name
# open a pull request
```

### Code Style

- No hardcoded secrets anywhere in the codebase
- All Anthropic and Supabase API calls must be server-side only (`pages/api/`)
- No `NEXT_PUBLIC_` variables for sensitive values
- Keep analysis prompts in `pages/api/analyze.js` — not in client components

---

## Important Disclaimers

- **Nonpartisan** — Scores reflect climate science alignment only. Party affiliation is not a scoring factor.
- **AI may contain errors** — Analysis is AI-generated and may mischaracterize a candidate's record. Always verify with primary sources before publishing.
- **Positions change** — Candidates update their platforms. Check the analysis date on each card and re-analyze if needed.
- **Not a voting guide** — This tracker covers climate positions only. It does not evaluate candidates on any other issue or their overall fitness for office.
- **Fossil fuel data is indicative** — Donation levels are estimates based on available reporting. Full FEC integration is planned but not yet complete.

---

## Roadmap

| Feature | Status | Priority |
|---|---|---|
| US Senate candidates | ✅ Complete | — |
| Gubernatorial candidates | ✅ Complete | — |
| Supabase persistence | ✅ Complete | — |
| Ballotpedia auto-sync | ✅ Complete | — |
| Candidate comparison tool | ✅ Complete | — |
| FEC fossil fuel donation data | 🔲 Planned | High |
| US House candidates (435 seats) | 🔲 Planned | High |
| State legislature candidates | 🔲 Planned | Medium |
| Per-issue scoring breakdown | 🔲 Planned | Medium |
| Admin review panel | 🔲 Planned | Medium |
| Email alerts for score changes | 🔲 Planned | Low |
| Public API for researchers | 🔲 Planned | Low |
| Mobile app | 🔲 Planned | Low |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Anthropic](https://anthropic.com) for the Claude API
- [Ballotpedia](https://ballotpedia.org) for open candidate data
- [Supabase](https://supabase.com) for database infrastructure
- [Cook Political Report](https://cookpolitical.com) and [Sabato's Crystal Ball](https://centerforpolitics.org/crystalball/) for race ratings
