import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const TOC_ITEMS = [
  { id: 'our-mission',         label: '1. Our Mission',                  level: 1 },
  { id: 'climate-scoring',     label: '2. Climate Scoring',              level: 1 },
  { id: 'climate-dimensions',  label: '2.1 The 6 Dimensions',           level: 2 },
  { id: 'climate-scale',       label: '2.2 Scoring Scale',              level: 2 },
  { id: 'senate-vs-governor',  label: '2.3 Senate vs Governor',         level: 2 },
  { id: 'house-tiers',         label: '2.4 House Candidate Tiers',      level: 2 },
  { id: 'ai-policy-scoring',   label: '3. AI Policy Scoring',           level: 1 },
  { id: 'ai-dimensions',       label: '3.1 The 7 Dimensions',           level: 2 },
  { id: 'ai-scale',            label: '3.2 Scoring Scale',              level: 2 },
  { id: 'big-tech-modifiers',  label: '3.3 Big Tech Modifiers',         level: 2 },
  { id: 'state-legislature',   label: '3.4 State Legislature Records',  level: 2 },
  { id: 'data-sources',        label: '4. Data Sources',                level: 1 },
  { id: 'candidate-data',      label: '4.1 Candidate Data',             level: 2 },
  { id: 'donation-data',       label: '4.2 Donation Data',              level: 2 },
  { id: 'legislative-records', label: '4.3 Legislative Records',        level: 2 },
  { id: 'update-frequency',    label: '4.4 Update Frequency',           level: 2 },
  { id: 'limitations',         label: '5. Limitations & Disclaimers',   level: 1 },
  { id: 'requesting-changes',  label: '6. Requesting Changes',          level: 1 },
  { id: 'version-history',     label: '7. Version History',             level: 1 },
]

const CLIMATE_BANDS = [
  { range: '0–20',   label: 'Climate denier or active fossil fuel champion',  color: '#7b241c' },
  { range: '21–39',  label: 'Opposes most climate policy',                     color: '#c0392b' },
  { range: '40–59',  label: 'Mixed or limited record',                         color: '#e67e22' },
  { range: '60–69',  label: 'Supports mainstream climate policy',              color: '#d4ac0d' },
  { range: '70–84',  label: 'Strong climate record',                           color: '#27ae60' },
  { range: '85–100', label: 'Ambitious climate leader',                        color: '#1abc9c' },
]

const AI_BANDS = [
  { range: '0–20',   label: 'Actively opposes AI regulation, no data center requirements', color: '#7b241c' },
  { range: '21–39',  label: 'Opposes most AI oversight',                                   color: '#c0392b' },
  { range: '40–59',  label: 'No clear position or mixed record',                           color: '#e67e22' },
  { range: '60–69',  label: 'Supports targeted AI regulation in high-risk areas',          color: '#d4ac0d' },
  { range: '70–84',  label: 'Strong AI governance record',                                 color: '#2980b9' },
  { range: '85–100', label: 'Comprehensive AI oversight champion',                         color: '#1abc9c' },
]

// ─── Helper components ────────────────────────────────────────────────────────

function MTable({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 24 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 14px',
                color: '#555', fontSize: 10, fontFamily: "'DM Mono', monospace",
                letterSpacing: 1.5, textTransform: 'uppercase',
                borderBottom: '1px solid #222',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '10px 14px', fontSize: 13, verticalAlign: 'top',
                  color: j === 0 ? '#ccc' : '#999',
                  fontFamily: j === 0 ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
                  lineHeight: 1.5,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScoreScale({ bands }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        {bands.map((b, i) => (
          <div key={i} style={{ flex: 1, background: b.color }} title={`${b.range}: ${b.label}`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {bands.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: b.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: b.color, width: 44, flexShrink: 0 }}>{b.range}</span>
            <span style={{ fontSize: 13, color: '#999', lineHeight: 1.4 }}>{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionH2({ id, children }) {
  return (
    <h2 id={id} data-section-id={id} style={{
      fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
      color: '#fff', margin: '40px 0 16px', paddingTop: 8,
      borderBottom: '1px solid #222', paddingBottom: 12,
      scrollMarginTop: 24,
    }}>{children}</h2>
  )
}

function SectionH3({ id, children }) {
  return (
    <h3 id={id} data-section-id={id} style={{
      fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
      color: '#ddd', margin: '28px 0 12px',
      scrollMarginTop: 24,
    }}>{children}</h3>
  )
}

function Prose({ children }) {
  return (
    <p style={{ color: '#999', fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>{children}</p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MethodologyPage() {
  const [activeSection, setActiveSection] = useState('our-mission')
  const [tocDropdownOpen, setTocDropdownOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '0px 0px -65% 0px', threshold: 0 }
    )
    document.querySelectorAll('[data-section-id]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const tocItemStyle = (id, level) => ({
    display: 'block',
    padding: level === 1 ? '6px 16px' : '4px 16px 4px 28px',
    color: activeSection === id ? '#27ae60' : level === 1 ? '#888' : '#555',
    fontFamily: "'DM Mono', monospace",
    fontSize: level === 1 ? 12 : 11,
    fontWeight: activeSection === id ? 600 : 400,
    textDecoration: 'none',
    borderLeft: `2px solid ${activeSection === id ? '#27ae60' : 'transparent'}`,
    transition: 'color 0.15s, border-color 0.15s',
    lineHeight: 1.4,
  })

  return (
    <>
      <Head>
        <title>Scoring Methodology — Climate Candidate Tracker</title>
        <meta name="description" content="How we score candidates on climate and AI policy for the 2026 election cycle." />
        <style>{`html { scroll-behavior: smooth; }`}</style>
      </Head>

      <div data-theme="dark" style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Page header */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, background: '#080808', zIndex: 50 }}>
          <Link href="/" style={{ color: '#555', fontFamily: "'DM Mono', monospace", fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Tracker
          </Link>
          <span style={{ color: '#222' }}>|</span>
          <span style={{ color: '#27ae60', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1 }}>METHODOLOGY</span>
        </div>

        {/* Mobile TOC dropdown */}
        <div className="method-toc-mobile" style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'none' }}>
          <button
            onClick={() => setTocDropdownOpen(o => !o)}
            style={{
              width: '100%', background: '#111', border: '1px solid #222', borderRadius: 6,
              color: '#888', fontFamily: "'DM Mono', monospace", fontSize: 12, padding: '8px 12px',
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span>Table of Contents</span>
            <span>{tocDropdownOpen ? '▲' : '▼'}</span>
          </button>
          {tocDropdownOpen && (
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 6, marginTop: 4, padding: '8px 0' }}>
              {TOC_ITEMS.map(item => (
                <a key={item.id} href={`#${item.id}`}
                  onClick={() => setTocDropdownOpen(false)}
                  style={tocItemStyle(item.id, item.level)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', maxWidth: 1140, margin: '0 auto' }}>

          {/* Desktop TOC sidebar */}
          <nav className="method-toc-desktop" style={{
            width: 240, flexShrink: 0,
            position: 'sticky', top: 41, height: 'calc(100vh - 41px)',
            overflowY: 'auto', padding: '24px 0',
            borderRight: '1px solid #1a1a1a',
          }}>
            <div style={{ color: '#333', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5, padding: '0 16px', marginBottom: 12 }}>
              CONTENTS
            </div>
            {TOC_ITEMS.map(item => (
              <a key={item.id} href={`#${item.id}`} style={tocItemStyle(item.id, item.level)}>
                {item.label}
              </a>
            ))}
          </nav>

          {/* Content */}
          <main style={{ flex: 1, minWidth: 0, padding: '32px 48px 80px' }}>

            {/* ─── 1. Our Mission ─── */}
            <SectionH2 id="our-mission">1. Our Mission</SectionH2>
            <Prose>
              The Climate Candidate Tracker is a nonpartisan, AI-powered research tool that tracks and scores US congressional
              and gubernatorial candidates on their climate and AI policy positions for the 2026 election cycle. Our scores
              reflect alignment with scientific consensus and good governance principles — not party affiliation. We do not
              endorse candidates or recommend how to vote. Every score is linked to verifiable source data and is updated as
              new information becomes available.
            </Prose>

            {/* ─── 2. Climate Scoring ─── */}
            <SectionH2 id="climate-scoring">2. Climate Scoring</SectionH2>

            <SectionH3 id="climate-dimensions">2.1 The 6 Dimensions</SectionH3>
            <MTable
              headers={['Dimension', 'What It Measures', 'Weight']}
              rows={[
                ['Energy & Emissions', 'Clean energy support, fossil fuel positions, carbon pricing, grid modernization', '20%'],
                ['Land & Water', 'Public lands protection, water quality, deforestation, ocean and ecosystem preservation', '15%'],
                ['Transportation', 'EV policy, public transit investment, aviation and shipping emissions', '15%'],
                ['Pollution & Health', 'Air quality, chemical regulation, plastics policy, environmental justice', '20%'],
                ['Climate Resilience', 'Flood and sea level preparedness, wildfire policy, drought and heat response, disaster funding', '15%'],
                ['Policy Commitment', 'IRA support, Paris Agreement, EPA authority, international agreements, climate finance', '15%'],
              ]}
            />

            <SectionH3 id="climate-scale">2.2 Scoring Scale</SectionH3>
            <ScoreScale bands={CLIMATE_BANDS} />
            <div style={{ background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: '#27ae60', fontSize: 12, fontFamily: "'DM Mono', monospace", margin: 0, lineHeight: 1.6 }}>
                Scores are generated by Claude (Anthropic) based on available public information. Every score includes cited sources.
                A confidence indicator shows when the underlying data is sparse.
              </p>
            </div>

            <SectionH3 id="senate-vs-governor">2.3 Senate vs Governor Analysis</SectionH3>
            <Prose>
              Senate candidates are scored on federal policy positions — votes, bill sponsorships, and positions on federal
              climate legislation including the Inflation Reduction Act, EPA authority, and international climate commitments.
            </Prose>
            <Prose>
              Governor candidates are scored on state-level climate powers: renewable portfolio standards, utility regulation,
              state climate targets, building codes, land management, and disaster response. The scoring rubric is adapted for
              each office type so scores reflect what each candidate can actually do in the role they are seeking.
            </Prose>

            <SectionH3 id="house-tiers">2.4 House Candidate Tiers</SectionH3>
            <MTable
              headers={['Tier', 'Races Covered', 'Analysis Type', 'Confidence']}
              rows={[
                ['Tier 1', 'Battleground districts', 'Full 6-dimension AI analysis via Claude Opus', 'High'],
                ['Tier 2', 'Competitive open seats and active primaries', 'Compressed AI analysis via Claude Haiku', 'Medium'],
                ['Tier 3', 'Safe incumbent seats', 'Algorithmic score from party affiliation and donation data', 'Low'],
              ]}
            />
            <Prose>
              Any candidate can be upgraded to full Tier 1 analysis on demand by clicking <strong style={{ color: '#ccc' }}>Upgrade to Full Analysis</strong> on their candidate card.
            </Prose>

            {/* ─── 3. AI Policy Scoring ─── */}
            <SectionH2 id="ai-policy-scoring">3. AI Policy Scoring</SectionH2>
            <Prose>
              AI Policy scores are completely independent of Climate scores. The scoring system uses a separate prompt, separate
              database tables, and separate API route. A candidate's climate record has no bearing on their AI policy score.
            </Prose>

            <SectionH3 id="ai-dimensions">3.1 The 7 Dimensions</SectionH3>
            <MTable
              headers={['Dimension', 'What It Measures', 'Weight']}
              rows={[
                ['Data Center Energy', 'Renewable energy requirements for AI data centers', '25%'],
                ['AI Safety & Oversight', 'Support for federal AI oversight body and mandatory safety testing', '25%'],
                ['Algorithmic Accountability', 'Transparency and accountability for automated decision-making systems', '15%'],
                ['Water Usage Policy', 'Water consumption limits and disclosure requirements for data center cooling', '10%'],
                ['Grid Impact', 'Support for grid modernization to handle AI infrastructure energy demand', '10%'],
                ['AI in Elections', 'Disclosure requirements for AI-generated political content and deepfakes', '10%'],
                ['AI Economic Policy', 'Worker protections and creator rights in the AI economy', '5%'],
              ]}
            />

            <SectionH3 id="ai-scale">3.2 Scoring Scale</SectionH3>
            <ScoreScale bands={AI_BANDS} />
            <div style={{ background: '#050f1e', border: '1px solid #1a2e40', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: '#4a90d9', fontSize: 12, fontFamily: "'DM Mono', monospace", margin: 0, lineHeight: 1.6 }}>
                AI Policy scores are completely independent of Climate scores. A candidate can score high on one and low on the other.
              </p>
            </div>

            <SectionH3 id="big-tech-modifiers">3.3 Big Tech Donation Modifiers</SectionH3>
            <MTable
              headers={['Factor', 'Score Modifier']}
              rows={[
                ['High Big Tech PAC donations (over $10,000)', '−10 points'],
                ['Moderate Big Tech PAC donations ($1,000–$10,000)', '−5 points'],
                ['AI safety bill co-sponsorship', '+10 points'],
                ['Senate AI Caucus membership', '+5 points'],
                ['Commerce Committee membership', '+5 points'],
                ['Made AI regulation a campaign issue', '+5 points'],
              ]}
            />
            <Prose>
              Big Tech PAC donations are flagged as a potential conflict of interest signal, not as definitive evidence of
              industry capture. Modifiers are applied after the base score is calculated and are always disclosed in the candidate analysis.
            </Prose>

            <SectionH3 id="state-legislature">3.4 State Legislature Records</SectionH3>
            <Prose>
              For candidates who previously served in state legislatures — particularly House candidates running for their first
              federal office — we query OpenStates to identify relevant AI and climate bills they sponsored or co-sponsored at
              the state level. This is particularly important for candidates who may have authored significant state legislation
              before running for Congress. State legislative records are included in the analysis prompt sent to Claude and
              are cited in the resulting analysis.
            </Prose>

            {/* ─── 4. Data Sources ─── */}
            <SectionH2 id="data-sources">4. Data Sources</SectionH2>

            <SectionH3 id="candidate-data">4.1 Candidate Data</SectionH3>
            <MTable
              headers={['Source', 'What It Provides', 'Update Frequency']}
              rows={[
                ['Ballotpedia', 'Declared candidates, race status, primary dates, candidacy status changes', 'Weekly'],
                ['Wikipedia', 'Candidate background, incumbency history, and race context', 'Weekly'],
                ['Candidate websites', 'Policy positions and campaign platform statements', 'Weekly'],
                ['News archives', 'Statements, endorsements, debate positions, and recent updates', 'Weekly'],
              ]}
            />

            <SectionH3 id="donation-data">4.2 Donation Data</SectionH3>
            <MTable
              headers={['Source', 'What It Provides', 'Update Frequency']}
              rows={[
                ['FEC API', 'Campaign contributions from fossil fuel industry PACs and employees', 'Weekly'],
                ['FEC API', 'Campaign contributions from Big Tech PACs (Google, Microsoft, Meta, Amazon, Apple, NVIDIA)', 'Weekly'],
              ]}
            />
            <Prose>
              Donation levels are categorized as high, moderate, low, or none based on total cycle contributions from relevant
              industry PACs and employees. Raw dollar amounts are available in the FEC public database.
            </Prose>

            <SectionH3 id="legislative-records">4.3 Legislative Records</SectionH3>
            <MTable
              headers={['Source', 'What It Provides', 'Update Frequency']}
              rows={[
                ['Congress.gov API', 'Federal bill sponsorships, co-sponsorships, and floor votes', 'Weekly'],
                ['OpenStates API', 'State legislature bill sponsorships for AI and climate-relevant legislation', 'Weekly'],
                ['VoteSmart', 'Voting record summaries and candidate questionnaire responses', 'Monthly'],
              ]}
            />

            <SectionH3 id="update-frequency">4.4 Update Frequency</SectionH3>
            <Prose>
              Candidate data is automatically synced from Ballotpedia every Monday at 6am UTC. AI analyses are cached for 7
              days — a candidate's score will not change more than once per week unless new source data triggers a re-analysis.
              The analysis date is shown on every candidate card. Scores generated before a major prompt methodology update
              are marked with a version indicator.
            </Prose>

            {/* ─── 5. Limitations ─── */}
            <SectionH2 id="limitations">5. Limitations & Disclaimers</SectionH2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['⚠️', 'AI analysis may contain errors.', 'Claude generates scores based on available public information. Always verify important claims with primary sources before publishing or sharing.'],
                ['⚠️', 'Thin records produce low-confidence scores.', 'Candidates with limited public statements or legislative history will have sparse data. Confidence indicators show when this is the case.'],
                ['⚠️', 'Positions change.', "A score reflects a candidate's record as of the analysis date shown. Candidates evolve their positions especially during primary season."],
                ['⚠️', 'This is not a voting guide.', 'We score candidates on climate and AI policy only. These are important issues but not the only factors relevant to choosing a candidate.'],
                ['⚠️', 'House candidate coverage is partial.', 'We provide full analysis for battleground districts and compressed analysis for other declared candidates. Many safe-seat candidates have algorithmic scores only.'],
                ['⚠️', 'Fossil fuel and Big Tech donation data is a signal not a verdict.', 'Receiving industry donations does not automatically mean a candidate supports harmful policies — it is one data point among many.'],
                ['⚠️', 'State-level data may lag.', 'OpenStates coverage varies by state. Some state legislature records may be incomplete or delayed.'],
              ].map(([icon, bold, rest], i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                    <strong style={{ color: '#ccc' }}>{bold}</strong>{' '}{rest}
                  </p>
                </div>
              ))}
            </div>

            {/* ─── 6. Requesting Changes ─── */}
            <SectionH2 id="requesting-changes">6. Requesting Changes</SectionH2>
            <Prose>
              We are committed to accuracy and welcome corrections. Here is how to flag issues:
            </Prose>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                ['Missing candidate', 'Use the Request a Candidate form that appears when your search returns no results on the main tracker page.'],
                ['Factual error in a score or analysis', 'Open a GitHub issue at github.com/Sparkleleuk/ClimateTracker with the candidate name, the specific claim, and a source link. Label it factual-error.'],
                ['Outdated information', "Scores refresh weekly. If a score seems outdated, check the analysis date on the candidate card. If the date is recent and the score still seems wrong, open a GitHub issue."],
                ['Candidate withdrawal or status change', 'These are updated in the weekly Ballotpedia sync every Monday. If a candidate has withdrawn and is still showing as active it will be corrected in the next Monday sync.'],
              ].map(([title, desc], i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#27ae60', marginBottom: 4 }}>{title}</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#888', lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
            <Prose>All correction requests via GitHub are reviewed within 48 hours.</Prose>

            {/* ─── 7. Version History ─── */}
            <SectionH2 id="version-history">7. Version History</SectionH2>
            <MTable
              headers={['Version', 'Date', 'Changes']}
              rows={[
                ['v1.0', 'March 2026', 'Initial launch with Senate and Governor candidates. 6-dimension climate scoring system.'],
                ['v1.1', 'March 2026', 'Added House candidates with three-tier analysis system (Tier 1 / 2 / 3).'],
                ['v1.2', 'April 2026', 'Added independent AI Policy scoring with 7 dimensions and Big Tech PAC modifier system.'],
                ['v1.3', 'June 2026', 'Added OpenStates integration for state legislature records. Sidebar filter layout redesign. Added missing candidate request flow.'],
              ]}
            />

            {/* Back link */}
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1a1a1a' }}>
              <Link href="/" style={{ color: '#444', fontFamily: "'DM Mono', monospace", fontSize: 12, textDecoration: 'none' }}>
                ← Back to Climate Candidate Tracker
              </Link>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
