import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const PARTY_LABEL = { D: 'Democrat', R: 'Republican', I: 'Independent' }

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
      max_tokens: 1000,
      messages: [{ role: 'user', content: buildPrompt(candidate) }],
    })

    const message = await stream.finalMessage()
    const text = message.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')

    const scoreMatch = text.match(/SCORE:\s*(\d+)\/100/i)
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null

    return res.status(200).json({ text, score })
  } catch (err) {
    console.error('Anthropic API error:', err)
    const status = err.status ?? 500
    return res.status(status).json({ error: err.message ?? 'Analysis failed' })
  }
}
