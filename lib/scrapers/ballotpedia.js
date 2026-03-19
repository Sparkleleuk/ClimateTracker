import * as cheerio from 'cheerio'

const BASE_URL = 'https://ballotpedia.org'
const SENATE_2026_URL = `${BASE_URL}/United_States_Senate_elections,_2026`
const GOVERNOR_2026_URL = `${BASE_URL}/Gubernatorial_elections,_2026`

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
  declared:          'declared',
  'seeking election':'declared',
  announced:         'declared',
  qualified:         'declared',
  nominated:         'nominee',
  'won primary':     'nominee',
  'advanced to general': 'nominee',
  withdrew:          'withdrew',
  withdrawn:         'withdrew',
  'dropped out':     'withdrew',
  'lost primary':    'eliminated',
  eliminated:        'eliminated',
  disqualified:      'eliminated',
}

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
 * Scrape the main 2026 Senate elections page to get a list of
 * state race page URLs.
 */
async function scrapeStateRaceUrls() {
  const html = await fetchPage(SENATE_2026_URL)
  const $ = cheerio.load(html)
  const urls = new Map() // state → URL

  // Ballotpedia's race pages are linked from the main table.
  // The link text typically looks like "United States Senate election in Texas, 2026"
  $('a[href*="United_States_Senate_election_in_"]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    const full = href.startsWith('http') ? href : `${BASE_URL}${href}`
    // Extract state name from URL: ...election_in_Texas,_2026 → Texas
    const match = full.match(/election_in_([^,]+),_2026/)
    if (match) {
      const state = match[1].replace(/_/g, ' ')
      if (!urls.has(state)) urls.set(state, full)
    }
  })

  return urls
}

/**
 * Scrape a single state race page and extract all candidate objects.
 */
async function scrapeStatePage(state, url) {
  let html
  try {
    html = await fetchPage(url)
  } catch (err) {
    console.warn(`[ballotpedia] Failed to fetch ${url}: ${err.message}`)
    return []
  }

  const $ = cheerio.load(html)
  const candidates = []

  // Strategy 1: Look for candidate tables (Ballotpedia standard format)
  // Ballotpedia typically has an "Candidates" section with tables per party.
  // Tables have header rows with columns: Candidate | Party | Status | etc.
  $('table.wikitable, table.infobox, table').each((_, table) => {
    const headers = []
    $(table).find('tr').first().find('th').each((_, th) => {
      headers.push($(th).text().trim().toLowerCase())
    })

    const nameIdx   = headers.findIndex(h => h.includes('candidate') || h.includes('name'))
    const partyIdx  = headers.findIndex(h => h.includes('party'))
    const statusIdx = headers.findIndex(h => h.includes('status') || h.includes('result'))

    if (nameIdx === -1) return // not a candidate table

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
        state,
        office: state.includes('Special') ? 'U.S. Senate (Special)' : 'U.S. Senate',
        party,
        candidacyStatus: status,
        incumbentStatus: 'challenger',
        ballotpediaUrl: bpUrl ? (bpUrl.startsWith('http') ? bpUrl : `${BASE_URL}${bpUrl}`) : url,
      })
    })
  })

  // Strategy 2: Fallback — parse bulleted candidate lists
  // Ballotpedia sometimes lists candidates as "[[Name]] (Party)" in <li> elements.
  if (candidates.length === 0) {
    $('li').each((_, li) => {
      const text = $(li).text().trim()
      // Match patterns like "John Smith (Democrat)" or "Jane Doe (R)"
      const match = text.match(/^([A-Z][a-zA-Z\s\-\.\']+?)\s*[\(\[]([A-Za-z]+)[\)\]]/)
      if (!match) return
      const [, name, partyRaw] = match
      if (name.length < 3 || name.length > 60) return
      candidates.push({
        name: name.trim(),
        state,
        office: 'U.S. Senate',
        party: normalizeParty(partyRaw),
        candidacyStatus: 'declared',
        incumbentStatus: 'challenger',
        ballotpediaUrl: url,
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
 * Main entry point. Scrapes all 2026 Senate races on Ballotpedia.
 * Returns an array of candidate objects.
 */
export async function scrapeBallotpedia2026Senate() {
  console.log('[ballotpedia] Fetching state race URLs from main page…')
  let stateUrls

  try {
    stateUrls = await scrapeStateRaceUrls()
  } catch (err) {
    console.error('[ballotpedia] Failed to load main page:', err.message)
    return []
  }

  console.log(`[ballotpedia] Found ${stateUrls.size} state race pages`)

  const allCandidates = []

  for (const [state, url] of stateUrls) {
    console.log(`[ballotpedia] Scraping ${state}…`)
    try {
      const candidates = await scrapeStatePage(state, url)
      console.log(`  → ${candidates.length} candidate(s) found`)
      allCandidates.push(...candidates)
    } catch (err) {
      console.warn(`[ballotpedia] Error scraping ${state}: ${err.message}`)
    }

    // Polite delay between requests
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`[ballotpedia] Scrape complete. Total candidates: ${allCandidates.length}`)
  return allCandidates
}

/**
 * Scrape a single state's Senate race page directly (useful for targeted updates).
 */
export async function scrapeState(state) {
  const slug = state.replace(/\s+/g, '_')
  const url = `${BASE_URL}/United_States_Senate_election_in_${slug},_2026`
  return scrapeStatePage(state, url)
}

/**
 * Scrape the main 2026 Gubernatorial elections page to get state race URLs.
 */
async function scrapeGovernorRaceUrls() {
  const html = await fetchPage(GOVERNOR_2026_URL)
  const $ = cheerio.load(html)
  const urls = new Map()

  $('a[href*="gubernatorial_election_in_"]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    const full = href.startsWith('http') ? href : `${BASE_URL}${href}`
    const match = full.match(/gubernatorial_election_in_([^,]+),_2026/)
    if (match) {
      const state = match[1].replace(/_/g, ' ')
      if (!urls.has(state)) urls.set(state, full)
    }
  })

  return urls
}

/**
 * Scrape a single governor race page, same two-strategy approach as Senate.
 */
async function scrapeGovernorStatePage(state, url) {
  let html
  try {
    html = await fetchPage(url)
  } catch (err) {
    console.warn(`[ballotpedia/gov] Failed to fetch ${url}: ${err.message}`)
    return []
  }

  const $ = cheerio.load(html)
  const candidates = []

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
        state,
        office: 'Governor',
        officeType: 'governor',
        party,
        candidacyStatus: status,
        incumbentStatus: 'challenger',
        ballotpediaUrl: bpUrl ? (bpUrl.startsWith('http') ? bpUrl : `${BASE_URL}${bpUrl}`) : url,
      })
    })
  })

  if (candidates.length === 0) {
    $('li').each((_, li) => {
      const text = $(li).text().trim()
      const match = text.match(/^([A-Z][a-zA-Z\s\-\.\']+?)\s*[\(\[]([A-Za-z]+)[\)\]]/)
      if (!match) return
      const [, name, partyRaw] = match
      if (name.length < 3 || name.length > 60) return
      candidates.push({
        name: name.trim(),
        state,
        office: 'Governor',
        officeType: 'governor',
        party: normalizeParty(partyRaw),
        candidacyStatus: 'declared',
        incumbentStatus: 'challenger',
        ballotpediaUrl: url,
      })
    })
  }

  const seen = new Set()
  return candidates.filter(c => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
}

/**
 * Main entry point for 2026 gubernatorial races.
 */
export async function scrapeBallotpedia2026Governors() {
  console.log('[ballotpedia/gov] Fetching governor race URLs from main page…')
  let stateUrls

  try {
    stateUrls = await scrapeGovernorRaceUrls()
  } catch (err) {
    console.error('[ballotpedia/gov] Failed to load main page:', err.message)
    return []
  }

  console.log(`[ballotpedia/gov] Found ${stateUrls.size} governor race pages`)

  const allCandidates = []

  for (const [state, url] of stateUrls) {
    console.log(`[ballotpedia/gov] Scraping ${state}…`)
    try {
      const candidates = await scrapeGovernorStatePage(state, url)
      console.log(`  → ${candidates.length} candidate(s) found`)
      allCandidates.push(...candidates)
    } catch (err) {
      console.warn(`[ballotpedia/gov] Error scraping ${state}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`[ballotpedia/gov] Scrape complete. Total governor candidates: ${allCandidates.length}`)
  return allCandidates
}
