import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const PARTY_LABEL = { D: 'Democrat', R: 'Republican', I: 'Independent' }

const ISSUE_TAGS = [
  { value: 'clean-energy',  label: 'Clean energy transition' },
  { value: 'fossil-fuel',   label: 'Fossil fuel policy' },
  { value: 'carbon-pricing',label: 'Carbon pricing' },
  { value: 'nuclear',       label: 'Nuclear energy' },
  { value: 'grid',          label: 'Energy grid modernization' },
  { value: 'buildings',     label: 'Building decarbonization' },
  { value: 'ev',            label: 'Electric vehicles' },
  { value: 'transit',       label: 'Public transit' },
  { value: 'aviation',      label: 'Aviation & shipping' },
  { value: 'public-lands',  label: 'Public lands' },
  { value: 'water',         label: 'Water rights & quality' },
  { value: 'forests',       label: 'Deforestation & reforestation' },
  { value: 'biodiversity',  label: 'Biodiversity & endangered species' },
  { value: 'agriculture',   label: 'Agriculture & soil' },
  { value: 'ocean',         label: 'Ocean policy' },
  { value: 'air-quality',   label: 'Air quality' },
  { value: 'chemicals',     label: 'Chemical regulation' },
  { value: 'plastics',      label: 'Plastic pollution' },
  { value: 'env-justice',   label: 'Environmental justice' },
  { value: 'flooding',      label: 'Flood & sea level rise' },
  { value: 'wildfire',      label: 'Wildfire policy' },
  { value: 'drought-heat',  label: 'Drought & heat' },
  { value: 'disaster',      label: 'Disaster resilience' },
  { value: 'paris',         label: 'Paris Agreement' },
  { value: 'climate-finance', label: 'Climate finance' },
  { value: 'methane',       label: 'Methane regulation' },
  { value: 'offsets',       label: 'Carbon offsets & markets' },
  { value: 'epa',           label: 'EPA authority' },
  { value: 'ira',           label: 'Inflation Reduction Act' },
  { value: 'gnd',           label: 'Green New Deal' },
  { value: 'nepa',          label: 'Environmental review (NEPA)' },
  { value: 'disclosure',    label: 'Climate disclosure' },
]

const ISSUE_TAG_LIST = ISSUE_TAGS.map(t => `${t.value} — ${t.label}`).join('\n')

function buildPrompt(candidate) {
  return `You are a nonpartisan climate policy analyst. Analyze this US congressional candidate's environmental record and positions.

Candidate: ${candidate.name}
Party: ${PARTY_LABEL[candidate.party]}
State: ${candidate.state}
Office: ${candidate.office}
Race Competitiveness: ${candidate.raceCompetitiveness}
Known Positions: ${candidate.knownPositions}
Fossil Fuel Donation Level: ${candidate.fossilFuelDonations}

Provide:
1. CLIMATE SCORE (0-100): Score their climate record/proposals. 0=climate denier/fossil fuel champion, 50=mixed/moderate, 100=ambitious climate leader. State the number clearly as "SCORE: XX/100"

2. POLICY ANALYSIS (3-4 sentences): What do we know about their climate record? What are their key positions?

3. STRENGTHS: 1-2 climate policy strengths (or "None identified")

4. CONCERNS: 1-2 climate policy concerns or gaps

5. KEY ISSUES TO WATCH: What climate topics are most relevant for their state/race?

6. ISSUE TAGS: From the list below, select all tags that are relevant to this candidate's record or positions. Output them as a comma-separated list on a single line, exactly as: "TAGS: tag-value-1, tag-value-2, ..."
Only include tags where the candidate has a clear, demonstrable position or record. Do not tag issues where the record is absent or entirely unknown.

Available tags:
${ISSUE_TAG_LIST}

Be factual, cite their state's specific climate vulnerabilities, and note data gaps where the record is thin. Be nonpartisan — score based on climate science alignment, not party affiliation.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { candidate } = req.body
  if (!candidate) {
    return res.status(400).json({ error: 'candidate is required' })
  }

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: buildPrompt(candidate) }],
    })

    const message = await stream.finalMessage()
    const text = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')

    const scoreMatch = text.match(/SCORE:\s*(\d+)\/100/i)
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null

    const tagsMatch = text.match(/TAGS:\s*([^\n]+)/i)
    const issues = tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim()).filter(t => ISSUE_TAGS.some(it => it.value === t))
      : []

    return res.status(200).json({ text, score, issues })
  } catch (err) {
    console.error('Anthropic API error:', err)
    const status = err.status ?? 500
    return res.status(status).json({ error: err.message ?? 'Analysis failed' })
  }
}
