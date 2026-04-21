/**
 * API cost tracking utility.
 * Estimates cost per API call and logs to the Supabase api_usage table.
 * All database operations are wrapped in try/catch — the table may not exist yet.
 */

// Pricing per 1,000 tokens (in USD)
const MODEL_PRICING = {
  'claude-opus-4-6': {
    input: 0.015,
    output: 0.075,
  },
  // claude-haiku variants
  'claude-haiku-4-5-20251001': {
    input: 0.0008,
    output: 0.004,
  },
  'claude-haiku': {
    input: 0.0008,
    output: 0.004,
  },
}

/**
 * Estimate cost for a given model and token counts.
 *
 * @param {string} model
 * @param {number} tokensInput
 * @param {number} tokensOutput
 * @returns {number} Estimated cost in USD
 */
function estimateCost(model, tokensInput, tokensOutput) {
  // Find pricing — try exact match first, then prefix match
  let pricing = MODEL_PRICING[model]
  if (!pricing) {
    for (const [key, val] of Object.entries(MODEL_PRICING)) {
      if (model.startsWith(key) || key.startsWith(model.split('-').slice(0, 2).join('-'))) {
        pricing = val
        break
      }
    }
  }
  // Default to Opus pricing if unknown (conservative / safe)
  if (!pricing) pricing = MODEL_PRICING['claude-opus-4-6']

  const inputCost = (tokensInput / 1000) * pricing.input
  const outputCost = (tokensOutput / 1000) * pricing.output
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000 // round to 6 decimal places
}

/**
 * Log an API call to the Supabase api_usage table and return estimated cost.
 *
 * @param {Object} params
 * @param {string|number} params.candidateId
 * @param {number} params.tier - 1, 2, or 3
 * @param {number} params.tokensInput
 * @param {number} params.tokensOutput
 * @param {string} params.model
 * @param {'batch'|'realtime'} params.batchOrRealtime
 * @returns {number} Estimated cost in USD
 */
export async function logApiCall({ candidateId, tier, tokensInput, tokensOutput, model, batchOrRealtime }) {
  const estimatedCost = estimateCost(model, tokensInput ?? 0, tokensOutput ?? 0)

  try {
    const { supabase } = await import('../supabaseClient.js')
    await supabase.from('api_usage').insert({
      candidate_id:   candidateId ?? null,
      tier:           tier ?? null,
      tokens_input:   tokensInput ?? 0,
      tokens_output:  tokensOutput ?? 0,
      model:          model ?? null,
      call_type:      batchOrRealtime ?? 'realtime',
      estimated_cost: estimatedCost,
      created_at:     new Date().toISOString(),
    })
  } catch {
    // Silently ignore — table may not exist yet
  }

  return estimatedCost
}

/**
 * Query the api_usage table and return the total estimated spend.
 *
 * @returns {number|null} Total spend in USD, or null if table does not exist / query fails
 */
export async function getTotalCost() {
  try {
    const { supabase } = await import('../supabaseClient.js')
    const { data, error } = await supabase
      .from('api_usage')
      .select('estimated_cost')

    if (error) return null

    const total = (data ?? []).reduce((sum, row) => sum + (row.estimated_cost ?? 0), 0)
    return Math.round(total * 1_000_000) / 1_000_000
  } catch {
    return null
  }
}
