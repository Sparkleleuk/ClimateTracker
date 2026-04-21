import Anthropic from '@anthropic-ai/sdk'
import { TIERS } from '../../lib/constants/tiers.js'
import { buildHouseTier1Prompt, buildHouseTier2Prompt } from '../../lib/prompts/housePrompts.js'
import { computeAlgorithmicScore } from '../../lib/scoring/algorithmicScore.js'
import { logApiCall } from '../../lib/utils/costTracker.js'

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

function buildGovernorPrompt(candidate) {
  return `You are a nonpartisan climate policy analyst. Analyze this US gubernatorial candidate's environmental record and state-level climate positions.

Candidate: ${candidate.name}
Party: ${PARTY_LABEL[candidate.party]}
State: ${candidate.state}
Office: Governor of ${candidate.state}
Race Competitiveness: ${candidate.raceCompetitiveness}
Known Positions: ${candidate.knownPositions}
Fossil Fuel Donation Level: ${candidate.fossilFuelDonations}

Governors have distinct state-level climate powers. Focus your analysis on:
- State renewable energy standards and utility regulation authority
- State climate targets and executive orders (e.g., 100% clean electricity mandates)
- State land use, natural resource management, and public lands oversight
- State building codes and appliance efficiency standards
- Disaster preparedness, climate resilience, and emergency response
- Environmental justice at the state level
- The governor's relationship with or opposition to federal climate policy
- State-specific climate vulnerabilities (wildfire, flooding, drought, sea level rise, heat)

Provide:
1. CLIMATE SCORE (0-100): Score their climate record/proposals for a governor's office. 0=actively blocking climate action, 50=mixed/status quo, 100=ambitious state climate leader. State the number clearly as "SCORE: XX/100"

2. POLICY ANALYSIS (3-4 sentences): What do we know about their state climate record or proposals? What state-level powers would they use (or not use)?

3. STRENGTHS: 1-2 climate policy strengths relevant to a governor's powers (or "None identified")

4. CONCERNS: 1-2 climate policy concerns or gaps at the state level

5. KEY ISSUES TO WATCH: What state-level climate topics are most relevant for ${candidate.state} under this candidate's potential governorship?

6. ISSUE TAGS: From the list below, select all tags that are relevant to this candidate's record or positions. Output them as a comma-separated list on a single line, exactly as: "TAGS: tag-value-1, tag-value-2, ..."
Only include tags where the candidate has a clear, demonstrable position or record. Do not tag issues where the record is absent or entirely unknown.

Available tags:
${ISSUE_TAG_LIST}

Be factual, cite ${candidate.state}'s specific climate vulnerabilities and state policy context, and note data gaps where the record is thin. Be nonpartisan — score based on climate science alignment, not party affiliation.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { candidate, forceFullAnalysis } = req.body
  if (!candidate) {
    return res.status(400).json({ error: 'candidate is required' })
  }

  const isHouse = candidate.officeType === 'us_house'
  const candidateTier = candidate.tier ?? null

  // --- Tier 3: algorithmic score (no API call) ---
  if (isHouse && candidateTier === 3 && !forceFullAnalysis) {
    const result = computeAlgorithmicScore(candidate)

    // Persist to Supabase if candidate has a DB id
    if (candidate.id) {
      try {
        const { supabase } = await import('../../lib/supabaseClient.js')
        await supabase.from('candidates').update({
          climate_score:    result.score,
          climate_analysis: result.summary,
          issue_tags:       [],
        }).eq('id', candidate.id)
      } catch (dbErr) {
        console.error('Failed to persist algorithmic score to Supabase:', dbErr)
      }
    }

    return res.status(200).json({
      text:   result.summary,
      score:  result.score,
      issues: [],
      scoreSource: result.scoreSource,
      disclaimer:  result.disclaimer,
      stances:     result.stances,
      confidence:  result.confidence,
    })
  }

  // --- Tier 2: compressed House prompt, parse JSON response ---
  if (isHouse && candidateTier === 2 && !forceFullAnalysis) {
    try {
      const prompt = buildHouseTier2Prompt(candidate)

      const stream = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: TIERS.TIER_2.maxTokensOutput,
        messages: [{ role: 'user', content: prompt }],
      })

      const message = await stream.finalMessage()
      const rawText = message.content
        .map(b => (b.type === 'text' ? b.text : ''))
        .join('')

      // Parse the JSON response
      let parsed = {}
      try {
        // Strip any accidental markdown fences
        const cleaned = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
        parsed = JSON.parse(cleaned)
      } catch {
        console.warn('[analyze] Tier 2 JSON parse failed, returning raw text')
        parsed = { score: null, summary: rawText }
      }

      const score = typeof parsed.score === 'number' ? parsed.score : null
      const text  = parsed.summary ?? rawText

      // Log cost
      await logApiCall({
        candidateId:    candidate.id,
        tier:           2,
        tokensInput:    message.usage?.input_tokens ?? 0,
        tokensOutput:   message.usage?.output_tokens ?? 0,
        model:          'claude-haiku-4-5-20251001',
        batchOrRealtime: 'realtime',
      })

      // Persist to Supabase
      if (candidate.id) {
        try {
          const { supabase } = await import('../../lib/supabaseClient.js')
          await supabase.from('candidates').update({
            climate_score:    score,
            climate_analysis: text,
            issue_tags:       [],
          }).eq('id', candidate.id)
        } catch (dbErr) {
          console.error('Failed to persist Tier 2 analysis to Supabase:', dbErr)
        }
      }

      return res.status(200).json({ text, score, issues: [] })
    } catch (err) {
      console.error('Anthropic API error (Tier 2):', err)
      const status = err.status ?? 500
      return res.status(status).json({ error: err.message ?? 'Analysis failed' })
    }
  }

  // --- Tier 1 / Senate / Governor / forceFullAnalysis: full prompt ---
  try {
    let prompt
    if (isHouse) {
      // Tier 1 House or forceFullAnalysis upgrade
      prompt = buildHouseTier1Prompt(candidate)
    } else if (candidate.officeType === 'governor') {
      prompt = buildGovernorPrompt(candidate)
    } else {
      prompt = buildPrompt(candidate)
    }

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: TIERS.TIER_1.maxTokensOutput,
      messages: [{ role: 'user', content: prompt }],
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

    // Log cost
    await logApiCall({
      candidateId:    candidate.id,
      tier:           isHouse ? (forceFullAnalysis ? 'upgrade' : 1) : null,
      tokensInput:    message.usage?.input_tokens ?? 0,
      tokensOutput:   message.usage?.output_tokens ?? 0,
      model:          'claude-opus-4-6',
      batchOrRealtime: 'realtime',
    })

    // Persist to Supabase if candidate has a DB id
    if (candidate.id) {
      try {
        const { supabase } = await import('../../lib/supabaseClient.js')
        await supabase.from('candidates').update({
          climate_score:    score,
          climate_analysis: text,
          issue_tags:       issues,
        }).eq('id', candidate.id)
      } catch (dbErr) {
        console.error('Failed to persist analysis to Supabase:', dbErr)
      }
    }

    return res.status(200).json({ text, score, issues })
  } catch (err) {
    console.error('Anthropic API error:', err)
    const status = err.status ?? 500
    return res.status(status).json({ error: err.message ?? 'Analysis failed' })
  }
}
