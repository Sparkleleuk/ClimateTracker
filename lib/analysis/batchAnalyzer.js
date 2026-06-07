/**
 * Anthropic Messages Batch API integration for Tier 2 House candidates.
 *
 * NOTE: Due to Vercel's serverless timeout limits (~60s for Hobby, up to 300s for Pro),
 * batch submission and result processing must run as separate API calls (or a background
 * job), not in the same request. Batch results typically take minutes to hours to
 * complete on Anthropic's side.
 *
 * Workflow:
 *   1. Call submitBatchAnalysis(candidates) → returns batchId
 *   2. Poll Anthropic API until batch status = "ended"
 *   3. Call processBatchResults(batchId) → saves results to Supabase analyses_lite table
 */

import { buildHouseTier2Prompt } from '../prompts/housePrompts.js'
import { buildAIPolicyTier2Prompt } from '../prompts/aiPolicyPrompts.js'
import { getBigTechDonations } from '../data/bigTechDonations.js'

const ANTHROPIC_BATCH_URL = 'https://api.anthropic.com/v1/messages/batches'
const BATCH_MODEL = 'claude-haiku-4-5-20251001'
const BATCH_MAX_TOKENS = 300
const ANTHROPIC_VERSION = '2023-06-01'
const ANTHROPIC_BETA = 'message-batches-2024-09-24'

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY environment variable not set')
  return key
}

/**
 * Submit a batch of candidates for analysis.
 *
 * @param {Array} candidates - Array of candidate objects
 * @param {'climate'|'ai_policy'} analysisType - Which scoring system to use (default: 'climate')
 * @returns {string} The Anthropic batch ID
 */
export async function submitBatchAnalysis(candidates, analysisType = 'climate') {
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates provided for batch analysis')
  }

  const requests = await Promise.all(candidates.map(async (candidate, index) => {
    const customId = candidate.id
      ? `${analysisType}-${candidate.id}`
      : `${analysisType}-idx-${index}`

    let prompt
    if (analysisType === 'ai_policy') {
      // Fetch Big Tech donation level for AI policy prompt
      const bigTechResult = await getBigTechDonations(
        candidate.id ?? null,
        candidate.name,
        candidate.state
      ).catch(() => ({ level: 'unknown' }))

      prompt = buildAIPolicyTier2Prompt({
        name:             candidate.name,
        state:            candidate.state,
        district:         candidate.district ?? null,
        party:            candidate.party,
        knownPositions:   candidate.known_positions ?? candidate.knownPositions ?? '',
        bigTechDonations: bigTechResult.level,
      })
    } else {
      // Default: climate analysis
      prompt = buildHouseTier2Prompt(candidate)
    }

    return {
      custom_id: customId,
      params: {
        model:      BATCH_MODEL,
        max_tokens: BATCH_MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      },
    }
  }))

  const res = await fetch(ANTHROPIC_BATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getApiKey(),
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': ANTHROPIC_BETA,
    },
    body: JSON.stringify({ requests }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Anthropic batch submission failed: ${res.status} — ${err.error?.message ?? JSON.stringify(err)}`)
  }

  const data = await res.json()
  const batchId = data.id

  console.log(`[batchAnalyzer] Batch submitted. ID: ${batchId}, ${candidates.length} requests.`)
  console.log(`[batchAnalyzer] Status: ${data.processing_status}`)

  return batchId
}

/**
 * Fetch and process results from a completed Anthropic batch.
 * Saves each result to the Supabase analyses_lite table.
 *
 * NOTE: This will fail (or return empty) if the batch is not yet complete.
 * Poll GET /v1/messages/batches/{id} first to check processing_status === "ended".
 *
 * @param {string} batchId - The Anthropic batch ID returned by submitBatchAnalysis
 * @returns {Object} Summary of processed results
 */
export async function processBatchResults(batchId) {
  if (!batchId) throw new Error('batchId is required')

  const resultsUrl = `${ANTHROPIC_BATCH_URL}/${batchId}/results`

  const res = await fetch(resultsUrl, {
    headers: {
      'x-api-key': getApiKey(),
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-beta': ANTHROPIC_BETA,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Failed to fetch batch results: ${res.status} — ${err.error?.message ?? JSON.stringify(err)}`)
  }

  // Results are returned as newline-delimited JSON (NDJSON)
  const text = await res.text()
  const lines = text.split('\n').filter(l => l.trim())

  const summary = { processed: 0, errors: 0, skipped: 0 }

  let supabase = null
  try {
    const mod = await import('../supabaseClient.js')
    supabase = mod.supabase
  } catch (err) {
    console.warn('[batchAnalyzer] Could not load Supabase client:', err.message)
  }

  for (const line of lines) {
    let result
    try {
      result = JSON.parse(line)
    } catch {
      summary.errors++
      continue
    }

    if (result.result?.type !== 'succeeded') {
      console.warn(`[batchAnalyzer] Non-success result for ${result.custom_id}:`, result.result?.type)
      summary.errors++
      continue
    }

    const content = result.result?.message?.content?.[0]?.text ?? ''
    let parsed

    try {
      parsed = JSON.parse(content)
    } catch {
      console.warn(`[batchAnalyzer] Could not parse JSON for ${result.custom_id}:`, content.slice(0, 100))
      summary.errors++
      continue
    }

    // Extract analysis type and candidate ID from custom_id
    // Formats: "climate-42", "ai_policy-42", "candidate-42" (legacy)
    const idMatch = result.custom_id.match(/(?:climate|ai_policy|candidate)-(\d+)$/)
    const candidateId = idMatch ? parseInt(idMatch[1], 10) : null
    const isAiPolicy = result.custom_id.startsWith('ai_policy-')

    if (!candidateId) {
      summary.skipped++
      continue
    }

    if (supabase) {
      try {
        const now = new Date().toISOString()

        if (isAiPolicy) {
          // Save AI policy lite analysis
          await supabase.from('ai_analyses_lite').upsert({
            candidate_id:    candidateId,
            ai_policy_score: parsed.ai_score ?? null,
            ai_summary:      parsed.summary ?? null,
            stances:         parsed.stances ?? null,
            score_source:    `batch:${batchId}`,
            updated_at:      now,
          }, { onConflict: 'candidate_id' })

          await supabase.from('candidates').update({
            ai_policy_score:    parsed.ai_score ?? null,
            ai_score_updated_at: now,
          }).eq('id', candidateId)
        } else {
          // Save climate lite analysis (original behavior)
          await supabase.from('analyses_lite').upsert({
            candidate_id: candidateId,
            batch_id:     batchId,
            score:        parsed.score ?? null,
            summary:      parsed.summary ?? null,
            stances:      parsed.stances ?? null,
            confidence:   parsed.confidence ?? null,
            data_gaps:    parsed.data_gaps ?? null,
            created_at:   now,
          }, { onConflict: 'candidate_id' })

          await supabase.from('candidates').update({
            climate_score:    parsed.score ?? null,
            climate_analysis: parsed.summary ?? null,
          }).eq('id', candidateId)
        }

        summary.processed++
      } catch (dbErr) {
        console.error(`[batchAnalyzer] DB error for candidate ${candidateId}:`, dbErr.message)
        summary.errors++
      }
    } else {
      summary.skipped++
    }
  }

  console.log(`[batchAnalyzer] Results processed: ${summary.processed} saved, ${summary.errors} errors, ${summary.skipped} skipped`)
  return summary
}
