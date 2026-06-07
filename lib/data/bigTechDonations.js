/**
 * Big Tech PAC donation fetcher.
 * Queries FEC API for donations from major tech company PACs to a candidate.
 * Caches results in the big_tech_donations Supabase table with a 30-day TTL.
 *
 * Requires FEC_API_KEY environment variable. Degrades gracefully to 'unknown' if absent.
 */

const FEC_BASE = 'https://api.open.fec.gov/v1'

// Known FEC committee IDs for major tech company PACs
const BIG_TECH_PACS = {
  'Alphabet/Google': 'C00428623',
  'Microsoft':       'C00115568',
  'Meta':            'C00448050',
  'Amazon':          'C00360354',
  'Apple':           'C00413120',
  'NVIDIA':          'C00513788',
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Classify total Big Tech PAC donations into a level string.
 *
 * @param {number} totalUSD
 * @returns {'high'|'moderate'|'low'|'none'}
 */
function classifyDonationLevel(totalUSD) {
  if (totalUSD > 10_000) return 'high'
  if (totalUSD >= 1_000)  return 'moderate'
  if (totalUSD > 0)       return 'low'
  return 'none'
}

/**
 * Find a candidate's principal campaign committee ID via FEC API name search.
 *
 * @param {string} name
 * @param {string} state
 * @param {string} apiKey
 * @returns {Promise<string|null>}
 */
async function findCandidateCommitteeId(name, state, apiKey) {
  try {
    const params = new URLSearchParams({
      q:       name,
      state:   state,
      cycle:   '2026',
      api_key: apiKey,
      per_page: '5',
    })
    const res = await fetch(`${FEC_BASE}/candidates/?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const data = await res.json()
    const candidate = data.results?.[0]
    if (!candidate) return null

    // Get principal campaign committee
    const cmteRes = await fetch(
      `${FEC_BASE}/candidate/${candidate.candidate_id}/committees/?api_key=${apiKey}&designation=P`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!cmteRes.ok) return null
    const cmteData = await cmteRes.json()
    return cmteData.results?.[0]?.committee_id ?? null
  } catch {
    return null
  }
}

/**
 * Query donations from a specific Big Tech PAC to a candidate's committee.
 *
 * @param {string} techPacId
 * @param {string} candidateCommitteeId
 * @param {string} apiKey
 * @returns {Promise<number>} Total amount in USD
 */
async function queryPacDonations(techPacId, candidateCommitteeId, apiKey) {
  try {
    const params = new URLSearchParams({
      committee_id:             candidateCommitteeId,
      contributor_committee_id: techPacId,
      two_year_transaction_period: '2026',
      api_key: apiKey,
      per_page: '10',
    })
    const res = await fetch(`${FEC_BASE}/schedules/schedule_a/?${params}`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return 0

    const data = await res.json()
    return (data.results ?? []).reduce((sum, r) => sum + (r.contribution_receipt_amount ?? 0), 0)
  } catch {
    return 0
  }
}

/**
 * Get Big Tech PAC donation level for a candidate.
 * Returns cached result if fresh (< 30 days old).
 *
 * @param {number} candidateId
 * @param {string} candidateName
 * @param {string} state
 * @returns {Promise<{level: string, byCompany: Object}>}
 */
export async function getBigTechDonations(candidateId, candidateName, state) {
  let supabase = null
  try {
    const mod = await import('../supabaseClient.js')
    supabase = mod.supabase
  } catch { /* Supabase unavailable */ }

  // Check cache
  if (supabase && candidateId) {
    try {
      const { data } = await supabase
        .from('big_tech_donations')
        .select('donation_level, donations_by_company, fetched_at')
        .eq('candidate_id', candidateId)
        .single()

      if (data && data.fetched_at) {
        const age = Date.now() - new Date(data.fetched_at).getTime()
        if (age < THIRTY_DAYS_MS) {
          return { level: data.donation_level, byCompany: data.donations_by_company ?? {} }
        }
      }
    } catch { /* Cache miss — proceed to fetch */ }
  }

  const apiKey = process.env.FEC_API_KEY
  if (!apiKey) {
    return { level: 'unknown', byCompany: {} }
  }

  try {
    const committeeId = await findCandidateCommitteeId(candidateName, state, apiKey)
    if (!committeeId) {
      return { level: 'unknown', byCompany: {} }
    }

    const byCompany = {}
    let total = 0

    for (const [company, pacId] of Object.entries(BIG_TECH_PACS)) {
      const amount = await queryPacDonations(pacId, committeeId, apiKey)
      if (amount > 0) byCompany[company] = amount
      total += amount
    }

    const level = classifyDonationLevel(total)

    // Cache result
    if (supabase && candidateId) {
      try {
        await supabase.from('big_tech_donations').upsert({
          candidate_id:       candidateId,
          candidate_name:     candidateName,
          state,
          donation_level:     level,
          donations_by_company: byCompany,
          fetched_at:         new Date().toISOString(),
        }, { onConflict: 'candidate_id' })
      } catch { /* Non-critical */ }
    }

    return { level, byCompany }
  } catch (err) {
    console.error('[bigTechDonations] Fetch failed:', err.message)
    return { level: 'unknown', byCompany: {} }
  }
}
