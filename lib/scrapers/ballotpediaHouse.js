import * as cheerio from 'cheerio'

const BASE_URL = 'https://ballotpedia.org'
const HOUSE_2026_URL = `${BASE_URL}/United_States_House_elections,_2026`

// Known competitive (battleground) House districts for 2026
const BATTLEGROUND_DISTRICTS = new Set([
  'AK-1','AZ-1','AZ-6','AZ-7','CA-13','CA-22','CA-27','CO-3','CO-8',
  'GA-6','GA-7','IA-1','IA-3','ME-2','MI-7','MI-8','MN-2','NC-1',
  'NC-6','NC-13','NV-3','NV-4','NJ-7','NY-4','NY-17','NY-18','NY-19',
  'NY-22','OH-1','OH-9','OH-13','OR-5','OR-6','PA-7','PA-8','PA-17',
  'TX-28','VA-2','VA-7','WA-3','WI-3',
])

// Map Ballotpedia party labels → single-character codes used in our schema
const PARTY_MAP = {
  Democratic: 'D', Democrat: 'D',
  Republican: 'R',
  Independent: 'I',
  Libertarian: 'L',
  Green: 'G',
}

// Map Ballotpedia candidacy status labels → our schema values
const STATUS_MAP = {
  declared:            'declared',
  'seeking election':  'declared',
  announced:           'declared',
  qualified:           'declared',
  nominated:           'nominee',
  'won primary':       'nominee',
  'advanced to general': 'nominee',
  withdrew:            'withdrew',
  withdrawn:           'withdrew',
  'dropped out':       'withdrew',
  'lost primary':      'eliminated',
  eliminated:          'eliminated',
  disqualified:        'eliminated',
}

// Mapping of US state abbreviations to full names
const STATE_ABBR = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
}

// Reverse map: full state name → abbreviation
const STATE_NAME_TO_ABBR = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([abbr, name]) => [name, abbr])
)

function normalizeStatus(raw) {
  if (!raw) return 'declared'
  const lower = raw.toLowerCase().trim()
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'declared'
}

function normalizeParty(raw) {
  if (!raw) return null
  const trimmed = raw.trim()
  return PARTY_MAP[trimmed] ?? trimmed[0]?.toUpperCase() ?? null
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ClimateTracker/1.0 (+https://github.com/Sparkleleuk/ClimateTracker; noncommercial research)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return res.text()
}

/**
 * Extract state name and district number from a Ballotpedia House race URL or link text.
 * Ballotpedia uses patterns like:
 *   /United_States_House_Representatives_elections_in_California%27s_13th_congressional_district,_2026
 *   /United_States_House_Representatives_elections_in_California%27s_at-large_congressional_district,_2026
 */
function parseDistrictUrl(url) {
  try {
    const decoded = decodeURIComponent(url)
    // Pattern: ...elections_in_STATE's_NUMBERth_congressional_district,_2026
    // or: ...elections_in_STATE's_at-large_congressional_district,_2026
    const match = decoded.match(
      /elections_in_([^']+)'s_(.+?)_congressional_district,_2026/i
    )
    if (!match) return null

    const stateName = match[1].replace(/_/g, ' ')
    const districtRaw = match[2].replace(/_/g, ' ').toLowerCase()

    let district
    if (districtRaw.includes('at-large') || districtRaw.includes('at large')) {
      district = 'At-Large'
    } else {
      // Extract the number: "13th" → "13", "1st" → "1", etc.
      const numMatch = districtRaw.match(/^(\d+)/)
      district = numMatch ? numMatch[1] : districtRaw
    }

    return { stateName, district }
  } catch {
    return null
  }
}

/**
 * Fetch the main 2026 House elections page and collect all district race page URLs.
 * Returns a Map of "STATE-DISTRICT" → { url, stateName, stateAbbr, district }
 */
async function scrapeDistrictUrls() {
  const html = await fetchPage(HOUSE_2026_URL)
  const $ = cheerio.load(html)
  const districts = new Map()

  $('a[href*="House_Representatives_elections_in_"]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || !href.includes('2026')) return

    const full = href.startsWith('http') ? href : `${BASE_URL}${href}`
    const parsed = parseDistrictUrl(full)
    if (!parsed) return

    const { stateName, district } = parsed
    const stateAbbr = STATE_NAME_TO_ABBR[stateName]
    if (!stateAbbr) return

    const key = `${stateAbbr}-${district}`
    if (!districts.has(key)) {
      districts.set(key, { url: full, stateName, stateAbbr, district })
    }
  })

  return districts
}

/**
 * Scrape a single district race page and return candidate objects.
 * Uses the same two-strategy approach as the Senate scraper.
 */
async function scrapeDistrictPage(stateAbbr, stateName, district, url) {
  let html
  try {
    html = await fetchPage(url)
  } catch (err) {
    console.warn(`[house] Failed to fetch ${url}: ${err.message}`)
    return []
  }

  const $ = cheerio.load(html)
  const candidates = []

  const districtKey = `${stateAbbr}-${district}`
  const isBattleground = BATTLEGROUND_DISTRICTS.has(districtKey)
  const tier = isBattleground ? 1 : 2

  const officeLabel = district === 'At-Large'
    ? `U.S. House (${stateName} At-Large)`
    : `U.S. House (${stateAbbr}-${district})`

  // Strategy 1: wikitable / infobox / table with candidate column
  $('table.wikitable, table.infobox, table').each((_, table) => {
    const headers = []
    $(table).find('tr').first().find('th').each((_, th) => {
      headers.push($(th).text().trim().toLowerCase())
    })

    const nameIdx   = headers.findIndex(h => h.includes('candidate') || h.includes('name'))
    const partyIdx  = headers.findIndex(h => h.includes('party'))
    const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('result'))

    if (nameIdx === -1) return

    $(table).find('tr').slice(1).each((_, row) => {
      const cells = $(row).find('td')
      if (!cells.length) return

      const nameCell   = cells.eq(nameIdx)
      const partyCell  = partyIdx >= 0 ? cells.eq(partyIdx) : null
      const statusCell = statusIdx >= 0 ? cells.eq(statusIdx) : null

      const name   = nameCell.find('a').first().text().trim() || nameCell.text().trim()
      const party  = normalizeParty(partyCell?.text().trim() ?? '')
      const status = normalizeStatus(statusCell?.text().trim() ?? '')
      const bpUrl  = nameCell.find('a[href]').first().attr('href')

      if (!name || name.length < 3) return

      candidates.push({
        name,
        state: stateName,
        district,
        office: officeLabel,
        officeType: 'us_house',
        party,
        candidacyStatus: status,
        incumbentStatus: 'challenger',
        ballotpediaUrl: bpUrl ? (bpUrl.startsWith('http') ? bpUrl : `${BASE_URL}${bpUrl}`) : url,
        isBattleground,
        tier,
      })
    })
  })

  // Strategy 2: Fallback — bulleted candidate lists
  if (candidates.length === 0) {
    $('li').each((_, li) => {
      const text = $(li).text().trim()
      const match = text.match(/^([A-Z][a-zA-Z\s\-\.\']+?)\s*[\(\[]([A-Za-z]+)[\)\]]/)
      if (!match) return
      const [, name, partyRaw] = match
      if (name.length < 3 || name.length > 60) return
      candidates.push({
        name: name.trim(),
        state: stateName,
        district,
        office: officeLabel,
        officeType: 'us_house',
        party: normalizeParty(partyRaw),
        candidacyStatus: 'declared',
        incumbentStatus: 'challenger',
        ballotpediaUrl: url,
        isBattleground,
        tier,
      })
    })
  }

  // Deduplicate by name
  const seen = new Set()
  return candidates.filter(c => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
}

/**
 * Main entry point. Scrapes all 2026 US House races on Ballotpedia.
 * Returns an array of candidate objects.
 */
export async function scrapeBallotpedia2026House() {
  console.log('[house] Fetching district race URLs from main House elections page…')
  let districtUrls

  try {
    districtUrls = await scrapeDistrictUrls()
  } catch (err) {
    console.error('[house] Failed to load main House page:', err.message)
    return []
  }

  console.log(`[house] Found ${districtUrls.size} district race pages`)

  const allCandidates = []
  let scraped = 0

  for (const [key, { url, stateName, stateAbbr, district }] of districtUrls) {
    try {
      const candidates = await scrapeDistrictPage(stateAbbr, stateName, district, url)
      allCandidates.push(...candidates)
      scraped++
      if (scraped % 20 === 0) {
        console.log(`[house] Scraped ${scraped} districts… (${allCandidates.length} candidates so far)`)
      }
    } catch (err) {
      console.warn(`[house] Error scraping ${key}: ${err.message}`)
    }

    // Polite delay between fetches
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`[house] Scrape complete. ${scraped} districts scraped, ${allCandidates.length} total candidates.`)
  return allCandidates
}
