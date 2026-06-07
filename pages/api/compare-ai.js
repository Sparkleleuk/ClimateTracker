/**
 * AI Policy Comparison API route.
 * Compares two candidates on a specific AI policy dimension.
 * Independent of the climate comparison system.
 * Uses raw fetch per spec.
 */
import { AI_DIMENSIONS } from '../../lib/constants/aiDimensions.js'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const DIMENSION_LABELS = Object.fromEntries(
  Object.entries(AI_DIMENSIONS).map(([k, v]) => [k, v.label])
)

function buildPrompt(c1, c2, dimension) {
  const dimLabel = DIMENSION_LABELS[dimension] ?? dimension

  const fmt = c => [
    `Name: ${c.name}`,
    `Party: ${c.party}`,
    `State: ${c.state}`,
    `Office: ${c.office}`,
    `Known Positions: ${c.known_positions ?? c.knownPositions ?? 'None on record'}`,
    c.ai_policy_score != null ? `Overall AI Policy Score: ${c.ai_policy_score}/100` : '',
  ].filter(Boolean).join('\n')

  return `You are a nonpartisan technology policy analyst. Compare these two candidates specifically on their "${dimLabel}" AI policy positions.

IMPORTANT: Do not consider climate positions. Focus only on AI and data center policy.

CANDIDATE 1:
${fmt(c1)}

CANDIDATE 2:
${fmt(c2)}

Respond in valid JSON only — no markdown, no code fences, no extra text. Use exactly this structure:
{
  "candidate1Position": "2-3 sentences describing ${c1.name}'s specific position or record on ${dimLabel}",
  "candidate2Position": "2-3 sentences describing ${c2.name}'s specific position or record on ${dimLabel}",
  "keyDifference": "One sentence describing the core difference between them on this dimension",
  "winner": "${c1.name} or ${c2.name} or Tie",
  "winnerReason": "One sentence explaining which candidate has the stronger AI policy record on ${dimLabel} and why"
}

Be factual and nonpartisan. If their record on this specific dimension is thin or unknown, say so clearly.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { candidate1Id, candidate2Id, dimension } = req.body
  if (!candidate1Id || !candidate2Id || !dimension) {
    return res.status(400).json({ error: 'candidate1Id, candidate2Id, and dimension are required' })
  }

  if (!AI_DIMENSIONS[dimension]) {
    return res.status(400).json({ error: `Unknown dimension: ${dimension}. Valid: ${Object.keys(AI_DIMENSIONS).join(', ')}` })
  }

  const id1 = Math.min(candidate1Id, candidate2Id)
  const id2 = Math.max(candidate1Id, candidate2Id)

  let supabase = null
  try {
    const mod = await import('../../lib/supabaseClient.js')
    supabase = mod.supabase
  } catch { /* proceed without cache */ }

  // --- Fetch candidates ---
  let c1, c2
  if (supabase) {
    const [r1, r2] = await Promise.all([
      supabase.from('candidates').select('*').eq('id', candidate1Id).single(),
      supabase.from('candidates').select('*').eq('id', candidate2Id).single(),
    ])
    c1 = r1.data
    c2 = r2.data
  }

  if (!c1 || !c2) {
    return res.status(404).json({ error: 'One or both candidates not found' })
  }

  // --- Check cache ---
  if (supabase) {
    const { data: cached } = await supabase
      .from('comparisons')
      .select('result')
      .eq('candidate1_id', id1)
      .eq('candidate2_id', id2)
      .eq('issue', dimension)
      .eq('comparison_type', 'ai_policy')
      .single()

    if (cached?.result) {
      return res.status(200).json(cached.result)
    }
  }

  // --- Call Claude ---
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: buildPrompt(c1, c2, dimension) }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err.error?.message ?? 'API error' })
    }

    const data = await response.json()
    const text = (data.content ?? []).map(b => b.type === 'text' ? b.text : '').join('')

    let comparison
    try {
      comparison = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Could not parse response as JSON')
      comparison = JSON.parse(match[0])
    }

    // Persist
    if (supabase) {
      await supabase.from('comparisons').upsert({
        candidate1_id:   id1,
        candidate2_id:   id2,
        issue:           dimension,
        comparison_type: 'ai_policy',
        result:          comparison,
      })
    }

    return res.status(200).json(comparison)
  } catch (err) {
    console.error('[compare-ai] Error:', err)
    return res.status(500).json({ error: err.message ?? 'Comparison failed' })
  }
}
