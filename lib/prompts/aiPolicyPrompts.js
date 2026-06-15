/**
 * AI Policy scoring prompts — completely independent of climate scoring.
 * Tier 1: full analysis (Senate, Governor, Tier 1 House)
 * Tier 2: compressed JSON-only analysis (Tier 2/3 House and all others)
 */

/**
 * Build the Tier 1 full AI policy analysis prompt.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.party
 * @param {string} params.state
 * @param {string} params.office
 * @param {string} params.knownPositions
 * @param {string} params.bigTechDonations  - 'high' | 'moderate' | 'low' | 'none' | 'unknown'
 * @param {string[]} params.aiBills         - array of bill names cosponsor/sponsored
 * @param {Object|null} params.datacenterInfo
 * @returns {string}
 */
export function buildAIPolicyTier1Prompt({ name, party, state, office, knownPositions, bigTechDonations, aiBills, datacenterInfo, stateAILegislation }) {
  const billsText = aiBills?.length
    ? aiBills.join(', ')
    : 'None found'

  const dcText = datacenterInfo
    ? `${datacenterInfo.marketSize} data center market. Primary operators: ${(datacenterInfo.primaryOperators || []).join(', ')}. Water stress: ${datacenterInfo.waterStress}. Grid stress: ${datacenterInfo.gridStress}.`
    : 'No significant data center presence in this state/district.'

  const stateBillsText = stateAILegislation?.length
    ? stateAILegislation.map(b => `${b.bill_number} (${b.session}): ${b.title} — ${b.status}`).join('\n  ')
    : 'None found'

  return `You are a nonpartisan technology policy analyst specializing in AI governance and data infrastructure. Analyze this candidate's positions on AI policy and data center regulation.

IMPORTANT: Do not consider climate positions in this score. Score only AI and data center policy positions.

Candidate: ${name}, ${party}, ${state}, ${office}
Known positions: ${knownPositions || 'None on record'}
Big Tech PAC donations: ${bigTechDonations}
Federal AI bill cosponsorships: ${billsText}
State legislature AI bills sponsored: ${stateBillsText}
State data center presence: ${dcText}

Score each dimension 0-100 and provide overall AI Policy Score.
Return as SCORE: XX/100

Provide:
1. AI POLICY SCORE (0-100)
   0 = opposes all AI regulation, no data center requirements
   50 = mixed or no public positions
   100 = comprehensive AI oversight champion

2. DIMENSION SCORES as JSON:
   {"datacenters_energy": N, "water_usage": N, "grid_impact": N, "ai_safety": N, "algorithmic_accountability": N, "ai_elections": N, "ai_economic": N}

3. POLICY ANALYSIS (3-4 sentences): Key AI policy positions

4. DATA CENTER RELEVANCE: Is this a high data center state/district? What specific local issues apply?

5. STRENGTHS: 1-2 AI policy strengths

6. CONCERNS: 1-2 AI policy concerns or gaps

7. BIG TECH INFLUENCE: Note any Big Tech PAC donations as potential conflicts of interest

8. KEY BILLS: List any relevant AI legislation they have sponsored or co-sponsored

Be factual and nonpartisan. Note where the record is thin or unknown.`
}

/**
 * Build the Tier 2 compressed AI policy prompt (returns JSON only).
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.state
 * @param {string|null} params.district
 * @param {string} params.party
 * @param {string} params.knownPositions
 * @param {string} params.bigTechDonations
 * @returns {string}
 */
export function buildAIPolicyTier2Prompt({ name, state, district, party, knownPositions, bigTechDonations }) {
  const location = district ? `${state}-${district}` : state

  return `Rate this candidate's AI policy (0-100). Return JSON only:
{
  "ai_score": N,
  "summary": "2 sentences",
  "stances": {
    "datacenters_energy": "support|oppose|mixed|unknown",
    "ai_safety": "support|oppose|mixed|unknown",
    "algorithmic_accountability": "support|oppose|mixed|unknown",
    "ai_elections": "support|oppose|mixed|unknown"
  },
  "big_tech_conflict": true|false,
  "confidence": "high|medium|low"
}
Candidate: ${name}, ${location}, ${party}
Record: ${knownPositions || 'None on record'}
Big Tech donations: ${bigTechDonations}
Do not factor in climate positions.`
}
