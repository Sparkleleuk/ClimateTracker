import { useState } from "react";
import dynamic from "next/dynamic";
import { analyzeCandidate as fetchAnalysis } from "../services/climateApi";
import { compareCandiates } from "../services/compareApi";
import ReactMarkdown from "react-markdown";
import { getDataCenterInfo } from "../lib/data/dataCenterDistricts.js";
import { AI_DIMENSIONS } from "../lib/constants/aiDimensions.js";

const DistrictMap = dynamic(() => import("./DistrictMap"), { ssr: false });

const CANDIDATES = [
  // === SENATE - COMPETITIVE RACES ===
  {
    id: 1, name: "Susan Collins", state: "Maine", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Toss-Up",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
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
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Voted for IRA. Supports clean energy investment and EV manufacturing in Georgia.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/jon-ossoff/industries?cid=N00040675&cycle=2026",
    opponent: "R primary: Mike Collins, Buddy Carter, Derek Dooley",
  },
  {
    id: 3, name: "Roy Cooper", state: "North Carolina", office: "U.S. Senate", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R", candidacyStatus: "nominee",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "As Governor signed executive orders on clean energy; set 2050 carbon neutrality goals for NC.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SNC2026",
    opponent: "Michael Whatley (R)",
  },
  {
    id: 4, name: "Michael Whatley", state: "North Carolina", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R", candidacyStatus: "nominee",
    primaryDate: "May 19, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
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
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "As Maine Governor, set 100% clean electricity goal by 2040. Strong environmental record.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SME2026",
    opponent: "Susan Collins (R)",
  },
  {
    id: 6, name: "Sherrod Brown", state: "Ohio", office: "U.S. Senate (Special)", party: "D",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R", candidacyStatus: "nominee",
    primaryDate: "May 5, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Former Senator; has supported clean energy manufacturing. Mixed fossil fuel record for Ohio.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/sherrod-brown/industries?cid=N00003374&cycle=2024",
    opponent: "Jon Husted (R)",
  },
  {
    id: 7, name: "Jon Husted", state: "Ohio", office: "U.S. Senate (Special)", party: "R",
    incumbentStatus: "incumbent (appointed)", raceCompetitiveness: "Lean R", candidacyStatus: "nominee",
    primaryDate: "May 5, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Appointed by Gov. DeWine. Supportive of Ohio energy sector including natural gas.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SOH2026",
    opponent: "Sherrod Brown (D)",
  },
  {
    id: 8, name: "Ashley Hinson", state: "Iowa", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Likely R", candidacyStatus: "nominee",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Congresswoman. Supports wind energy (Iowa is major wind state). Opposed carbon pricing.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/ashley-hinson/industries?cid=N00044544&cycle=2024",
    opponent: "Josh Turek (D)",
  },
  {
    id: 9, name: "John Cornyn", state: "Texas", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Likely R", candidacyStatus: "nominee",
    primaryDate: "Mar 3, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Strongly pro-oil & gas. Opposed IRA, climate regulations. Supported LNG exports.",
    fossilFuelDonations: "high",
    fossilFuelAmount: "$4,067,906", fossilFuelCycle: "Career total (through 2020)",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/john-cornyn/industries?cid=N00024852",
    opponent: "James Talarico (D)",
  },
  {
    id: 10, name: "Mark Warner", state: "Virginia", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D",
    primaryDate: "June 9, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Voted for IRA. Supports offshore wind off Virginia coast. Climate-focused record.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/mark-warner/industries?cid=N00002097&cycle=2026",
    opponent: "David Williams (R)",
  },
  {
    id: 11, name: "Cory Booker", state: "New Jersey", office: "U.S. Senate", party: "D",
    incumbentStatus: "incumbent", raceCompetitiveness: "Lean D", candidacyStatus: "nominee",
    primaryDate: "June 2, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Strong climate champion. Co-sponsored Green New Deal. Advocates environmental justice.",
    fossilFuelDonations: "low",
    fossilFuelAmount: "$0", fossilFuelCycle: "Ongoing",
    fossilFuelSource: "https://nofossilfuelmoney.org/pledges/",
    opponent: "Justin Murphy (R)",
  },
  {
    id: 12, name: "William Cassidy", state: "Louisiana", office: "U.S. Senate", party: "R",
    incumbentStatus: "incumbent", raceCompetitiveness: "Safe R",
    primaryDate: "Nov 3, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
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
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
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
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Former Rep. Supported some resource development while emphasizing environmental protection for Alaska communities.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/members-of-congress/mary-peltola/industries?cid=N00050780&cycle=2024",
    opponent: "Dan Sullivan (R, incumbent)",
  },
  {
    id: 15, name: "Ashley Moody", state: "Florida", office: "U.S. Senate (Special)", party: "R",
    incumbentStatus: "incumbent (appointed)", raceCompetitiveness: "Lean R",
    primaryDate: "Aug 18, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
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
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "National security focus. Has cited climate as a national security threat. No detailed legislative climate record.",
    fossilFuelDonations: "low",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SFL2026",
    opponent: "Ashley Moody (R)",
  },
  {
    id: 17, name: "John E. Sununu", state: "New Hampshire", office: "U.S. Senate", party: "R",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean D",
    primaryDate: "Sept 8, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    knownPositions: "Former Senator. Generally skeptical of climate regulations. Opposes carbon taxes.",
    fossilFuelDonations: "moderate",
    fossilFuelAmount: null, fossilFuelCycle: "2026 cycle",
    fossilFuelSource: "https://www.opensecrets.org/races/industries?id=SNH2026",
    opponent: "Chris Pappas (D)",
  },
  {
    id: 18, name: "Dan Osborn", state: "Nebraska", office: "U.S. Senate", party: "I",
    incumbentStatus: "challenger", raceCompetitiveness: "Lean R", candidacyStatus: "nominee",
    primaryDate: "May 12, 2026", generalDate: "Nov 3, 2026",
    climateScore: null, climateAnalysis: null, aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
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

const AI_COMPARE_ISSUES = [
  { value: "datacenters_energy",        label: "Overall AI Policy" },
  { value: "datacenters_energy",        label: "Data Center Energy Requirements" },
  { value: "water_usage",              label: "Water Usage Policy" },
  { value: "grid_impact",              label: "Grid Impact" },
  { value: "ai_safety",                label: "AI Safety & Oversight" },
  { value: "algorithmic_accountability",label: "Algorithmic Accountability" },
  { value: "ai_elections",             label: "AI in Elections" },
  { value: "ai_economic",              label: "AI Economic Policy" },
].filter((v, i, a) => a.findIndex(x => x.label === v.label) === i); // dedupe

const STATUS_STYLE = {
  nominee:   { bg: "#0a2a0a", color: "#27ae60", border: "#27ae6055", label: "NOMINEE" },
  withdrew:  { bg: "#1a1a1a", color: "#666",    border: "#44444455", label: "WITHDREW" },
  eliminated:{ bg: "#1a1a1a", color: "#666",    border: "#44444455", label: "ELIMINATED" },
  declared:  { bg: "#0a1a2a", color: "#5ba3d9", border: "#5ba3d944", label: "DECLARED" },
};

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

// ─── StatusBadge ─────────────────────────────────────────────────────────────

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
  return null;
}

// ─── Score badges ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  if (score === null) return (
    <span style={{ background: "var(--bg-badge-na)", color: "var(--badge-na-color)",
      padding: "3px 8px", borderRadius: 20, fontSize: 11, fontFamily: "monospace",
      display: "inline-flex", alignItems: "center", gap: 4 }}>
      🌿 <span>NOT ANALYZED</span>
    </span>
  );
  const color = score >= 70 ? "#27ae60" : score >= 40 ? "#e67e22" : "#c0392b";
  return (
    <span style={{ background: color, color: "#fff", padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, fontFamily: "monospace",
      display: "inline-flex", alignItems: "center", gap: 4 }}>
      🌿 <span>{score}/100</span>
    </span>
  );
}

function AIPolicyScoreBadge({ score }) {
  if (score === null) return (
    <span style={{ background: "#0a1525", color: "#5b8fc9", border: "1px solid #2980b922",
      padding: "3px 8px", borderRadius: 20, fontSize: 11, fontFamily: "monospace",
      display: "inline-flex", alignItems: "center", gap: 4 }}>
      ⚡ <span>NOT ANALYZED</span>
    </span>
  );
  const color = score >= 70 ? "#2980b9" : score >= 40 ? "#e67e22" : "#c0392b";
  return (
    <span style={{ background: color, color: "#fff", padding: "3px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, fontFamily: "monospace",
      display: "inline-flex", alignItems: "center", gap: 4 }}>
      ⚡ <span>{score}/100</span>
    </span>
  );
}

// ─── DimensionBars ────────────────────────────────────────────────────────────

const DIM_LIST = [
  ["datacenters_energy",         "Data Center Energy"],
  ["water_usage",                "Water Usage"],
  ["grid_impact",                "Grid Impact"],
  ["ai_safety",                  "AI Safety"],
  ["algorithmic_accountability", "Algorithmic Account."],
  ["ai_elections",               "AI in Elections"],
  ["ai_economic",                "AI Economic Policy"],
];

function DimensionBars({ dimensions }) {
  if (!dimensions) return null;
  return (
    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 10 }}>
      <div style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>DIMENSION SCORES</div>
      {DIM_LIST.map(([key, label]) => {
        const score = dimensions[key] ?? 0;
        const filled = Math.round(score / 10);
        const empty = 10 - filled;
        const color = score >= 70 ? "#2980b9" : score >= 40 ? "#e67e22" : "#c0392b";
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ width: 150, color: "var(--text-dim)", flexShrink: 0, fontSize: 11 }}>{label}</span>
            <span style={{ width: 22, textAlign: "right", color, flexShrink: 0 }}>{score}</span>
            <span style={{ color, letterSpacing: -1 }}>{"█".repeat(filled)}</span>
            <span style={{ color: "var(--text-ghost)", letterSpacing: -1 }}>{"░".repeat(empty)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── CandidateCard ────────────────────────────────────────────────────────────

function CandidateCard({ candidate, onAnalyze, analyzing, onCompare, onMap, onAnalyzeAI, analyzingAI }) {
  const [expanded, setExpanded] = useState(false);

  const dcInfo = getDataCenterInfo(candidate.state, candidate.district ?? null);
  const isAnalyzingAI = analyzingAI === candidate.id;
  const isAnalyzing   = analyzing   === candidate.id;

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
      overflow: "hidden", transition: "border-color 0.2s",
      borderLeft: `4px solid ${PARTY_COLOR[candidate.party]}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
    >
      {/* ── Collapsed header (always visible) ── */}
      <div style={{ padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            {/* Name row */}
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
              {candidate.officeType === "us_house" && (
                <span style={{ background: "#0a1a2e", color: "#4a90d9", border: "1px solid #4a90d944", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                  HOUSE
                </span>
              )}
              {candidate.officeType === "us_house" && candidate.isBattleground && (
                <span style={{ background: "#1a1000", color: "#f0a500", border: "1px solid #f0a50044", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                  ⚡ Battleground
                </span>
              )}
              {candidate.incumbentStatus && candidate.incumbentStatus.includes("incumbent") && (
                <span style={{ background: "var(--bg-elevated)", color: "var(--text-5)", border: "1px solid var(--border-strong)", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>
                  {candidate.incumbentStatus === "incumbent (appointed)" ? "Appointed" : "Incumbent"}
                </span>
              )}
              <StatusBadge candidate={candidate} />
            </div>

            {/* State/office line */}
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
              {candidate.officeType === "us_house" && candidate.district
                ? `${candidate.state}-${candidate.district} · ${candidate.office}`
                : `${candidate.state} · ${candidate.office}`}
            </div>
            {candidate.officeType === "us_house" && candidate.districtLocation && (
              <div style={{ color: "var(--text-5)", fontSize: 12, marginTop: 2 }}>
                📍 {candidate.districtLocation}
              </div>
            )}

            {/* Data center tags — Step 7 */}
            {dcInfo && (dcInfo.marketSize === "major" || dcInfo.marketSize === "significant") && (
              <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                <span style={{ background: "#0e1a2e", color: "#4a90d9", border: "1px solid #4a90d944",
                  padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>
                  🏢 DATA CENTER {dcInfo.marketSize === "major" ? "HUB" : "DISTRICT"}
                </span>
                {dcInfo.waterStress === "high" && (
                  <span style={{ background: "#1a1000", color: "#e67e22", border: "1px solid #e67e2244",
                    padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5 }}>
                    💧 WATER STRESS
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side: competitiveness + dual score badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              background: COMPETITIVENESS_COLOR[candidate.raceCompetitiveness] + "22",
              color: COMPETITIVENESS_COLOR[candidate.raceCompetitiveness],
              border: `1px solid ${COMPETITIVENESS_COLOR[candidate.raceCompetitiveness]}44`,
              padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
            }}>
              {candidate.raceCompetitiveness}
            </span>
            {/* Step 1: dual score badges */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <ScoreBadge score={candidate.climateScore} />
              <AIPolicyScoreBadge score={candidate.aiPolicyScore} />
            </div>
            <span style={{ color: "var(--text-dim)", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>

      {/* ── Expanded body ── */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border-mid)" }}>
          {/* Info grid */}
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

          {/* Known positions */}
          <div style={{ background: "var(--bg-inner)", borderRadius: 8, padding: 12, marginTop: 12 }}>
            <div style={{ color: "var(--text-dim)", fontSize: 11, letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>KNOWN CLIMATE POSITIONS</div>
            <div style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.6 }}>{candidate.knownPositions}</div>
          </div>

          {/* Climate analysis — Step 2: green left border */}
          {candidate.climateAnalysis && (
            <div style={{ background: "var(--bg-analysis)", border: "1px solid var(--border-analysis)", borderLeft: "3px solid #27ae60", borderRadius: 8, padding: 14, marginTop: 12 }}>
              <div style={{ color: "var(--analysis-label)", fontSize: 11, letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
                {candidate.officeType === "us_house" && candidate.tier === 3
                  ? "⟁ ALGORITHMIC SCORE — based on party affiliation and donation data"
                  : "✦ AI CLIMATE ANALYSIS"}
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

          {/* Step 3: AI policy analysis section — blue left border */}
          {candidate.aiAnalysis && (
            <div style={{ background: "#050f1e", border: "1px solid #2980b933", borderLeft: "3px solid #2980b9", borderRadius: 8, padding: 14, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                <div style={{ color: "#5ba3d9", fontSize: 11, letterSpacing: 1, fontFamily: "'DM Mono', monospace" }}>
                  ⚡ AI POLICY ANALYSIS
                </div>
                {candidate.aiPolicyScore != null && (
                  <span style={{
                    background: candidate.aiPolicyScore >= 70 ? "#2980b9" : candidate.aiPolicyScore >= 40 ? "#e67e22" : "#c0392b",
                    color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: "monospace"
                  }}>
                    {candidate.aiPolicyScore}/100
                  </span>
                )}
              </div>
              <DimensionBars dimensions={candidate.aiDimensions} />
              <div style={{ borderTop: "1px solid #2980b922", marginTop: 10, paddingTop: 10 }}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7, margin: "6px 0" }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ color: "#7ab8e8" }}>{children}</strong>,
                    ul: ({ children }) => <ul style={{ color: "var(--text-4)", fontSize: 13, lineHeight: 1.7, paddingLeft: 18, margin: "6px 0" }}>{children}</ul>,
                    li: ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                    h1: ({ children }) => <h1 style={{ color: "#7ab8e8", fontSize: 14, margin: "10px 0 4px" }}>{children}</h1>,
                    h2: ({ children }) => <h2 style={{ color: "#7ab8e8", fontSize: 13, margin: "8px 0 4px" }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ color: "#5ba3d9", fontSize: 12, margin: "6px 0 3px" }}>{children}</h3>,
                  }}
                >
                  {candidate.aiAnalysis}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Step 8: AI Bills co-sponsored */}
          {candidate.aiBills && candidate.aiBills.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
                AI BILLS CO-SPONSORED
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {candidate.aiBills.map(bill => (
                  <span key={bill} style={{
                    background: "#091a10", color: "#27ae60", border: "1px solid #27ae6044",
                    padding: "3px 8px", borderRadius: 4, fontSize: 11, fontFamily: "'DM Mono', monospace"
                  }}>
                    {bill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Climate analysis button — unchanged */}
            <button
              onClick={() => onAnalyze(candidate)}
              disabled={isAnalyzing}
              style={{
                background: isAnalyzing ? "var(--bg-btn-analyze-act)" : "var(--bg-btn-analyze)",
                color: isAnalyzing ? "var(--btn-analyze-dis)" : "var(--btn-analyze-color)",
                border: "1px solid var(--accent-btn-border)",
                padding: "8px 18px", borderRadius: 6, cursor: isAnalyzing ? "not-allowed" : "pointer",
                fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, transition: "all 0.2s"
              }}
            >
              {isAnalyzing ? "⟳ Analyzing..." : "✦ Run Climate Analysis"}
            </button>

            {candidate.officeType === "us_house" && candidate.climateAnalysis && candidate.tier > 1 && (
              <button
                onClick={() => onAnalyze({ ...candidate, forceFullAnalysis: true })}
                disabled={isAnalyzing}
                style={{
                  background: "var(--bg-elevated)", color: "#4a90d9", border: "1px solid #4a90d944",
                  padding: "8px 18px", borderRadius: 6, cursor: isAnalyzing ? "not-allowed" : "pointer",
                  fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, transition: "all 0.2s"
                }}
              >
                ↑ Upgrade to Full Analysis
              </button>
            )}

            {/* Step 2: AI Policy Analysis button */}
            <button
              onClick={() => onAnalyzeAI(candidate)}
              disabled={isAnalyzingAI}
              style={{
                background: isAnalyzingAI ? "#0a1e30" : "#071525",
                color: isAnalyzingAI ? "#5ba3d9" : "#4a90d9",
                border: "1px solid #2980b944",
                padding: "8px 18px", borderRadius: 6, cursor: isAnalyzingAI ? "not-allowed" : "pointer",
                fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, transition: "all 0.2s"
              }}
            >
              {isAnalyzingAI ? "⟳ Analyzing AI Policy..." : "⚡ Run AI Policy Analysis"}
            </button>

            {/* Compare button */}
            <button
              onClick={e => { e.stopPropagation(); onCompare(candidate); }}
              style={{
                background: "var(--bg-btn-compare)", color: "var(--btn-compare-color)",
                border: "1px solid var(--btn-compare-border)",
                padding: "8px 18px", borderRadius: 6, cursor: "pointer",
                fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, transition: "all 0.2s"
              }}
            >
              ⊕ Compare with Opponents
            </button>

            {/* Map button */}
            {((candidate.officeType === "us_house" && candidate.district) || candidate.officeType === "us_senate") && (
              <button
                onClick={e => { e.stopPropagation(); onMap(candidate); }}
                style={{
                  background: "var(--bg-elevated)", color: "#4a90d9", border: "1px solid #4a90d944",
                  padding: "8px 18px", borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, transition: "all 0.2s"
                }}
                title={candidate.officeType === "us_senate" ? "View the state this senator represents" : "View the counties covered by this congressional district"}
              >
                🗺 {candidate.officeType === "us_senate" ? "View State Map" : "View District Map"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

function Leaderboard({ candidates, mode, onClose }) {
  const getScore = c =>
    mode === "climate" ? c.climateScore :
    mode === "ai"      ? c.aiPolicyScore :
    (c.climateScore != null && c.aiPolicyScore != null)
      ? Math.round((c.climateScore + c.aiPolicyScore) / 2)
      : null;

  const sorted = [...candidates]
    .filter(c => getScore(c) != null)
    .sort((a, b) => getScore(b) - getScore(a))
    .slice(0, 10);

  const title = mode === "climate" ? "🌿 Top Climate Scores"
              : mode === "ai"      ? "⚡ Top AI Policy Scores"
              :                      "⭐ Top Overall (Both Scores)";
  const barColor = mode === "ai" ? "#2980b9" : mode === "climate" ? "#27ae60" : "#9b59b6";

  if (sorted.length === 0) return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16, color: "var(--text-muted)", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
      No candidates analyzed for this leaderboard yet.
    </div>
  );

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ color: "var(--text-1)", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600 }}>{title}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
          ✕ Close
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((c, i) => {
          const score = getScore(c);
          const pct = (score / 100) * 100;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 20, color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", fontSize: 11, textAlign: "right" }}>
                {i + 1}.
              </span>
              <span style={{ width: 180, color: "var(--text-2)", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.name}
              </span>
              <span style={{
                background: PARTY_COLOR[c.party], color: "#fff",
                padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 700, flexShrink: 0
              }}>
                {c.party}
              </span>
              <div style={{ flex: 1, background: "var(--bg-inner)", borderRadius: 3, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, background: barColor, height: "100%", borderRadius: 3 }} />
              </div>
              <span style={{ width: 32, color: barColor, fontFamily: "monospace", fontSize: 12, fontWeight: 700, textAlign: "right" }}>
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CompareModal ─────────────────────────────────────────────────────────────

function CompareModal({ primary, opponents, onClose, cache, onCacheUpdate, allCandidates }) {
  const [selectedOpponentId, setSelectedOpponentId] = useState(opponents[0]?.id);
  const [tab, setTab] = useState("climate"); // "climate" | "ai_policy"
  const [issue, setIssue] = useState(COMPARE_ISSUES[0].value);
  const [aiDimension, setAIDimension] = useState(AI_COMPARE_ISSUES[0].value);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const opponent = opponents.find(o => o.id === selectedOpponentId) || opponents[0];
  const c1 = primary;
  const c2 = opponent;

  const cacheKey = c2
    ? tab === "climate"
      ? `${Math.min(c1.id, c2.id)}-${Math.max(c1.id, c2.id)}-${issue}`
      : `ai-${Math.min(c1.id, c2.id)}-${Math.max(c1.id, c2.id)}-${aiDimension}`
    : null;

  const runComparison = async () => {
    if (!c2) return;
    if (cache[cacheKey]) { setResult(cache[cacheKey]); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      if (tab === "climate") {
        const data = await compareCandiates(c1, c2, issue);
        onCacheUpdate(cacheKey, data);
        setResult(data);
      } else {
        const res = await fetch("/api/compare-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate1Id: c1.id, candidate2Id: c2.id, dimension: aiDimension }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "AI comparison failed");
        onCacheUpdate(cacheKey, data);
        setResult(data);
      }
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
  const aiScoreColor = s => s >= 70 ? "#2980b9" : s >= 40 ? "#e67e22" : s != null ? "#c0392b" : "var(--text-dim)";

  // Big Tech donation comparison for AI tab
  const btLevel = c => c.bigTechDonationLevel ?? "unknown";
  const btColor = lvl => lvl === "high" ? "#c0392b" : lvl === "moderate" ? "#e67e22" : lvl === "low" ? "#27ae60" : "#666";

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
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)", color: "var(--close-color)", borderRadius: 6,
          padding: "4px 12px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Mono', monospace",
        }}>Close</button>

        {/* Step 6: Tab selector */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
          {[["climate", "🌿 Climate"], ["ai_policy", "⚡ AI Policy"]].map(([val, label]) => {
            const active = tab === val;
            return (
              <button key={val} onClick={() => { setTab(val); setResult(null); setError(null); }} style={{
                padding: "8px 20px", background: "none", border: "none",
                borderBottom: active ? `2px solid ${val === "climate" ? "#27ae60" : "#2980b9"}` : "2px solid transparent",
                color: active ? (val === "climate" ? "#27ae60" : "#4a90d9") : "var(--text-muted)",
                fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: "pointer", marginBottom: -1, transition: "color 0.15s",
              }}>
                {label}
              </button>
            );
          })}
        </div>

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
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {tab === "climate" ? (
                  <span style={{ background: scoreColor(c1.climateScore), color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                    🌿 {c1.climateScore != null ? `${c1.climateScore}/100` : "Not Analyzed"}
                  </span>
                ) : (
                  <span style={{ background: aiScoreColor(c1.aiPolicyScore), color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                    ⚡ {c1.aiPolicyScore != null ? `${c1.aiPolicyScore}/100` : "Not Analyzed"}
                  </span>
                )}
              </div>
            </div>
            {/* Opponent */}
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
                  <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {tab === "climate" ? (
                      <span style={{ background: scoreColor(c2.climateScore), color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                        🌿 {c2.climateScore != null ? `${c2.climateScore}/100` : "Not Analyzed"}
                      </span>
                    ) : (
                      <span style={{ background: aiScoreColor(c2.aiPolicyScore), color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                        ⚡ {c2.aiPolicyScore != null ? `${c2.aiPolicyScore}/100` : "Not Analyzed"}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 6: Big Tech comparison panel for AI tab */}
        {tab === "ai_policy" && c2 && (
          <div style={{ background: "#050f1e", border: "1px solid #2980b933", borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ color: "#5ba3d9", fontSize: 10, letterSpacing: 1, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>BIG TECH PAC DONATIONS</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[c1, c2].map(c => (
                <div key={c.id} style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ color: "var(--text-dim)", fontSize: 11, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{c.name}</div>
                  <span style={{
                    background: btColor(btLevel(c)) + "22", color: btColor(btLevel(c)),
                    border: `1px solid ${btColor(btLevel(c))}44`,
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Mono', monospace"
                  }}>
                    {btLevel(c)}
                    {btLevel(c) === "high" && " ⚠️"}
                  </span>
                </div>
              ))}
            </div>
            {(btLevel(c1) === "high" || btLevel(c2) === "high") && (
              <div style={{ marginTop: 8, color: "#e67e22", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                ⚠️ High Big Tech PAC donations may create conflicts of interest on AI regulation votes.
              </div>
            )}
          </div>
        )}

        {/* Issue / dimension selector */}
        {c2 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1 }}>
              {tab === "climate" ? "ISSUE:" : "DIMENSION:"}
            </span>
            {tab === "climate" ? (
              <select
                value={issue}
                onChange={e => { setIssue(e.target.value); setResult(null); setError(null); }}
                style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)", padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none" }}
              >
                {COMPARE_ISSUES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            ) : (
              <select
                value={aiDimension}
                onChange={e => { setAIDimension(e.target.value); setResult(null); setError(null); }}
                style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid #2980b944", padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none" }}
              >
                {AI_COMPARE_ISSUES.map(i => <option key={i.label} value={i.value}>{i.label}</option>)}
              </select>
            )}
            <button onClick={runComparison} disabled={loading} style={{
              background: loading ? "var(--bg-btn-analyze-act)" : tab === "ai_policy" ? "#071525" : "var(--bg-btn-analyze)",
              color: loading ? "var(--btn-analyze-dis)" : tab === "ai_policy" ? "#4a90d9" : "var(--btn-analyze-color)",
              border: `1px solid ${tab === "ai_policy" ? "#2980b944" : "var(--accent-btn-border)"}`,
              padding: "8px 18px", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5,
            }}>
              {loading ? "⟳ Running..." : cacheKey && cache[cacheKey] ? "Cached — Re-run" : tab === "ai_policy" ? "⚡ Run AI Comparison" : "✦ Run AI Comparison"}
            </button>
          </div>
        )}

        {/* Known positions */}
        {c2 && (
          <div style={{ display: "flex", gap: 12, marginBottom: result || error ? 20 : 0, flexWrap: "wrap" }}>
            {[c1, c2].map(c => (
              <div key={c.id} style={{ flex: 1, minWidth: 200, background: "var(--bg-inner)", border: "1px solid var(--border-mid)", borderRadius: 8, padding: 14 }}>
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

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
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

// ─── ClimateTracker (main export) ─────────────────────────────────────────────

export default function ClimateTracker({ initialCandidates }) {
  // Normalise incoming candidates to always have AI fields
  const normalise = c => ({
    aiPolicyScore: null, aiAnalysis: null, aiDimensions: null, aiBills: [], bigTechDonationLevel: null,
    ...c,
  });

  const [candidates, setCandidates] = useState(
    (initialCandidates ?? CANDIDATES).map(normalise)
  );
  const [analyzing, setAnalyzing] = useState(null);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(null);
  const [analyzingAllAI, setAnalyzingAllAI] = useState(false);
  const [filter, setFilter] = useState({
    party: "all", state: "", competitiveness: "all", analyzed: "all",
    aiScore: "all", climateIssue: "all", aiIssue: "all", search: "", officeType: "all",
    dataCenterOnly: false, bigTechFunded: false, aiBillSponsor: false,
  });
  const [globalError, setGlobalError] = useState(null);
  const [compareCandidate, setCompareCandidate] = useState(null);
  const [compareCache, setCompareCache] = useState({});
  const [dark, setDark] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [mapCandidate, setMapCandidate] = useState(null);
  const [leaderboardMode, setLeaderboardMode] = useState(null); // null | "climate" | "ai" | "overall"

  const isAdmin = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("admin") === "true";

  const runSync = async () => {
    const secret = prompt("Enter sync secret:");
    if (!secret) return;
    setSyncing(true); setSyncToast(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", headers: { "x-sync-secret": secret } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncToast({ ok: true, message: data.message || "Sync complete" });
      const updated = await fetch("/api/candidates").then(r => r.json());
      if (updated.candidates) setCandidates(updated.candidates.map(normalise));
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

  // ── Filtering ──
  const filtered = candidates.filter(c => {
    if (filter.officeType !== "all" && (c.officeType ?? "us_senate") !== filter.officeType) return false;
    if (filter.party !== "all" && c.party !== filter.party) return false;
    if (filter.state && c.state !== filter.state) return false;
    if (filter.competitiveness !== "all" && c.raceCompetitiveness !== filter.competitiveness) return false;
    if (filter.analyzed === "yes" && c.climateScore === null) return false;
    if (filter.analyzed === "no" && c.climateScore !== null) return false;
    if (filter.climateIssue !== "all" && !c.issues?.includes(filter.climateIssue)) return false;
    if (filter.aiIssue !== "all" && (c.aiDimensions == null || (c.aiDimensions[filter.aiIssue] ?? 0) < 60)) return false;
    if (filter.search && !c.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    // AI filters — Step 5
    if (filter.aiScore === "strong"      && (c.aiPolicyScore == null || c.aiPolicyScore < 70)) return false;
    if (filter.aiScore === "mixed"       && (c.aiPolicyScore == null || c.aiPolicyScore < 40 || c.aiPolicyScore >= 70)) return false;
    if (filter.aiScore === "weak"        && (c.aiPolicyScore == null || c.aiPolicyScore >= 40)) return false;
    if (filter.aiScore === "not-analyzed" && c.aiPolicyScore != null) return false;
    if (filter.dataCenterOnly) {
      const dc = getDataCenterInfo(c.state, c.district ?? null);
      if (!dc || dc.marketSize === "minor") return false;
    }
    if (filter.bigTechFunded && c.bigTechDonationLevel !== "high" && c.bigTechDonationLevel !== "moderate") return false;
    if (filter.aiBillSponsor && (!c.aiBills || c.aiBills.length === 0)) return false;
    return true;
  }).sort((a, b) => {
    const lastName = name => name.split(" ").at(-1);
    return lastName(a.name).localeCompare(lastName(b.name));
  });

  // ── Climate analysis ──
  const analyzeCandidate = async (candidate) => {
    setAnalyzing(candidate.id); setGlobalError(null);
    try {
      const { text, score, issues } = await fetchAnalysis(candidate);
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id ? { ...c, climateScore: score, climateAnalysis: text, issues } : c
      ));
    } catch (err) {
      setGlobalError(`Analysis failed for ${candidate.name}: ${err.message}`);
    } finally {
      setAnalyzing(null);
    }
  };

  const analyzeAll = async () => {
    const unanalyzed = filtered.filter(c => c.climateScore === null);
    if (unanalyzed.length === 0) return;
    setAnalyzingAll(true);
    for (const c of unanalyzed) { await analyzeCandidate(c); await new Promise(r => setTimeout(r, 500)); }
    setAnalyzingAll(false);
  };

  // ── AI policy analysis — Step 2 & 10 ──
  const analyzeAI = async (candidate) => {
    if (!candidate.id) return;
    setAnalyzingAI(candidate.id); setGlobalError(null);
    try {
      const tier = candidate.officeType === "us_senate" || candidate.officeType === "governor" ? 1
                 : candidate.tier === 1 ? 1 : 2;
      const res = await fetch("/api/analyze-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id, tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI analysis failed");
      setCandidates(prev => prev.map(c =>
        c.id === candidate.id
          ? { ...c, aiPolicyScore: data.score, aiAnalysis: data.analysis, aiDimensions: data.dimensions, aiBills: data.aiBills ?? c.aiBills, bigTechDonationLevel: data.bigTechLevel ?? c.bigTechDonationLevel }
          : c
      ));
    } catch (err) {
      setGlobalError(`AI analysis failed for ${candidate.name}: ${err.message}`);
    } finally {
      setAnalyzingAI(null);
    }
  };

  const analyzeAllAI = async () => {
    const unanalyzed = filtered.filter(c => c.aiPolicyScore === null && c.id);
    if (unanalyzed.length === 0) return;
    setAnalyzingAllAI(true);
    for (const c of unanalyzed) { await analyzeAI(c); await new Promise(r => setTimeout(r, 500)); }
    setAnalyzingAllAI(false);
  };

  // ── Stats ──
  const senateCandidates = candidates.filter(c => (c.officeType ?? "us_senate") === "us_senate");
  const govCandidates    = candidates.filter(c => c.officeType === "governor");
  const houseCandidates  = candidates.filter(c => c.officeType === "us_house");
  const senateAnalyzed   = senateCandidates.filter(c => c.climateScore !== null).length;
  const govAnalyzed      = govCandidates.filter(c => c.climateScore !== null).length;
  const houseAnalyzed    = houseCandidates.filter(c => c.climateScore !== null).length;
  const analyzedCount    = candidates.filter(c => c.climateScore !== null).length;
  const aiAnalyzedCount  = candidates.filter(c => c.aiPolicyScore !== null).length;
  const avgScore = analyzedCount > 0
    ? Math.round(candidates.filter(c => c.climateScore !== null).reduce((a, c) => a + c.climateScore, 0) / analyzedCount)
    : null;
  const avgAIScore = aiAnalyzedCount > 0
    ? Math.round(candidates.filter(c => c.aiPolicyScore !== null).reduce((a, c) => a + c.aiPolicyScore, 0) / aiAnalyzedCount)
    : null;

  const selectStyle = {
    background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)",
    padding: "8px 12px", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none"
  };

  const toggleStyle = (active) => ({
    background: active ? "#071525" : "var(--bg-card)",
    color: active ? "#4a90d9" : "var(--text-muted)",
    border: `1px solid ${active ? "#2980b944" : "var(--border-subtle)"}`,
    padding: "8px 12px", borderRadius: 6, cursor: "pointer",
    fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 0.3,
    transition: "all 0.15s", whiteSpace: "nowrap",
  });

  return (
    <div data-theme={dark ? "dark" : "light"} style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-1)", fontFamily: "'DM Sans', sans-serif" }}>
      {mapCandidate && <DistrictMap candidate={mapCandidate} onClose={() => setMapCandidate(null)} />}

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

      {/* ── Header ── */}
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

            {/* Step 4: header stats with avg AI score */}
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { label: "Senate",      value: senateCandidates.length, sub: `${senateAnalyzed} analyzed` },
                { label: "Governor",    value: govCandidates.length,    sub: `${govAnalyzed} analyzed` },
                { label: "House",       value: houseCandidates.length,  sub: `${houseAnalyzed} analyzed` },
                { label: "Avg Climate", value: avgScore != null ? `${avgScore}/100` : "—", sub: `${analyzedCount} analyzed` },
                { label: "Avg AI Score",value: avgAIScore != null ? `${avgAIScore}/100` : "—", sub: `${aiAnalyzedCount} analyzed` },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ textAlign: "right" }}>
                  <div style={{ color: label === "Avg AI Score" ? "#4a90d9" : "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500 }}>{value}</div>
                  <div style={{ color: "var(--text-deep)", fontSize: 11, letterSpacing: 1 }}>{label}</div>
                  {sub && <div style={{ color: "var(--text-ghost)", fontSize: 10, letterSpacing: 0.5 }}>{sub}</div>}
                </div>
              ))}

              <button onClick={() => setDark(d => !d)} title={dark ? "Switch to light mode" : "Switch to dark mode"}
                style={{ background: "var(--toggle-bg)", border: "1px solid var(--toggle-border)", color: "var(--toggle-color)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16, lineHeight: 1, marginLeft: 8 }}>
                {dark ? "☀️" : "🌙"}
              </button>
              {isAdmin && (
                <button onClick={runSync} disabled={syncing}
                  style={{ background: "var(--toggle-bg)", border: "1px solid var(--toggle-border)", color: syncing ? "var(--text-dim)" : "var(--accent)", borderRadius: 8, padding: "8px 12px", cursor: syncing ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, marginLeft: 4 }}>
                  {syncing ? "⟳ Syncing…" : "↻ Sync"}
                </button>
              )}
            </div>
          </div>

          {/* Office type tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: "1px solid var(--border)" }}>
            {[["all", "All Offices"], ["us_senate", "U.S. Senate"], ["governor", "Governor"], ["us_house", "U.S. House"]].map(([val, label]) => {
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

          {/* Row 1: Filters */}
          <div className="filter-row">
            <select className="issues-select" style={selectStyle} value={filter.climateIssue} onChange={e => setFilter(f => ({ ...f, climateIssue: e.target.value }))}>
              <option value="all">🌿 All Climate Issues</option>
              {ISSUE_FILTERS.map(group => (
                <optgroup key={group.category} label={group.category}>
                  {group.issues.map(issue => <option key={issue.value} value={issue.value}>{issue.label}</option>)}
                </optgroup>
              ))}
            </select>
            <select className="issues-select" style={{ ...selectStyle, borderColor: "#2980b944", ...(filter.aiIssue !== "all" && { color: "#4a90d9" }) }}
              value={filter.aiIssue} onChange={e => setFilter(f => ({ ...f, aiIssue: e.target.value }))}>
              <option value="all">⚡ All AI Issues</option>
              <option value="datacenters_energy">Data Center Energy</option>
              <option value="ai_safety">AI Safety & Oversight</option>
              <option value="algorithmic_accountability">Algorithmic Accountability</option>
              <option value="ai_elections">AI in Elections</option>
              <option value="water_usage">Water Usage Policy</option>
              <option value="grid_impact">Grid Impact</option>
              <option value="ai_economic">AI Economic Policy</option>
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
              <option value="yes">Climate Analyzed</option>
              <option value="no">Climate Unanalyzed</option>
            </select>
          </div>

          {/* Step 5: Row 2 — AI filters */}
          <div className="filter-row" style={{ marginTop: 8 }}>
            <select style={{ ...selectStyle, borderColor: "#2980b944", color: "#4a90d9" }}
              value={filter.aiScore} onChange={e => setFilter(f => ({ ...f, aiScore: e.target.value }))}>
              <option value="all">All AI Scores</option>
              <option value="strong">⚡ Strong (70+)</option>
              <option value="mixed">⚡ Mixed (40–69)</option>
              <option value="weak">⚡ Weak (&lt;40)</option>
              <option value="not-analyzed">Not AI Analyzed</option>
            </select>
            <button style={toggleStyle(filter.dataCenterOnly)} onClick={() => setFilter(f => ({ ...f, dataCenterOnly: !f.dataCenterOnly }))}>
              🏢 Data Center District
            </button>
            <button style={toggleStyle(filter.bigTechFunded)} onClick={() => setFilter(f => ({ ...f, bigTechFunded: !f.bigTechFunded }))}>
              💰 Big Tech Funded
            </button>
            <button style={toggleStyle(filter.aiBillSponsor)} onClick={() => setFilter(f => ({ ...f, aiBillSponsor: !f.aiBillSponsor }))}>
              📋 AI Bill Co-Sponsor
            </button>
          </div>

          {/* Row 3: Search + Step 10 dual Analyze All buttons */}
          <div className="filter-actions-row">
            <input
              type="text"
              placeholder="Search by name..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="filter-search"
              style={{ background: "var(--bg-card)", color: "var(--text-3)", border: "1px solid var(--border-subtle)", padding: "8px 12px", borderRadius: 6, fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none" }}
            />
            {/* Analyze All Climate — unchanged */}
            <button className="filter-analyze" onClick={analyzeAll} disabled={analyzingAll || analyzing !== null}
              style={{
                background: "var(--bg-btn-analyze)", color: analyzingAll ? "var(--btn-analyze-dis)" : "var(--btn-analyze-color)", border: "1px solid var(--accent-btn-border)",
                padding: "8px 16px", borderRadius: 6, cursor: (analyzingAll || analyzing) ? "not-allowed" : "pointer",
                fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, whiteSpace: "nowrap",
              }}>
              {analyzingAll ? `⟳ Analyzing...` : `✦ Analyze Climate (${filtered.filter(c => c.climateScore === null).length})`}
            </button>
            {/* Analyze All AI Policy — Step 10 */}
            <button onClick={analyzeAllAI} disabled={analyzingAllAI || analyzingAI !== null}
              style={{
                background: "#071525", color: (analyzingAllAI || analyzingAI) ? "#5ba3d9" : "#4a90d9", border: "1px solid #2980b944",
                padding: "8px 16px", borderRadius: 6, cursor: (analyzingAllAI || analyzingAI) ? "not-allowed" : "pointer",
                fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 0.5, whiteSpace: "nowrap",
              }}>
              {analyzingAllAI ? `⟳ Analyzing AI...` : `⚡ Analyze AI Policy (${filtered.filter(c => c.aiPolicyScore === null).length})`}
            </button>
          </div>

          {/* Step 9: Leaderboard toggle buttons */}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1, alignSelf: "center" }}>LEADERBOARD:</span>
            {[
              { mode: "climate", label: "🌿 Top Climate" },
              { mode: "ai",      label: "⚡ Top AI Policy" },
              { mode: "overall", label: "⭐ Top Overall" },
            ].map(({ mode, label }) => (
              <button key={mode}
                onClick={() => setLeaderboardMode(m => m === mode ? null : mode)}
                style={{
                  background: leaderboardMode === mode ? "var(--bg-btn-analyze)" : "var(--bg-card)",
                  color: leaderboardMode === mode ? "var(--btn-analyze-color)" : "var(--text-muted)",
                  border: `1px solid ${leaderboardMode === mode ? "var(--accent-btn-border)" : "var(--border-subtle)"}`,
                  padding: "5px 12px", borderRadius: 6, cursor: "pointer",
                  fontSize: 12, fontFamily: "'DM Mono', monospace", transition: "all 0.15s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {globalError && (
            <div style={{ marginTop: 12, background: "var(--bg-error)", border: "1px solid var(--border-error)", borderRadius: 6, padding: "10px 14px", color: "var(--error-color)", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
              {globalError}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
        {/* Step 9: Leaderboard panel */}
        {leaderboardMode && (
          <Leaderboard
            candidates={candidates}
            mode={leaderboardMode}
            onClose={() => setLeaderboardMode(null)}
          />
        )}

        {filter.officeType === "us_house" && (
          <div style={{
            background: "#0a1a2e", border: "1px solid #4a90d944", borderRadius: 8,
            padding: "12px 16px", marginBottom: 16,
            color: "#4a90d9", fontSize: 13, fontFamily: "'DM Mono', monospace",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>ℹ</span>
            <span>
              Showing House candidates. Battleground districts (marked with ⚡) have full AI analysis priority.
              Safe-seat candidates receive an algorithmic score based on party affiliation and donation data.
            </span>
          </div>
        )}

        {/* Score legend */}
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
            <CandidateCard key={c.id} candidate={c}
              onAnalyze={analyzeCandidate} analyzing={analyzing}
              onAnalyzeAI={analyzeAI} analyzingAI={analyzingAI}
              onCompare={setCompareCandidate} onMap={setMapCandidate}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-ghost)", fontFamily: "'DM Mono', monospace" }}>
            No candidates match your filters.
          </div>
        )}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-mid)", color: "var(--text-ghost)", fontSize: 12, fontFamily: "'DM Mono', monospace", lineHeight: 1.8 }}>
          <div style={{ marginBottom: 6, color: "var(--text-deep)" }}>DATA SOURCES & METHODOLOGY</div>
          Candidate data sourced from Wikipedia, Ballotpedia, and news reporting (as of March 2026). AI analysis powered by Claude (Anthropic). Climate scores reflect climate policy alignment with scientific consensus — not party affiliation. AI Policy scores reflect positions on AI governance, data center regulation, algorithmic accountability, and Big Tech oversight. Race competitiveness ratings from Cook Political Report / Sabato&apos;s Crystal Ball. Fossil fuel donation levels are indicative estimates. Big Tech PAC data sourced from FEC. This tracker is for informational purposes; always verify with primary sources.
        </div>
      </div>

      {compareCandidate && (
        <CompareModal
          primary={compareCandidate}
          opponents={getOpponents(compareCandidate)}
          onClose={() => setCompareCandidate(null)}
          cache={compareCache}
          onCacheUpdate={(key, data) => setCompareCache(prev => ({ ...prev, [key]: data }))}
          allCandidates={candidates}
        />
      )}
    </div>
  );
}
