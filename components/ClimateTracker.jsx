import { useState } from "react";

const CANDIDATES = [
  // === SENATE - COMPETITIVE RACES ===
  {
    id: 1, name: "Susan Collins", state: "Maine", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Toss-Up",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Has broken with party on some climate votes; supported offshore wind. Voted against IRA.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 2, name: "Jon Ossoff", state: "Georgia", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Toss-Up",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Voted for IRA. Supports clean energy investment and EV manufacturing in Georgia.",
    fossilFuelDonations: "low",
  },
  {
    id: 3, name: "Roy Cooper", state: "North Carolina", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "As Governor signed executive orders on clean energy; set 2050 carbon neutrality goals for NC.",
    fossilFuelDonations: "low",
  },
  {
    id: 4, name: "Michael Whatley", state: "North Carolina", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former RNC Chairman. Trump-endorsed. Limited public climate record.",
    fossilFuelDonations: "unknown",
  },
  {
    id: 5, name: "Janet Mills", state: "Maine", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Toss-Up",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "As Maine Governor, set 100% clean electricity goal by 2040. Strong environmental record.",
    fossilFuelDonations: "low",
  },
  {
    id: 6, name: "Sherrod Brown", state: "Ohio", office: "U.S. Senate (Special)", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 5, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former Senator; has supported clean energy manufacturing. Mixed fossil fuel record for Ohio.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 7, name: "Jon Husted", state: "Ohio", office: "U.S. Senate (Special)", party: "R",
    incumbentStatus: "incumbent (appointed)", raceCompetitiveness: "Lean R",
    primaryDate: "May 5, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Appointed by Gov. DeWine. Supportive of Ohio energy sector including natural gas.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 8, name: "Ashley Hinson", state: "Iowa", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Likely R",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Congresswoman. Supports wind energy (Iowa is major wind state). Opposed carbon pricing.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 9, name: "John Cornyn", state: "Texas", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Likely R",
    primaryDate: "Mar 3, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Strongly pro-oil & gas. Opposed IRA, climate regulations. Supported LNG exports.",
    fossilFuelDonations: "high",
  },
  {
    id: 10, name: "Mark Warner", state: "Virginia", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Voted for IRA. Supports offshore wind off Virginia coast. Climate-focused record.",
    fossilFuelDonations: "low",
  },
  {
    id: 11, name: "Cory Booker", state: "New Jersey", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Strong climate champion. Co-sponsored Green New Deal. Advocates environmental justice.",
    fossilFuelDonations: "low",
  },
  {
    id: 12, name: "William Cassidy", state: "Louisiana", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Safe R",
    primaryDate: "Nov 3, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Has acknowledged climate science. Supported some coastal restoration. Strong oil & gas ties.",
    fossilFuelDonations: "high",
  },
  {
    id: 13, name: "Ben Ray Luján", state: "New Mexico", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Voted for IRA. Advocates clean energy transition while balancing New Mexico oil economy.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 14, name: "Mary Peltola", state: "Alaska", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Likely R",
    primaryDate: "Aug 25, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former Rep. Supported some resource development while emphasizing environmental protection for Alaska communities.",
    fossilFuelDonations: "moderate",
  },
  // === FLORIDA SPECIAL ===
  {
    id: 15, name: "Ashley Moody", state: "Florida", office: "U.S. Senate (Special)", party: "R",
    incumbentStatus: "incumbent (appointed)", raceCompetitiveness: "Lean R",
    primaryDate: "Aug 18, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Appointed AG turned Senator. Florida faces major climate threats (sea level, hurricanes). Limited proactive climate record.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 16, name: "Alexander Vindman", state: "Florida", office: "U.S. Senate (Special)", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "Aug 18, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "National security focus. Has cited climate as a national security threat. No detailed legislative climate record.",
    fossilFuelDonations: "low",
  },
  // === OPEN SEATS ===
  {
    id: 17, name: "John E. Sununu", state: "New Hampshire", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean D",
    primaryDate: "Sept 8, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former Senator. Generally skeptical of climate regulations. Opposes carbon taxes.",
    fossilFuelDonations: "moderate",
  },
  {
    id: 18, name: "Dan Osborn", state: "Nebraska", office: "U.S. Senate", party: "I",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 12, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Independent. Ran strong race in 2024. Labor-focused. Climate position not prominently defined.",
    fossilFuelDonations: "low",
  },
];

const PARTY_COLOR = { D: "#1a6bbf", R: "#c0392b", I: "#7d3c98" };
const PARTY_LABEL = { D: "Democrat", R: "Republican", I: "Independent" };
const COMPETITIVENESS_COLOR = {
  "Toss-Up": "#e67e22",
  "Lean D": "#2980b9",
  "Lean R": "#c0392b",
  "Likely D": "#1a6bbf",
  "Likely R": "#96281b",
  "Safe D": "#0e4d8f",
  "Safe R": "#6e1515",
};

const FOSSIL_ICON = { high: "🛢️🛢️🛢️", moderate: "🛢️🛢️", low: "🛢️", unknown: "❓" };

function ScoreBadge({ score }) {
  if (score === null) return (
    <span style={{ background: "#2a2a2a", color: "#888", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontFamily: "monospace" }}>
      NOT ANALYZED
    </span>
  );
  const color = score >= 70 ? "#27ae60" : score >= 40 ? "#e67e22" : "#c0392b";
  return (
    <span style={{ background: color, color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
      {score}/100
    </span>
  );
}

function CandidateCard({ candidate, onAnalyze, analyzing }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: "#111", border: "1px solid #222", borderRadius: 12,
      overflow: "hidden", transition: "border-color 0.2s",
      borderLeft: `4px solid ${PARTY_COLOR[candidate.party]}`,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#333"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}
    >
      <div style={{ padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
                {candidate.name}
              </span>
              <span style={{
                background: PARTY_COLOR[candidate.party], color: "#fff",
                padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 1
              }}>
                {PARTY_LABEL[candidate.party]}
              </span>
              {candidate.incumbentStatus.includes("incumbent") && (
                <span style={{ background: "#1a1a1a", color: "#aaa", border: "1px solid #333", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                  {candidate.incumbentStatus === "incumbent (appointed)" ? "Appointed" : "Incumbent"}
                </span>
              )}
            </div>
            <div style={{ color: "#888", fontSize: 13, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
              {candidate.state} · {candidate.office}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              background: COMPETITIVENESS_COLOR[candidate.raceCompetitiveness] + "22",
              color: COMPETITIVENESS_COLOR[candidate.raceCompetitiveness],
              border: `1px solid ${COMPETITIVENESS_COLOR[candidate.raceCompetitiveness]}44`,
              padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
            }}>
              {candidate.raceCompetitiveness}
            </span>
            <ScoreBadge score={candidate.climateScore} />
            <span style={{ color: "#555", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16 }}>
            <div style={{ background: "#0d0d0d", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>PRIMARY DATE</div>
              <div style={{ color: "#ddd", fontSize: 13 }}>{candidate.primaryDate}</div>
            </div>
            <div style={{ background: "#0d0d0d", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>GENERAL ELECTION</div>
              <div style={{ color: "#ddd", fontSize: 13 }}>{candidate.generalDate}</div>
            </div>
            <div style={{ background: "#0d0d0d", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>FOSSIL FUEL $</div>
              <div style={{ color: "#ddd", fontSize: 13 }}>{FOSSIL_ICON[candidate.fossilFuelDonations]} {candidate.fossilFuelDonations}</div>
            </div>
          </div>

          <div style={{ background: "#0d0d0d", borderRadius: 8, padding: 12, marginTop: 12 }}>
            <div style={{ color: "#555", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>KNOWN CLIMATE POSITIONS</div>
            <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.6 }}>{candidate.knownPositions}</div>
          </div>

          {candidate.climateAnalysis && (
            <div style={{ background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 8, padding: 14, marginTop: 12 }}>
              <div style={{ color: "#27ae60", fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                ✦ AI CLIMATE ANALYSIS
              </div>
              <div style={{ color: "#bbb", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {candidate.climateAnalysis}
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
            <button
              onClick={() => onAnalyze(candidate)}
              disabled={analyzing === candidate.id}
              style={{
                background: analyzing === candidate.id ? "#1a3a1a" : "#0f2a0f",
                color: analyzing === candidate.id ? "#555" : "#27ae60",
                border: "1px solid #27ae6044",
                padding: "8px 18px", borderRadius: 6, cursor: analyzing === candidate.id ? "not-allowed" : "pointer",
                fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
                transition: "all 0.2s"
              }}
            >
              {analyzing === candidate.id ? "⟳ Analyzing..." : "✦ Run Climate Analysis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClimateTracker() {
  const [candidates, setCandidates] = useState(CANDIDATES);
  const [analyzing, setAnalyzing] = useState(null);
  const [filter, setFilter] = useState({ party: "all", state: "", competitiveness: "all", analyzed: "all" });
  const [globalError, setGlobalError] = useState(null);

  const states = [...new Set(candidates.map(c => c.state))].sort();
  const competitive = [...new Set(candidates.map(c => c.raceCompetitiveness))];

  const filtered = candidates.filter(c => {
    if (filter.party !== "all" && c.party !== filter.party) return false;
    if (filter.state && c.state !== filter.state) return false;
    if (filter.competitiveness !== "all" && c.raceCompetitiveness !== filter.competitiveness) return false;
    if (filter.analyzed === "yes" && c.climateScore === null) return false;
    if (filter.analyzed === "no" && c.climateScore !== null) return false;
    return true;
  });

  const analyzeCandidate = async (candidate) => {
    setAnalyzing(candidate.id);
    setGlobalError(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${response.status}`);
      }

      const { text, score } = await response.json();

      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, climateScore: score, climateAnalysis: text }
          : c
      ));
    } catch (err) {
      setGlobalError(`Analysis failed for ${candidate.name}: ${err.message}`);
    } finally {
      setAnalyzing(null);
    }
  };

  const analyzeAll = async () => {
    const unanalyzed = filtered.filter(c => c.climateScore === null);
    for (const c of unanalyzed) {
      await analyzeCandidate(c);
      await new Promise(r => setTimeout(r, 800));
    }
  };

  const analyzedCount = candidates.filter(c => c.climateScore !== null).length;
  const avgScore = analyzedCount > 0
    ? Math.round(candidates.filter(c => c.climateScore !== null).reduce((a, c) => a + c.climateScore, 0) / analyzedCount)
    : null;

  const selectStyle = {
    background: "#111", color: "#ccc", border: "1px solid #2a2a2a",
    padding: "8px 12px", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        select option { background: #111; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "24px 32px", background: "#080808" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>🌿</span>
                <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
                  Climate Candidate Tracker
                </h1>
              </div>
              <p style={{ margin: "6px 0 0 40px", color: "#555", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
                2026 U.S. Primaries & Midterm Elections · AI-Powered Analysis
              </p>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { label: "Candidates", value: candidates.length },
                { label: "Analyzed", value: analyzedCount },
                { label: "Avg Score", value: avgScore !== null ? `${avgScore}/100` : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "right" }}>
                  <div style={{ color: "#27ae60", fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500 }}>{value}</div>
                  <div style={{ color: "#444", fontSize: 11, letterSpacing: 1 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select style={selectStyle} value={filter.party} onChange={e => setFilter(f => ({ ...f, party: e.target.value }))}>
              <option value="all">All Parties</option>
              <option value="D">Democrat</option>
              <option value="R">Republican</option>
              <option value="I">Independent</option>
            </select>
            <select style={selectStyle} value={filter.state} onChange={e => setFilter(f => ({ ...f, state: e.target.value }))}>
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={selectStyle} value={filter.competitiveness} onChange={e => setFilter(f => ({ ...f, competitiveness: e.target.value }))}>
              <option value="all">All Races</option>
              {competitive.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select style={selectStyle} value={filter.analyzed} onChange={e => setFilter(f => ({ ...f, analyzed: e.target.value }))}>
              <option value="all">All</option>
              <option value="yes">Analyzed Only</option>
              <option value="no">Unanalyzed Only</option>
            </select>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                onClick={analyzeAll}
                disabled={analyzing !== null}
                style={{
                  background: "#0f2a0f", color: "#27ae60", border: "1px solid #27ae6055",
                  padding: "8px 16px", borderRadius: 6, cursor: analyzing ? "not-allowed" : "pointer",
                  fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5
                }}
              >
                ✦ Analyze All Visible ({filtered.filter(c => c.climateScore === null).length})
              </button>
            </div>
          </div>

          {globalError && (
            <div style={{ marginTop: 12, background: "#1a0a0a", border: "1px solid #c0392b44", borderRadius: 6, padding: "10px 14px", color: "#e74c3c", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
              {globalError}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ color: "#444", fontSize: 12, fontFamily: "'DM Mono', monospace", alignSelf: "center" }}>SCORE:</span>
          {[["≥70 Strong", "#27ae60"], ["40–69 Mixed", "#e67e22"], ["<40 Weak", "#c0392b"], ["Not Analyzed", "#444"]].map(([label, color]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>

        <div style={{ color: "#444", fontSize: 12, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          SHOWING {filtered.length} OF {candidates.length} CANDIDATES
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(c => (
            <CandidateCard key={c.id} candidate={c} onAnalyze={analyzeCandidate} analyzing={analyzing} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#333", fontFamily: "'DM Mono', monospace" }}>
            No candidates match your filters.
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #1a1a1a", color: "#333", fontSize: 12, fontFamily: "'DM Mono', monospace", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 6, color: "#444" }}>DATA SOURCES & METHODOLOGY</div>
          Candidate data sourced from Wikipedia, Ballotpedia, and news reporting (as of March 2026). AI analysis powered by Claude (Anthropic). Scores reflect climate policy alignment with scientific consensus — not party affiliation. Race competitiveness ratings from Cook Political Report / Sabato&apos;s Crystal Ball. Fossil fuel donation levels are indicative estimates pending FEC data integration. This tracker is for informational purposes; always verify with primary sources.
        </div>
      </div>
    </div>
  );
}
