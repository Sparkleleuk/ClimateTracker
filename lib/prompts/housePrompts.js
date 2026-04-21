const PARTY_LABEL = { D: 'Democrat', R: 'Republican', I: 'Independent' }

const ISSUE_TAG_LIST = [
  'clean-energy — Clean energy transition',
  'fossil-fuel — Fossil fuel policy',
  'carbon-pricing — Carbon pricing',
  'nuclear — Nuclear energy',
  'grid — Energy grid modernization',
  'buildings — Building decarbonization',
  'ev — Electric vehicles',
  'transit — Public transit',
  'aviation — Aviation & shipping',
  'public-lands — Public lands',
  'water — Water rights & quality',
  'forests — Deforestation & reforestation',
  'biodiversity — Biodiversity & endangered species',
  'agriculture — Agriculture & soil',
  'ocean — Ocean policy',
  'air-quality — Air quality',
  'chemicals — Chemical regulation',
  'plastics — Plastic pollution',
  'env-justice — Environmental justice',
  'flooding — Flood & sea level rise',
  'wildfire — Wildfire policy',
  'drought-heat — Drought & heat',
  'disaster — Disaster resilience',
  'paris — Paris Agreement',
  'climate-finance — Climate finance',
  'methane — Methane regulation',
  'offsets — Carbon offsets & markets',
  'epa — EPA authority',
  'ira — Inflation Reduction Act',
  'gnd — Green New Deal',
  'nepa — Environmental review (NEPA)',
  'disclosure — Climate disclosure',
].join('\n')

/**
 * Full Tier 1 prompt for US House candidates in competitive districts.
 * Adapted from the Senate prompt but focused on House district-level powers.
 */
export function buildHouseTier1Prompt(candidate) {
  const party = PARTY_LABEL[candidate.party] ?? candidate.party
  const district = candidate.district ? `${candidate.state}-${candidate.district}` : candidate.state

  return `You are a nonpartisan climate policy analyst. Analyze this US House of Representatives candidate's environmental record and positions.

Candidate: ${candidate.name}
Party: ${party}
District: ${district}
Office: U.S. House of Representatives
Race Competitiveness: ${candidate.raceCompetitiveness ?? 'Unknown'}
Known Positions: ${candidate.knownPositions ?? 'No public record available'}
Fossil Fuel Donation Level: ${candidate.fossilFuelDonations ?? 'unknown'}
Incumbent Status: ${candidate.incumbentStatus ?? 'challenger'}

House members have distinct legislative powers. Focus your analysis on:
- Voting record on key climate legislation (IRA, CHIPS Act, infrastructure, appropriations)
- Committee assignments relevant to energy, environment, agriculture, or transportation
- Support for or opposition to EPA and federal environmental regulations
- Position on fossil fuel subsidies and clean energy tax credits
- District-specific climate vulnerabilities (flooding, wildfire, drought, industrial pollution, sea level rise)
- Environmental justice considerations in their district
- Constituent industries affected by energy transition (manufacturing, agriculture, fossil fuel extraction)
- Alignment with or opposition to federal climate frameworks

Provide:
1. CLIMATE SCORE (0-100): Score their climate record/proposals. 0=climate denier/fossil fuel champion, 50=mixed/moderate, 100=ambitious climate leader. State the number clearly as "SCORE: XX/100"

2. POLICY ANALYSIS (3-4 sentences): What do we know about their climate record? What are their key positions and voting history?

3. STRENGTHS: 1-2 climate policy strengths (or "None identified")

4. CONCERNS: 1-2 climate policy concerns or gaps

5. KEY ISSUES TO WATCH: What climate topics are most relevant for their district and this race?

6. ISSUE TAGS: From the list below, select all tags that are relevant to this candidate's record or positions. Output them as a comma-separated list on a single line, exactly as: "TAGS: tag-value-1, tag-value-2, ..."
Only include tags where the candidate has a clear, demonstrable position or record. Do not tag issues where the record is absent or entirely unknown.

Available tags:
${ISSUE_TAG_LIST}

Be factual, cite their district's specific climate vulnerabilities, and note data gaps where the record is thin. Be nonpartisan — score based on climate science alignment, not party affiliation.`
}

/**
 * Compressed Tier 2 prompt for non-battleground House candidates.
 * Returns JSON only — no markdown.
 */
export function buildHouseTier2Prompt(candidate) {
  const party = PARTY_LABEL[candidate.party] ?? candidate.party
  const district = candidate.district ?? 'At-Large'

  return `Rate this US House candidate on climate (0-100). Return valid JSON only, no markdown:
{"score":<0-100>,"summary":"<2 sentences>","stances":{"clean_energy":"<support|oppose|mixed|unknown>","fossil_fuels":"<support|oppose|mixed|unknown>","carbon_pricing":"<support|oppose|mixed|unknown>","environmental_justice":"<support|oppose|mixed|unknown>"},"confidence":"<high|medium|low>","data_gaps":<true|false>}
Candidate: ${candidate.name}, ${candidate.state}-${district}, ${party}, ${candidate.incumbentStatus ?? 'challenger'}
Record: ${candidate.knownPositions ?? 'No public record available'}
Fossil fuel donations: ${candidate.fossilFuelDonations ?? 'unknown'}`
}
