import { useState } from "react";
import { analyzeCandidate as fetchAnalysis } from "../services/climateApi";
import { compareCandiates } from "../services/compareApi";
import ReactMarkdown from "react-markdown";

const CANDIDATES = [
  // === SENATE - COMPETITIVE RACES ===
  {
    id: 1, name: "Susan Collins", state: "Maine", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Toss-Up",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Has broken with party on some climate votes; supported offshore wind. Voted against IRA.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: "$289,469", fossilFuelCycle: "2020 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/susan-collins/industries?cid=N00000491&cycle=2020",
    opponent: "Janet Mills (D)",
  },
  {
    id: 2, name: "Jon Ossoff", state: "Georgia", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Toss-Up",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Voted for IRA. Supports clean energy investment and EV manufacturing in Georgia.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/jon-ossoff/industries?cid=N00040675&cycle=2026",
    opponent: "R primary: Mike Collins, Buddy Carter, Derek Dooley",
  },
  {
    id: 3, name: "Roy Cooper", state: "North Carolina", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "As Governor signed executive orders on clean energy; set 2050 carbon neutrality goals for NC.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SNC2026",
    opponent: "Michael Whatley (R)",
  },
  {
    id: 4, name: "Michael Whatley", state: "North Carolina", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former RNC Chairman. Trump-endorsed. Limited public climate record.",
    fossilFuelDonations: "unknown",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SNC2026",
    opponent: "Roy Cooper (D)",
  },
  {
    id: 5, name: "Janet Mills", state: "Maine", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Toss-Up",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "As Maine Governor, set 100% clean electricity goal by 2040. Strong environmental record.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SME2026",
    opponent: "Susan Collins (R)",
  },
  {
    id: 6, name: "Sherrod Brown", state: "Ohio", office: "U.S. Senate (Special)", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 5, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former Senator; has supported clean energy manufacturing. Mixed fossil fuel record for Ohio.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/sherrod-brown/industries?cid=N00003374&cycle=2024",
    opponent: "Jon Husted (R)",
  },
  {
    id: 7, name: "Jon Husted", state: "Ohio", office: "U.S. Senate (Special)", party: "R",
    incumbentStatus: "incumbent (appointed)", raceCompetitiveness: "Lean R",
    primaryDate: "May 5, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Appointed by Gov. DeWine. Supportive of Ohio energy sector including natural gas.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SOH2026",
    opponent: "Sherrod Brown (D)",
  },
  {
    id: 8, name: "Ashley Hinson", state: "Iowa", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Likely R",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Congresswoman. Supports wind energy (Iowa is major wind state). Opposed carbon pricing.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/ashley-hinson/industries?cid=N00044544&cycle=2024",
    opponent: "D primary: Zach Wahls (leading), Josh Turek",
  },
  {
    id: 9, name: "John Cornyn", state: "Texas", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Likely R",
    primaryDate: "Mar 3, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Strongly pro-oil & gas. Opposed IRA, climate regulations. Supported LNG exports.",
    fossilFuelDonations: "high",
    fossilFuelAmount: "$4,067,906", fossilFuelCycle: "Career total (through 2020)",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/john-cornyn/industries?cid=N00024852",
    opponent: "James Talarico (D); Cornyn in R runoff vs. Ken Paxton (May 26)",
  },
  {
    id: 10, name: "Mark Warner", state: "Virginia", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Voted for IRA. Supports offshore wind off Virginia coast. Climate-focused record.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/mark-warner/industries?cid=N00002097&cycle=2026",
    opponent: "David Williams (R)",
  },
  {
    id: 11, name: "Cory Booker", state: "New Jersey", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Strong climate champion. Co-sponsored Green New Deal. Advocates environmental justice.",
    fossilFuelDonations: "low",
    fossilFuelAmount: "$0", fossilFuelCycle: "Ongoing",
    fossilFuelSource: "https://nofossilfuelmoney.org/pledges/",
    opponent: "R primary: Alex Zdan (leading), Justin Murphy",
  },
  {
    id: 12, name: "William Cassidy", state: "Louisiana", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Safe R",
    primaryDate: "Nov 3, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Has acknowledged climate science. Supported some coastal restoration. Strong oil & gas ties.",
    fossilFuelDonations: "high",
    fossilFuelAmount: "$1,554,805", fossilFuelCycle: "Career total (through 2020)",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/bill-cassidy/industries?cid=N00030245",
    opponent: "Julia Letlow (R primary); D primary: Jamie Davis, Nick Albares",
  },
  {
    id: 13, name: "Ben Ray Luján", state: "New Mexico", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Voted for IRA. Advocates clean energy transition while balancing New Mexico oil economy. Pledged not to take fossil fuel exploration money.",
    fossilFuelDonations: "low",
    fossilFuelAmount: "$0 (fossil fuel exploration)", fossilFuelCycle: "Pledge since 2019",
    fossilFuelSource: "https://readsludge.com/2019/04/19/democratic-leader-ben-ray-lujan-endorses-green-new-deal-wont-take-fossil-fuel-exploration-money/",
    opponent: "No Republican on ballot (disqualified); D primary challenger: Matt Dodson",
  },
  {
    id: 14, name: "Mary Peltola", state: "Alaska", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Likely R",
    primaryDate: "Aug 25, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former Rep. Supported some resource development while emphasizing environmental protection for Alaska communities.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/mary-peltola/industries?cid=N00050780&cycle=2024",
    opponent: "Dan Sullivan (R, incumbent)",
  },
  // === FLORIDA SPECIAL ===
  {
    id: 15, name: "Ashley Moody", state: "Florida", office: "U.S. Senate (Special)", party: "R",
    incumbentStatus: "incumbent (appointed)", raceCompetitiveness: "Lean R",
    primaryDate: "Aug 18, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Appointed AG turned Senator. Florida faces major climate threats (sea level, hurricanes). Limited proactive climate record.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SFL2026",
    opponent: "Alexander Vindman (D)",
  },
  {
    id: 16, name: "Alexander Vindman", state: "Florida", office: "U.S. Senate (Special)", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "Aug 18, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "National security focus. Has cited climate as a national security threat. No detailed legislative climate record.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SFL2026",
    opponent: "Ashley Moody (R)",
  },
  // === OPEN SEATS ===
  {
    id: 17, name: "John E. Sununu", state: "New Hampshire", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean D",
    primaryDate: "Sept 8, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Former Senator. Generally skeptical of climate regulations. Opposes carbon taxes.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SNH2026",
    opponent: "Chris Pappas (D)",
  },
  {
    id: 18, name: "Dan Osborn", state: "Nebraska", office: "U.S. Senate", party: "I",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R",
    primaryDate: "May 12, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null,
    knownPositions: "Independent. Ran strong race in 2024. Labor-focused. Climate position not prominently defined.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SNE2026",
    opponent: "Pete Ricketts (R, incumbent)",
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

const ISSUE_FILTERS = [
  {
    category: "Energy & Climate",
    issues: [
      { value: "clean-energy",   label: "Clean energy transition" },
      { value: "fossil-fuel",    label: "Fossil fuel policy" },
      { value: "carbon-pricing", label: "Carbon pricing" },
      { value: "nuclear",        label: "Nuclear energy" },
      { value: "grid",           label: "Energy grid modernization" },
      { value: "buildings",      label: "Building decarbonization" },
    ],
  },
  {
    category: "Transportation",
    issues: [
      { value: "ev",      label: "Electric vehicles" },
      { value: "transit", label: "Public transit" },
      { value: "aviation",label: "Aviation & shipping" },
    ],
  },
  {
    category: "Land, Water & Ecosystems",
    issues: [
      { value: "public-lands",  label: "Public lands" },
      { value: "water",         label: "Water rights & quality" },
      { value: "forests",       label: "Deforestation & reforestation" },
      { value: "biodiversity",  label: "Biodiversity & endangered species" },
      { value: "agriculture",   label: "Agriculture & soil" },
      { value: "ocean",         label: "Ocean policy" },
    ],
  },
  {
    category: "Pollution & Public Health",
    issues: [
      { value: "air-quality", label: "Air quality" },
      { value: "chemicals",   label: "Chemical regulation" },
      { value: "plastics",    label: "Plastic pollution" },
      { value: "env-justice", label: "Environmental justice" },
    ],
  },
  {
    category: "Climate Adaptation & Resilience",
    issues: [
      { value: "flooding",     label: "Flood & sea level rise" },
      { value: "wildfire",     label: "Wildfire policy" },
      { value: "drought-heat", label: "Drought & heat" },
      { value: "disaster",     label: "Disaster resilience" },
    ],
  },
  {
    category: "International & Finance",
    issues: [
      { value: "paris",           label: "Paris Agreement" },
      { value: "climate-finance", label: "Climate finance" },
      { value: "methane",         label: "Methane regulation" },
      { value: "offsets",         label: "Carbon offsets & markets" },
    ],
  },
  {
    category: "Governance & Policy",
    issues: [
      { value: "epa",         label: "EPA authority" },
      { value: "ira",         label: "Inflation Reduction Act" },
      { value: "gnd",         label: "Green New Deal" },
      { value: "nepa",        label: "Environmental review (NEPA)" },
      { value: "disclosure",  label: "Climate disclosure" },
    ],
  },
];

const COMPARE_ISSUES = [
  { value: "Overall Climate Record", label: "Overall" },
  { value: "Clean Energy", label: "Clean Energy" },
  { value: "Fossil Fuels", label: "Fossil Fuels" },
  { value: "Carbon Pricing", label: "Carbon Pricing" },
  { value: "Environmental Justice", label: "Environmental Justice" },
  { value: "Land & Water", label: "Land & Water" },
  { value: "Transportation", label: "Transportation" },
  { value: "Pollution & Health", label: "Pollution & Health" },
  { value: "Climate Resilience", label: "Climate Resilience" },
];

const STATUS_STYLE = {
  nominee:   { bg: "#0a2a0a", color: "#27ae60", border: "#27ae6055", label: "NOMINEE" },
  withdrew:  { bg: "#1a1a1a", color: "#666",    border: "#44444455", label: "WITHDREW" },
  eliminated:{ bg: "#1a1a1a", color: "#666",    border: "#44444455", label: "ELIMINATED" },
  declared:  { bg: "#0a1a2a", color: "#5ba3d9", border: "#5ba3d944", label: "DECLARED" },
}

// Today's date string for filing deadline comparison (computed once)
const TODAY = new Date().toISOString().slice(0, 10);

const FILING_DEADLINES = {
  Alaska:          "2026-06-01",
  Florida:         "2026-05-08",
  Georgia:         "2026-03-06",
  Iowa:            "2026-03-13",
  Louisiana:       "2026-08-14",
  Maine:           "2026-03-15",
  Nebraska:        "2026-03-02",
  "New Hampshire": "2026-06-12",
  "New Jersey":    "2026-04-06",
  "New Mexico":    "2026-03-10",
  "North Carolina":"2025-12-19",
  Ohio:            "2026-02-20",
  Texas:           "2025-12-09",
  Virginia:        "2026-03-26",
};

function filingOpen(state) {
  const dl = FILING_DEADLINES[state];
  return dl ? TODAY <= dl : false;
}

function StatusBadge({ candidate }) {
  const status = candidate.candidacyStatus ?? "declared";
  if (status === "nominee") {
    const s = STATUS_STYLE.nominee;
    return (
      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
        fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
        ★ {s.label}
      </span>
    );
  }
  if (status === "withdrew" || status === "eliminated") {
    const s = STATUS_STYLE[status];
    return (
      <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
        fontFamily: "'DM Mono', monospace", letterSpacing: 1, textDecoration: "line-through" }}>
        {s.label}
      </span>
    );
  }
  if (status === "declared" && filingOpen(candidate.state)) {
    return (
      <span style={{ background: "#1a1500", color: "#e6b800", border: "1px solid #e6b80044",
        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
        fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
        FILING OPEN
      </span>
    );
  }
  return null; // no badge for plain declared + filing closed
}

function ScoreBadge({ score }) {
  if (score === null) return (
    <span style={{ background: "var(--bg-badge-na)", color: "var(--badge-na-color)", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontFamily: "monospace" }}>
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

function CandidateCard({ candidate, onAnalyze, analyzing, onCompare }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
      overflow: "hidden", transition: "border-color 0.2s",
      borderLeft: `4px solid ${PARTY_COLOR[candidate.party]}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      <div style={{ padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: "var(--text-1)", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
                {candidate.name}
              </span>
              <span style={{
                background: PARTY_COLOR[candidate.party], color: "#fff",
                padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 1
              }}>
                {PARTY_LABEL[candidate.party]}
              </span>
              {candidate.officeType === "governor" && (
                <span style={{ background: "#1a0a2a", color: "#a87fd4", border: "1px solid #a87fd444", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                  GOV
                </span>
              )}
              {candidate.incumbentStatus.includes("incumbent") && (
                <span style={{ background: "var(--bg-elevated)", color: "var(--text-5)", border: "1px solid var(--border-strong)", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                  {candidate.incumbentStatus === "incumbent (appointed)" ? "Appointed" : "Incumbent"}
                </span>
              )}
              <StatusBadge candidate={candidate} />
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
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
            <span style={{ color: "var(--text-dim)", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border-mid)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16 }}>
            <div style={{ background: "var(--bg-inner)", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>PRIMARY DATE</div>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>{candidate.primaryDate}</div>
            </div>
            <div style={{ background: "var(--bg-inner)", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>GENERAL ELECTION</div>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>{candidate.generalDate}</div>
            </div>
            {candidate.opponent && (
              <div style={{ background: "var(--bg-inner)", borderRadius: 8, padding: 12 }}>
                <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>OPPONENT</div>
                <div style={{ color: "var(--text-2)", fontSize: 13 }}>{candidate.opponent}</div>
              </div>
            )}
            <div style={{ background: "var(--bg-inner)", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>FOSSIL FUEL $</div>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>
                {FOSSIL_ICON[candidate.fossilFuelDonations]}{" "}
                {candidate.fossilFuelAmount ?? candidate.fossilFuelDonations}
              </div>
              {candidate.fossilFuelCycle && (
                <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>
                  {candidate.fossilFuelCycle}
                </div>
              )}
              {candidate.fossilFuelSource && (
                <a href={candidate.fossilFuelSource} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--accent)", fontSize: 11, fontFamily: "'DM Mono', monospace", textDecoration: "none", display: "block", marginTop: 4 }}>
                  Source ↗
                </a>
              )}
            </div>
          </div>

          <div style={{ background: "var(--bg-inner)", borderRadius: 8, padding: 12, marginTop: 12 }}>
            <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>KNOWN CLIMATE POSITIONS</div>
            <div style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.6 }}>{candidate.knownPositions}</div>
          </div>

          {candidate.climateAnalysis && (
            <div style={{ background: "var(--bg-analysis)", border: "1px solid var(--border-analysis)", borderRadius: 8, padding: 14, marginTop: 12 }}>
              <div style={{ color: "var(--analysis-label)", fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                ✦ AI CLIMATE ANALYSIS
              </div>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7, margin: "6px 0" }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ color: "var(--text-2)" }}>{children}</strong>,
                  ul: ({ children }) => <ul style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7, paddingLeft: 18, margin: "6px 0" }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7, paddingLeft: 18, margin: "6px 0" }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                  h1: ({ children }) => <h1 style={{ color: "var(--text-1)", fontSize: 15, margin: "10px 0 4px" }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ color: "var(--text-1)", fontSize: 14, margin: "10px 0 4px" }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ color: "var(--text-3)", fontSize: 13, margin: "8px 0 4px" }}>{children}</h3>,
                }}
              >
                {candidate.climateAnalysis}
              </ReactMarkdown>
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => onAnalyze(candidate)}
              disabled={analyzing === candidate.id}
              style={{
                background: analyzing === candidate.id ? "var(--bg-btn-analyze-act)" : "var(--bg-btn-analyze)",
                color: analyzing === candidate.id ? "var(--btn-analyze-dis)" : "var(--btn-analyze-color)",
                border: "1px solid var(--accent-btn-border)",
                padding: "8px 18px", borderRadius: 6, cursor: analyzing === candidate.id ? "not-allowed" : "pointer",
                fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
                transition: "all 0.2s"
              }}
            >
              {analyzing === candidate.id ? "⟳ Analyzing..." : "✦ Run Climate Analysis"}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onCompare(candidate); }}
              style={{
                background: "var(--bg-btn-compare)", color: "var(--btn-compare-color)",
                border: "1px solid var(--btn-compare-border)",
                padding: "8px 18px", borderRadius: 6, cursor: "pointer",
                fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
                transition: "all 0.2s"
              }}
            >
              ⊕ Compare with Opponents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareModal({ primary, opponents, onClose, cache, onCacheUpdate }) {
  const [selectedOpponentId, setSelectedOpponentId] = useState(opponents[0]?.id);
  const [issue, setIssue] = useState(COMPARE_ISSUES[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const opponent = opponents.find(o => o.id === selectedOpponentId) || opponents[0];
  const c1 = primary;
  const c2 = opponent;

  const cacheKey = c2 ? `${Math.min(c1.id, c2.id)}-${Math.max(c1.id, c2.id)}-${issue}` : null;

  const runComparison = async () => {
    if (!c2) return;
    if (cache[cacheKey]) { setResult(cache[cacheKey]); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await compareCandiates(c1, c2, issue);
      onCacheUpdate(cacheKey, data);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const winnerIsC1 = result?.winner === c1.name;
  const winnerIsC2 = result?.winner === c2?.name;
  const isTie = result?.winner === "Tie";

  const panelStyle = (isWinner) => ({
    flex: 1, background: isWinner ? "var(--bg-winner)" : "var(--bg-inner)",
    border: `1px solid ${isWinner ? "var(--border-winner)" : "var(--border-mid)"}`,
    borderRadius: 10, padding: 20,
  });

  const scoreColor = s => s >= 70 ? "#27ae60" : s >= 40 ? "#e67e22" : s != null ? "#c0392b" : "var(--text-dim)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "var(--overlay)", display: "flex", alignItems: "flex-start",
      justifyContent: "center", overflowY: "auto", padding: "32px 16px",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--bg-modal)", border: "1px solid var(--border)", borderRadius: 16,
        width: "100%", maxWidth: 900, padding: 32, position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)", color: "var(--close-color)", borderRadius: 6,
          padding: "4px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Mono', monospace",
        }}>Close</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>
            CANDIDATE COMPARISON
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Primary candidate */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>PRIMARY</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--text-1)" }}>{c1.name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                {c1.state} · {PARTY_LABEL[c1.party]}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  background: scoreColor(c1.climateScore), color: "#fff",
                  padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace"
                }}>
                  {c1.climateScore != null ? `${c1.climateScore}/100` : "Not Analyzed"}
                </span>
              </div>
            </div>
            {/* Opponent selector */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>OPPONENT</div>
              {opponents.length > 1 ? (
                <select
                  value={selectedOpponentId}
                  onChange={e => { setSelectedOpponentId(Number(e.target.value)); setResult(null); setError(null); }}
                  style={{
                    background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)",
                    padding: "6px 10px", borderRadius: 6, fontSize: 14,
                    fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none", marginBottom: 6,
                  }}
                >
                  {opponents.map(o => <option key={o.id} value={o.id}>{o.name} ({PARTY_LABEL[o.party]})</option>)}
                </select>
              ) : (
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--text-1)" }}>{c2?.name}</div>
              )}
              {c2 && (
                <>
                  <div style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                    {c2.state} · {PARTY_LABEL[c2.party]}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      background: scoreColor(c2.climateScore), color: "#fff",
                      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace"
                    }}>
                      {c2.climateScore != null ? `${c2.climateScore}/100` : "Not Analyzed"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Issue selector */}
        {c2 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1 }}>ISSUE:</span>
            <select
              value={issue}
              onChange={e => { setIssue(e.target.value); setResult(null); setError(null); }}
              style={{
                background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)",
                padding: "8px 12px", borderRadius: 6, fontSize: 13,
                fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none",
              }}
            >
              {COMPARE_ISSUES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
            <button onClick={runComparison} disabled={loading} style={{
              background: loading ? "var(--bg-btn-analyze-act)" : "var(--bg-btn-analyze)",
              color: loading ? "var(--btn-analyze-dis)" : "var(--btn-analyze-color)",
              border: "1px solid var(--accent-btn-border)", padding: "8px 18px", borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer", fontSize: 13,
              fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
            }}>
              {loading ? "⟳ Running..." : cacheKey && cache[cacheKey] ? "✦ Cached — Re-run" : "✦ Run AI Comparison"}
            </button>
            {cacheKey && cache[cacheKey] && !loading && result && (
              <span style={{ color: "var(--text-deep)", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>From cache</span>
            )}
          </div>
        )}

        {/* Known positions side-by-side */}
        {c2 && (
          <div style={{ display: "flex", gap: 12, marginBottom: result || error ? 20 : 0 }}>
            {[c1, c2].map(c => (
              <div key={c.id} style={{ flex: 1, background: "var(--bg-inner)", border: "1px solid var(--border-mid)", borderRadius: 8, padding: 14 }}>
                <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
                  {c.name.toUpperCase()} — KNOWN POSITIONS
                </div>
                <div style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.6 }}>{c.knownPositions}</div>
              </div>
            ))}
          </div>
        )}
        {!c2 && (
          <div style={{ background: "var(--bg-no-opp)", border: "1px solid var(--border-no-opp)", borderRadius: 6, padding: "10px 14px", color: "var(--no-opp-color)", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
            No tracked opponents found for this candidate in the same race.
          </div>
        )}

        {error && (
          <div style={{ background: "var(--bg-error)", border: "1px solid var(--border-error)", borderRadius: 6, padding: "10px 14px", color: "var(--error-color)", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
            {error}
          </div>
        )}

        {result && (
          <div>
            {/* Winner banner */}
            <div style={{
              background: isTie ? "var(--bg-tie)" : "var(--bg-winner)",
              border: `1px solid ${isTie ? "var(--border-tie)" : "var(--border-winner)"}`,
              borderRadius: 8, padding: "12px 16px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>{isTie ? "⚖️" : "🏆"}</span>
              <div>
                <div style={{ color: isTie ? "#e67e22" : "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1 }}>
                  {isTie ? "TIE" : "STRONGER RECORD"}
                </div>
                <div style={{ color: "var(--text-2)", fontSize: 14, marginTop: 2 }}>
                  <strong>{result.winner}</strong> — {result.winnerReason}
                </div>
              </div>
            </div>

            {/* Side-by-side positions */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <div style={panelStyle(winnerIsC1)}>
                <div style={{ color: winnerIsC1 ? "var(--accent)" : "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                  {winnerIsC1 ? "🏆 " : ""}{c1.name.toUpperCase()}
                </div>
                <div style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7 }}>{result.candidate1Position}</div>
              </div>
              <div style={panelStyle(winnerIsC2)}>
                <div style={{ color: winnerIsC2 ? "var(--accent)" : "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                  {winnerIsC2 ? "🏆 " : ""}{c2.name.toUpperCase()}
                </div>
                <div style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7 }}>{result.candidate2Position}</div>
              </div>
            </div>

            {/* Key difference */}
            <div style={{ background: "var(--bg-inner)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>KEY DIFFERENCE</div>
              <div style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.6 }}>{result.keyDifference}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClimateTracker({ initialCandidates }) {
  const [candidates, setCandidates] = useState(initialCandidates ?? CANDIDATES);
  const [analyzing, setAnalyzing] = useState(null);
  const [filter, setFilter] = useState({ party: "all", state: "", competitiveness: "all", analyzed: "all", issue: "all", search: "", officeType: "all" });
  const [globalError, setGlobalError] = useState(null);
  const [compareCandidate, setCompareCandidate] = useState(null);
  const [compareCache, setCompareCache] = useState({});
  const [dark, setDark] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);

  // Show admin controls when URL contains ?admin=true
  const isAdmin = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("admin") === "true";

  const runSync = async () => {
    const secret = prompt("Enter sync secret:");
    if (!secret) return;
    setSyncing(true);
    setSyncToast(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "x-sync-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncToast({ ok: true, message: data.message || "Sync complete" });
      // Refresh candidate list after sync
      const updated = await fetch("/api/candidates").then(r => r.json());
      if (updated.candidates) setCandidates(updated.candidates);
    } catch (err) {
      setSyncToast({ ok: false, message: err.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncToast(null), 6000);
    }
  };

  const getOpponents = (candidate) =>
    candidates.filter(c => c.state === candidate.state && c.office === candidate.office && c.id !== candidate.id);

  const states = [...new Set(candidates.map(c => c.state))].sort();
  const competitive = [...new Set(candidates.map(c => c.raceCompetitiveness))];

  const filtered = candidates.filter(c => {
    if (filter.officeType !== "all" && (c.officeType ?? "us_senate") !== filter.officeType) return false;
    if (filter.party !== "all" && c.party !== filter.party) return false;
    if (filter.state && c.state !== filter.state) return false;
    if (filter.competitiveness !== "all" && c.raceCompetitiveness !== filter.competitiveness) return false;
    if (filter.analyzed === "yes" && c.climateScore === null) return false;
    if (filter.analyzed === "no" && c.climateScore !== null) return false;
    if (filter.issue !== "all" && !c.issues?.includes(filter.issue)) return false;
    if (filter.search && !c.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    const lastName = name => name.split(" ").at(-1);
    return lastName(a.name).localeCompare(lastName(b.name));
  });

  const analyzeCandidate = async (candidate) => {
    setAnalyzing(candidate.id);
    setGlobalError(null);
    try {
      const { text, score, issues } = await fetchAnalysis(candidate);

      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, climateScore: score, climateAnalysis: text, issues }
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

  const senateCandidates = candidates.filter(c => (c.officeType ?? "us_senate") !== "governor");
  const govCandidates = candidates.filter(c => c.officeType === "governor");
  const senateAnalyzed = senateCandidates.filter(c => c.climateScore !== null).length;
  const govAnalyzed = govCandidates.filter(c => c.climateScore !== null).length;
  const analyzedCount = candidates.filter(c => c.climateScore !== null).length;
  const avgScore = analyzedCount > 0
    ? Math.round(candidates.filter(c => c.climateScore !== null).reduce((a, c) => a + c.climateScore, 0) / analyzedCount)
    : null;

  const selectStyle = {
    background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)",
    padding: "8px 12px", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none"
  };

  return (
    <div data-theme={dark ? "dark" : "light"} style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-1)", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sync toast */}
      {syncToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 300,
          background: syncToast.ok ? "var(--bg-analysis)" : "var(--bg-error)",
          border: `1px solid ${syncToast.ok ? "var(--border-analysis)" : "var(--border-error)"}`,
          color: syncToast.ok ? "var(--accent)" : "var(--error-color)",
          borderRadius: 8, padding: "12px 18px", fontSize: 13,
          fontFamily: "'DM Mono', monospace", maxWidth: 360, boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}>
          {syncToast.ok ? "✦ " : "✗ "}{syncToast.message}
        </div>
      )}
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border-mid)", padding: "24px 32px", background: "var(--bg-page)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>🌿</span>
                <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
                  Climate Candidate Tracker
                </h1>
              </div>
              <p style={{ margin: "6px 0 0 40px", color: "var(--text-dim)", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
                2026 U.S. Primaries & Midterm Elections · AI-Powered Analysis
              </p>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              {[
                { label: "Senate", value: senateCandidates.length, sub: `${senateAnalyzed} analyzed` },
                { label: "Governor", value: govCandidates.length, sub: `${govAnalyzed} analyzed` },
                { label: "Avg Score", value: avgScore !== null ? `${avgScore}/100` : "—", sub: `${analyzedCount} total analyzed` },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500 }}>{value}</div>
                  <div style={{ color: "var(--text-deep)", fontSize: 11, letterSpacing: 1 }}>{label}</div>
                  {sub && <div style={{ color: "var(--text-ghost)", fontSize: 10, letterSpacing: 0.5 }}>{sub}</div>}
                </div>
              ))}
              <button
                onClick={() => setDark(d => !d)}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  background: "var(--toggle-bg)", border: "1px solid var(--toggle-border)",
                  color: "var(--toggle-color)", borderRadius: 8, padding: "8px 12px",
                  cursor: "pointer", fontSize: 16, lineHeight: 1, marginLeft: 8,
                }}
              >
                {dark ? "☀️" : "🌙"}
              </button>
              {isAdmin && (
                <button
                  onClick={runSync}
                  disabled={syncing}
                  title="Sync candidates from Ballotpedia (admin only)"
                  style={{
                    background: "var(--toggle-bg)", border: "1px solid var(--toggle-border)",
                    color: syncing ? "var(--text-dim)" : "var(--accent)", borderRadius: 8,
                    padding: "8px 12px", cursor: syncing ? "not-allowed" : "pointer",
                    fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, marginLeft: 4,
                  }}
                >
                  {syncing ? "⟳ Syncing…" : "↻ Sync"}
                </button>
              )}
            </div>
          </div>

          {/* Office type tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: "1px solid var(--border)" }}>
            {[["all", "All Offices"], ["us_senate", "U.S. Senate"], ["governor", "Governor"]].map(([val, label]) => {
              const active = filter.officeType === val;
              return (
                <button key={val} onClick={() => setFilter(f => ({ ...f, officeType: val }))} style={{
                  padding: "8px 20px", background: "none", border: "none", borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  color: active ? "var(--accent)" : "var(--text-muted)", fontFamily: "'DM Mono', monospace", fontSize: 12,
                  fontWeight: active ? 600 : 400, letterSpacing: 0.5, cursor: "pointer", marginBottom: -1, transition: "color 0.15s",
                }}>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Row 1: Filter dropdowns */}
          <div className="filter-row">
            <select style={selectStyle} value={filter.issue} onChange={e => setFilter(f => ({ ...f, issue: e.target.value }))}>
              <option value="all">All Issues</option>
              {ISSUE_FILTERS.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.issues.map(issue => (
                    <option key={issue.value} value={issue.value}>{issue.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
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
          </div>

          {/* Row 2: Search + Analyze All */}
          <div className="filter-actions-row">
            <input
              type="text"
              placeholder="Search by name..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="filter-search"
              style={{
                background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)",
                padding: "8px 12px", borderRadius: 6, fontSize: 13,
                fontFamily: "'DM Mono', monospace", outline: "none",
              }}
            />
            <button
              className="filter-analyze"
              onClick={analyzeAll}
              disabled={analyzing !== null}
              style={{
                background: "var(--bg-btn-analyze)", color: "var(--btn-analyze-color)", border: "1px solid var(--accent-btn-border)",
                padding: "8px 16px", borderRadius: 6, cursor: analyzing ? "not-allowed" : "pointer",
                fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, whiteSpace: "nowrap",
              }}
            >
              ✦ Analyze All Visible ({filtered.filter(c => c.climateScore === null).length})
            </button>
          </div>

          {globalError && (
            <div style={{ marginTop: 12, background: "var(--bg-error)", border: "1px solid var(--border-error)", borderRadius: 6, padding: "10px 14px", color: "var(--error-color)", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
              {globalError}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-deep)", fontSize: 12, fontFamily: "'DM Mono', monospace", alignSelf: "center" }}>SCORE:</span>
          {[["≥70 Strong", "#27ae60"], ["40–69 Mixed", "#e67e22"], ["<40 Weak", "#c0392b"], ["Not Analyzed", "var(--text-deep)"]].map(([label, color]) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
              {label}
            </span>
          ))}
        </div>

        <div style={{ color: "var(--text-deep)", fontSize: 12, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          SHOWING {filtered.length} OF {candidates.length} CANDIDATES
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(c => (
            <CandidateCard key={c.id} candidate={c} onAnalyze={analyzeCandidate} analyzing={analyzing}
              onCompare={setCompareCandidate} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-ghost)", fontFamily: "'DM Mono', monospace" }}>
            No candidates match your filters.
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-mid)", color: "var(--text-ghost)", fontSize: 12, fontFamily: "'DM Mono', monospace", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 6, color: "var(--text-deep)" }}>DATA SOURCES & METHODOLOGY</div>
          Candidate data sourced from Wikipedia, Ballotpedia, and news reporting (as of March 2026). AI analysis powered by Claude (Anthropic). Scores reflect climate policy alignment with scientific consensus — not party affiliation. Race competitiveness ratings from Cook Political Report / Sabato&apos;s Crystal Ball. Fossil fuel donation levels are indicative estimates pending FEC data integration. This tracker is for informational purposes; always verify with primary sources.
        </div>
      </div>

      {compareCandidate && (
        <CompareModal
          primary={compareCandidate}
          opponents={getOpponents(compareCandidate)}
          onClose={() => setCompareCandidate(null)}
          cache={compareCache}
          onCacheUpdate={(key, data) => setCompareCache(prev => ({ ...prev, [key]: data }))}
        />
      )}
    </div>
  );
}
