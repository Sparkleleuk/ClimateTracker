/**
 * OpenStates API integration for state legislature bill sponsorships.
 * Queries https://v3.openstates.org for bills sponsored by a given legislator.
 * Caches results in the state_legislation Supabase table with a 30-day TTL.
 *
 * Requires OPENSTATES_API_KEY — free key at https://openstates.org/accounts/signup/
 * Degrades gracefully if the key is absent or the candidate has no state records.
 */

const OPENSTATES_BASE = 'https://v3.openstates.org'
const THIRTY_DAYS_MS  = 30 * 24 * 60 * 60 * 1000

const STATE_NAME_TO_ABBR = {
  Alabama: 'al',        Alaska: 'ak',         Arizona: 'az',
  Arkansas: 'ar',       California: 'ca',     Colorado: 'co',
  Connecticut: 'ct',    Delaware: 'de',       Florida: 'fl',
  Georgia: 'ga',        Hawaii: 'hi',         Idaho: 'id',
  Illinois: 'il',       Indiana: 'in',        Iowa: 'ia',
  Kansas: 'ks',         Kentucky: 'ky',       Louisiana: 'la',
  Maine: 'me',          Maryland: 'md',       Massachusetts: 'ma',
  Michigan: 'mi',       Minnesota: 'mn',      Mississippi: 'ms',
  Missouri: 'mo',       Montana: 'mt',        Nebraska: 'ne',
  Nevada: 'nv',         'New Hampshire': 'nh', 'New Jersey': 'nj',
  'New Mexico': 'nm',   'New York': 'ny',     'North Carolina': 'nc',
  'North Dakota': 'nd', Ohio: 'oh',           Oklahoma: 'ok',
  Oregon: 'or',         Pennsylvania: 'pa',   'Rhode Island': 'ri',
  'South Carolina': 'sc', 'South Dakota': 'sd', Tennessee: 'tn',
  Texas: 'tx',          Utah: 'ut',           Vermont: 'vt',
  Virginia: 'va',       Washington: 'wa',     'West Virginia': 'wv',
  Wisconsin: 'wi',      Wyoming: 'wy',
}

const AI_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'algorithm',
  'automated decision', 'automation', 'generative ai',
  'large language model', 'facial recognition', 'deepfake',
]

const CLIMATE_KEYWORDS = [
  'climate', 'clean energy', 'renewable energy', 'carbon',
  'emissions', 'greenhouse gas', 'solar', 'wind energy',
  'fossil fuel', 'clean power', 'net zero', 'decarbonization',
]

function isBillRelevant(bill, keywords) {
  const text = `${bill.title ?? ''} ${bill.abstracts?.[0]?.abstract ?? ''}`.toLowerCase()
  return keywords.some(kw => text.includes(kw))
}

function mapBill(bill, relevance) {
  return {
    bill_number:  bill.identifier,
    title:        bill.title,
    description:  bill.abstracts?.[0]?.abstract ?? bill.title,
    status:       bill.latest_action_description ?? 'Unknown',
    session:      bill.session ?? 'Unknown',
    relevance,
  }
}

async function safeFetch(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.json()
}

/**
 * Resolve an OpenStates person ID for a candidate.
 * Returns null if not found or API unavailable.
 */
async function resolvePersonId(candidateName, stateAbbr, apiKey) {
  const params = new URLSearchParams({
    name:         candidateName,
    jurisdiction: stateAbbr,
    apikey:       apiKey,
  })
  try {
    const data = await safeFetch(`${OPENSTATES_BASE}/people?${params}`)
    return data.results?.[0]?.id ?? null
  } catch {
    return null
  }
}

/**
 * Fetch up to 50 bills sponsored by a given OpenStates person ID.
 */
async function fetchBillsByPerson(personId, apiKey) {
  const params = new URLSearchParams({
    sponsor_id:  personId,
    per_page:    '50',
    apikey:      apiKey,
  })
  params.append('include[]', 'abstracts')
  try {
    const data = await safeFetch(`${OPENSTATES_BASE}/bills?${params}`)
    return data.results ?? []
  } catch {
    return []
  }
}

/**
 * Core fetch-and-cache logic shared by both public functions.
 */
async function getStateLegislation(candidateName, state, candidateId, keywords, relevance) {
  let supabase = null
  try {
    supabase = (await import('../supabaseClient.js')).supabase
  } catch { /* Supabase unavailable */ }

  // Check cache — any row for this candidate+relevance acts as the TTL anchor
  if (supabase && candidateId) {
    try {
      const { data: cached } = await supabase
        .from('state_legislation')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('relevance', relevance)

      if (cached?.length > 0) {
        const mostRecent = Math.max(...cached.map(r => new Date(r.fetched_at).getTime()))
        if (Date.now() - mostRecent < THIRTY_DAYS_MS) {
          return cached.map(r => ({
            bill_number:  r.bill_number,
            title:        r.title,
            description:  r.description,
            status:       r.status,
            session:      r.session,
            relevance:    r.relevance,
          }))
        }
        // Stale — delete before re-fetching so we don't accumulate phantom rows
        await supabase
          .from('state_legislation')
          .delete()
          .eq('candidate_id', candidateId)
          .eq('relevance', relevance)
      }
    } catch { /* Cache miss — proceed to live fetch */ }
  }

  const apiKey = process.env.OPENSTATES_API_KEY
  if (!apiKey) {
    console.warn('[openStates] OPENSTATES_API_KEY not set — skipping state legislation lookup')
    return []
  }

  const stateAbbr = STATE_NAME_TO_ABBR[state]
  if (!stateAbbr) {
    console.warn(`[openStates] Unknown state: ${state}`)
    return []
  }

  try {
    const personId = await resolvePersonId(candidateName, stateAbbr, apiKey)
    if (!personId) {
      console.log(`[openStates] No record found for ${candidateName} (${state})`)
      return []
    }

    const bills      = await fetchBillsByPerson(personId, apiKey)
    const relevant   = bills.filter(b => isBillRelevant(b, keywords)).map(b => mapBill(b, relevance))

    console.log(`[openStates] ${candidateName} (${state}): ${relevant.length} relevant ${relevance} bills found`)

    // Persist to Supabase
    if (supabase && candidateId && relevant.length > 0) {
      const rows = relevant.map(b => ({
        candidate_id: candidateId,
        bill_number:  b.bill_number,
        state,
        title:        b.title,
        description:  b.description,
        status:       b.status,
        session:      b.session,
        relevance:    b.relevance,
        fetched_at:   new Date().toISOString(),
      }))
      await supabase
        .from('state_legislation')
        .upsert(rows, { onConflict: 'candidate_id, bill_number, relevance' })
        .catch(err => console.warn('[openStates] Supabase upsert failed:', err.message))
    }

    return relevant
  } catch (err) {
    console.error(`[openStates] Error for ${candidateName}:`, err.message)
    return []
  }
}

/**
 * Get state legislature AI-related bills sponsored by this candidate.
 * Returns cached results if fresh (< 30 days). Degrades gracefully to [].
 *
 * @param {string} candidateName
 * @param {string} state - full state name, e.g. "California"
 * @param {number|string|null} candidateId - Supabase candidates.id (for caching)
 * @returns {Promise<Array<{bill_number, title, description, status, session, relevance}>>}
 */
export async function getAILegislation(candidateName, state, candidateId = null) {
  return getStateLegislation(candidateName, state, candidateId, AI_KEYWORDS, 'ai_policy')
}

/**
 * Get state legislature climate-related bills sponsored by this candidate.
 * Returns cached results if fresh (< 30 days). Degrades gracefully to [].
 *
 * @param {string} candidateName
 * @param {string} state - full state name, e.g. "California"
 * @param {number|string|null} candidateId - Supabase candidates.id (for caching)
 * @returns {Promise<Array<{bill_number, title, description, status, session, relevance}>>}
 */
export async function getClimateLegislation(candidateName, state, candidateId = null) {
  return getStateLegislation(candidateName, state, candidateId, CLIMATE_KEYWORDS, 'climate')
}
