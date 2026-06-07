/**
 * AI bill co-sponsorship tracker.
 * Queries Congress.gov API for co-sponsors of key AI-related bills.
 * Caches results in the ai_bill_cosponsors Supabase table with a 7-day TTL.
 *
 * Requires CONGRESS_API_KEY environment variable. Degrades gracefully if absent.
 */

const CONGRESS_BASE = 'https://api.congress.gov/v3'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Key AI-related bills to track, with search terms for Congress.gov.
 * Congress and bill numbers change each session — we search by keyword.
 */
const AI_BILLS = [
  { key: 'DEFIANCE Act',                  keywords: 'DEFIANCE deepfake nonconsensual' },
  { key: 'NO FAKES Act',                  keywords: 'NO FAKES AI likeness voice' },
  { key: 'AI Transparency in Elections',  keywords: 'AI transparency elections political' },
  { key: 'Algorithmic Accountability Act',keywords: 'algorithmic accountability automated' },
  { key: 'Future of AI Innovation Act',   keywords: 'Future AI Innovation' },
  { key: 'CREATE AI Act',                 keywords: 'CREATE AI compensation artists' },
]

/**
 * Normalize a name for fuzzy matching against Congress.gov member data.
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|md|phd)\b\.?/gi, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if a member matches the candidate name.
 */
function memberMatchesCandidate(member, candidateName) {
  const normalized = normalizeName(candidateName)
  const memberFull = normalizeName(member.name ?? '')
  return memberFull.includes(normalized.split(' ').pop()) &&
         memberFull.includes(normalized.split(' ')[0])
}

/**
 * Search Congress.gov for a bill and return its co-sponsors.
 *
 * @param {string} keywords
 * @param {string} apiKey
 * @returns {Promise<Array>} Array of {bioguideId, name, state, party}
 */
async function fetchBillCosponsors(keywords, apiKey) {
  try {
    const searchParams = new URLSearchParams({
      query:   keywords,
      api_key: apiKey,
      limit:   '5',
      sort:    'relevanceScore+desc',
    })
    const searchRes = await fetch(
      `${CONGRESS_BASE}/bill?${searchParams}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!searchRes.ok) return []

    const searchData = await searchRes.json()
    const bill = searchData.bills?.[0]
    if (!bill) return []

    const { congress, type, number } = bill
    const cosponsorRes = await fetch(
      `${CONGRESS_BASE}/bill/${congress}/${type.toLowerCase()}/${number}/cosponsors?api_key=${apiKey}&limit=250`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!cosponsorRes.ok) return []

    const cosponsorData = await cosponsorRes.json()
    return (cosponsorData.cosponsors ?? []).map(c => ({
      bioguideId: c.bioguideId,
      name:       c.fullName ?? c.lastName,
      state:      c.state,
      party:      c.party,
    }))
  } catch {
    return []
  }
}

/**
 * Get AI bills a candidate has sponsored or co-sponsored.
 * Returns cached result if fresh (< 7 days old).
 *
 * @param {string} candidateName
 * @param {string} state
 * @returns {Promise<string[]>} Array of bill names
 */
export async function getAIBills(candidateName, state) {
  let supabase = null
  try {
    const mod = await import('../supabaseClient.js')
    supabase = mod.supabase
  } catch { /* Supabase unavailable */ }

  // Check cache
  if (supabase) {
    try {
      const { data } = await supabase
        .from('ai_bill_cosponsors')
        .select('bills, fetched_at')
        .eq('candidate_name', candidateName)
        .eq('state', state)
        .single()

      if (data && data.fetched_at) {
        const age = Date.now() - new Date(data.fetched_at).getTime()
        if (age < SEVEN_DAYS_MS) {
          return data.bills ?? []
        }
      }
    } catch { /* Cache miss */ }
  }

  const apiKey = process.env.CONGRESS_API_KEY
  if (!apiKey) {
    return []
  }

  try {
    const sponsoredBills = []

    for (const bill of AI_BILLS) {
      const cosponsors = await fetchBillCosponsors(bill.keywords, apiKey)
      const isCoSponsor = cosponsors.some(c =>
        memberMatchesCandidate(c, candidateName) && c.state === state
      )
      if (isCoSponsor) sponsoredBills.push(bill.key)
    }

    // Cache result
    if (supabase) {
      try {
        await supabase.from('ai_bill_cosponsors').upsert({
          candidate_name: candidateName,
          state,
          bills:          sponsoredBills,
          fetched_at:     new Date().toISOString(),
        }, { onConflict: 'candidate_name, state' })
      } catch { /* Non-critical */ }
    }

    return sponsoredBills
  } catch (err) {
    console.error('[aiBillsTracker] Fetch failed:', err.message)
    return []
  }
}
