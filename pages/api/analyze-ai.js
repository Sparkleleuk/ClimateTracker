/**
 * AI Policy Analysis API route.
 * Completely independent of the climate scoring system.
 * Uses raw fetch (no SDK) per spec.
 */
import { buildAIPolicyTier1Prompt, buildAIPolicyTier2Prompt } from '../../lib/prompts/aiPolicyPrompts.js'
import { getBigTechDonations } from '../../lib/data/bigTechDonations.js'
import { getAIBills } from '../../lib/data/aiBillsTracker.js'
import { getDataCenterInfo } from '../../lib/data/dataCenterDistricts.js'
import { logApiCall } from '../../lib/utils/costTracker.js'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function getHeaders() {
  return {
    'x-api-key':        process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type':     'application/json',
  }
}

/**
 * Parse the AI policy score from Tier 1 response text.
 */
function parseScore(text) {
  const match = text.match(/SCORE:\s*(\d+)\/100/i)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Parse DIMENSION SCORES JSON block from Tier 1 response text.
 */
function parseDimensionScores(text) {
  try {
    const match = text.match(/\{[^{}]*"datacenters_energy"[^{}]*\}/s)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { candidateId, tier, forceRefresh } = req.body
  if (!candidateId) {
    return res.status(400).json({ error: 'candidateId is required' })
  }

  let supabase = null
  try {
    const mod = await import('../../lib/supabaseClient.js')
    supabase = mod.supabase
  } catch { /* Supabase unavailable — proceed without cache */ }

  // --- Fetch candidate from Supabase ---
  let candidate = null
  if (supabase) {
    const { data } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single()
    candidate = data
  }

  if (!candidate) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  const isFullAnalysis = tier === 1 ||
    candidate.office_type === 'us_senate' ||
    candidate.office_type === 'governor'

  // --- Check cache ---
  if (!forceRefresh && supabase) {
    const table = isFullAnalysis ? 'ai_analyses' : 'ai_analyses_lite'
    const { data: cached } = await supabase
      .from(table)
      .select('*')
      .eq('candidate_id', candidateId)
      .single()

    if (cached?.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age < SEVEN_DAYS_MS) {
        return res.status(200).json({
          score:          cached.ai_policy_score,
          analysis:       cached.ai_analysis ?? cached.ai_summary,
          dimensions:     cached.scores_by_dimension ?? null,
          stances:        cached.stances ?? null,
          cached:         true,
        })
      }
    }
  }

  // --- Assemble context data ---
  const [bigTechResult, aiBills] = await Promise.all([
    getBigTechDonations(candidateId, candidate.name, candidate.state),
    getAIBills(candidate.name, candidate.state),
  ])

  const datacenterInfo = getDataCenterInfo(candidate.state, candidate.district ?? null)

  // --- Build prompt ---
  const promptParams = {
    name:             candidate.name,
    party:            candidate.party,
    state:            candidate.state,
    office:           candidate.office,
    district:         candidate.district ?? null,
    knownPositions:   candidate.known_positions ?? '',
    bigTechDonations: bigTechResult.level,
    aiBills,
    datacenterInfo,
  }

  const prompt = isFullAnalysis
    ? buildAIPolicyTier1Prompt(promptParams)
    : buildAIPolicyTier2Prompt(promptParams)

  const model     = isFullAnalysis ? 'claude-opus-4-6' : 'claude-haiku-4-5-20251001'
  const maxTokens = isFullAnalysis ? 1200 : 300

  // --- Call Claude API ---
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err.error?.message ?? 'API error' })
    }

    const data = await response.json()
    const text = (data.content ?? []).map(b => b.type === 'text' ? b.text : '').join('')
    const tokensIn  = data.usage?.input_tokens ?? 0
    const tokensOut = data.usage?.output_tokens ?? 0

    // Log usage
    await logApiCall({
      candidateId,
      tier:            isFullAnalysis ? 1 : 2,
      tokensInput:     tokensIn,
      tokensOutput:    tokensOut,
      model,
      batchOrRealtime: 'realtime',
      analysisType:    'ai_policy',
    })

    let score, analysis, dimensions, stances

    if (isFullAnalysis) {
      score     = parseScore(text)
      analysis  = text
      dimensions = parseDimensionScores(text)
    } else {
      try {
        const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
        const parsed  = JSON.parse(cleaned)
        score    = parsed.ai_score ?? null
        analysis = parsed.summary ?? text
        stances  = parsed.stances ?? null
      } catch {
        score    = null
        analysis = text
        stances  = null
      }
    }

    // --- Persist to Supabase ---
    if (supabase) {
      const now = new Date().toISOString()

      if (isFullAnalysis) {
        await supabase.from('ai_analyses').upsert({
          candidate_id:       candidateId,
          ai_policy_score:    score,
          ai_analysis:        analysis,
          scores_by_dimension: dimensions,
          data_sources:       { bigTech: bigTechResult, aiBills, datacenterInfo },
          model_version:      model,
          updated_at:         now,
        }, { onConflict: 'candidate_id' })
      } else {
        await supabase.from('ai_analyses_lite').upsert({
          candidate_id:    candidateId,
          ai_policy_score: score,
          ai_summary:      analysis,
          stances,
          score_source:    'claude-haiku-tier2',
          updated_at:      now,
        }, { onConflict: 'candidate_id' })
      }

      // Update candidates table
      await supabase.from('candidates').update({
        ai_policy_score:    score,
        ai_score_updated_at: now,
      }).eq('id', candidateId)
    }

    return res.status(200).json({ score, analysis, dimensions, stances, bigTechLevel: bigTechResult.level, aiBills, cached: false })
  } catch (err) {
    console.error('[analyze-ai] Error:', err)
    return res.status(500).json({ error: err.message ?? 'Analysis failed' })
  }
}
