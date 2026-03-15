const PARTY_LABEL = { D: 'Democrat', R: 'Republican', I: 'Independent' }

function buildPrompt(c1, c2, issue) {
  const fmt = c => [
    `Name: ${c.name}`,
    `Party: ${PARTY_LABEL[c.party]}`,
    `State: ${c.state}`,
    `Known Positions: ${c.knownPositions}`,
    c.climateAnalysis ? `AI Analysis: ${c.climateAnalysis.slice(0, 600)}...` : '',
    c.climateScore != null ? `Overall Climate Score: ${c.climateScore}/100` : '',
  ].filter(Boolean).join('\n')

  return `You are a nonpartisan climate policy analyst. Compare these two US Senate candidates specifically on the issue of "${issue}".

CANDIDATE 1:
${fmt(c1)}

CANDIDATE 2:
${fmt(c2)}

Respond in valid JSON only — no markdown, no code fences, no extra text. Use exactly this structure:
{
  "candidate1Position": "2-3 sentences describing ${c1.name}'s specific position or record on ${issue}",
  "candidate2Position": "2-3 sentences describing ${c2.name}'s specific position or record on ${issue}",
  "keyDifference": "One sentence describing the core difference between them on this issue",
  "winner": "${c1.name} or ${c2.name} or Tie",
  "winnerReason": "One sentence explaining which candidate has the stronger climate record on ${issue} and why"
}

Be factual and nonpartisan. If their record on this specific issue is thin or unknown, say so clearly.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { candidate1, candidate2, issue } = req.body
  if (!candidate1 || !candidate2 || !issue) {
    return res.status(400).json({ error: 'candidate1, candidate2, and issue are required' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: buildPrompt(candidate1, candidate2, issue) }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err.error?.message ?? 'API error' })
    }

    const data = await response.json()
    const text = data.content.map(b => b.type === 'text' ? b.text : '').join('')

    let comparison
    try {
      comparison = JSON.parse(text)
    } catch {
      // Try to extract JSON if there's surrounding text
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Could not parse response as JSON')
      comparison = JSON.parse(match[0])
    }

    return res.status(200).json(comparison)
  } catch (err) {
    console.error('Compare API error:', err)
    return res.status(500).json({ error: err.message ?? 'Comparison failed' })
  }
}
