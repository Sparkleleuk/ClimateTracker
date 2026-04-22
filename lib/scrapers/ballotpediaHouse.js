import * as cheerio from 'cheerio'

const BASE_URL = 'https://ballotpedia.org'

// Known competitive (battleground) House districts for 2026
const BATTLEGROUND_DISTRICTS = new Set([
  'AK-1','AZ-1','AZ-6','AZ-7','CA-13','CA-22','CA-27','CO-3','CO-8',
  'GA-6','GA-7','IA-1','IA-3','ME-2','MI-7','MI-8','MN-2','NC-1',
  'NC-6','NC-13','NV-3','NV-4','NJ-7','NY-4','NY-17','NY-18','NY-19',
  'NY-22','OH-1','OH-9','OH-13','OR-5','OR-6','PA-7','PA-8','PA-17',
  'TX-28','VA-2','VA-7','WA-3','WI-3',
])

// Only scrape states that contain battleground districts
const BATTLEGROUND_STATES = new Set([
  'Alaska','Arizona','California','Colorado','Georgia','Iowa','Maine',
  'Michigan','Minnesota','North Carolina','Nevada','New Jersey','New York',
  'Ohio','Oregon','Pennsylvania','Texas','Virginia','Washington','Wisconsin',
])

// States that use singular "election" in their Ballotpedia URL (at-large / single district)
const SINGULAR_STATES = new Set(['Alaska','Delaware','Montana','North Dakota','South Dakota','Vermont','Wyoming'])

// Map Ballotpedia party labels → single-character codes
const PARTY_MAP = {
  'Democratic Party': 'D', 'Democrat': 'D', 'Democratic': 'D',
  'Republican Party': 'R', 'Republican': 'R',
  'Independent': 'I',
  'Libertarian Party': 'L', 'Libertarian': 'L',
  'Green Party': 'G', 'Green': 'G',
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

const STATE_NAME_TO_ABBR = Object.fromEntries(
  Object.entries(STATE_ABBR).map(([abbr, name]) => [name, abbr])
)

function statePageUrl(stateName) {
  const slug = stateName.replace(/ /g, '_')
  const verb = SINGULAR_STATES.has(stateName) ? 'election' : 'elections'
  return `${BASE_URL}/United_States_House_of_Representatives_${verb}_in_${slug},_2026`
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const text = await res.text()
  // Detect WAF challenge page (AWS WAF returns 202 with tiny JS payload)
  if (text.length < 5000 && text.includes('awsWafCookieDomainList')) {
    throw new Error(`WAF challenge at ${url} — skipping`)
  }
  return text
}

/**
 * Parse party string from Ballotpedia li text.
 * Examples: "(Democratic Party)", "(Republican Party)"
 */
function parseParty(text) {
  const match = text.match(/\(([^)]+Party|Independent|Libertarian|Green)\)/i)
  if (!match) return null
  const raw = match[1].trim()
  return PARTY_MAP[raw] ?? raw[0]?.toUpperCase() ?? null
}

/**
 * Parse a candidate li from the primary candidates section.
 * Format: "Name  (Incumbent) (Democratic Party)" or "Name  (Republican Party)"
 */
function parseCandidateLi(text) {
  // Remove trailing survey note
  const clean = text.replace(/\s*=\s*candidate completed.*$/i, '').trim()

  // Extract party
  const party = parseParty(clean)
  if (!party) return null

  // Extract incumbent status
  const isIncumbent = /\(Incumbent\)/i.test(clean)

  // Extract name: everything before the first "("
  const name = clean.replace(/\s*\([^)]*\)/g, '').trim()
  if (!name || name.length < 3) return null

  return { name, party, incumbentStatus: isIncumbent ? 'incumbent' : 'challenger' }
}

/**
 * Scrape all candidates from a single state's House elections page.
 * Parses each district section and its primary candidates list.
 */
async function scrapeStatePage(stateName) {
  const stateAbbr = STATE_NAME_TO_ABBR[stateName]
  const url = statePageUrl(stateName)

  let html
  try {
    html = await fetchPage(url)
  } catch (err) {
    console.warn(`[house] Failed to fetch ${stateName}: ${err.message}`)
    return []
  }

  const $ = cheerio.load(html)
  const candidates = []

  // Each district is in an h3 section with id="District_N"
  $('h3').each((_, h3) => {
    const headline = $(h3).find('span.mw-headline')
    const id = headline.attr('id') ?? ''
    const text = headline.text().trim()

    // Match "District 13" or "At-Large District"
    let district
    const numMatch = text.match(/District\s+(\d+)/i)
    const atLarge = /at-large/i.test(text)

    if (numMatch) {
      district = numMatch[1]
    } else if (atLarge) {
      district = 'At-Large'
    } else {
      return // not a district section
    }

    const districtKey = `${stateAbbr}-${district}`
    const isBattleground = BATTLEGROUND_DISTRICTS.has(districtKey)
    const tier = isBattleground ? 1 : 2

    const officeLabel = district === 'At-Large'
      ? `U.S. House (${stateName} At-Large)`
      : `U.S. House (${stateAbbr}-${district})`

    // Get the "See also" link for the district page URL
    let ballotpediaUrl = url
    const seealso = $(h3).next('dl')
    if (seealso.length) {
      const link = seealso.find('a[href]').first().attr('href')
      if (link) ballotpediaUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`
    }

    // Walk forward from the h3 to find the "Primary candidates" UL
    let el = $(h3).next()
    let inPrimary = false
    while (el.length) {
      const tag = el.prop('tagName')

      // Stop at next district section
      if (tag === 'H3') break

      if (tag === 'P') {
        const pText = el.text().trim().toLowerCase()
        if (pText.includes('primary candidate')) {
          inPrimary = true
        }
        el = el.next()
        continue
      }

      if (inPrimary && tag === 'UL') {
        el.find('li').each((_, li) => {
          const liText = $(li).text().trim()
          const parsed = parseCandidateLi(liText)
          if (!parsed) return

          candidates.push({
            name:             parsed.name,
            state:            stateName,
            district,
            office:           officeLabel,
            officeType:       'us_house',
            party:            parsed.party,
            candidacyStatus:  'declared',
            incumbentStatus:  parsed.incumbentStatus,
            ballotpediaUrl,
            isBattleground,
            tier,
          })
        })
        // Only take the first UL after "Primary candidates"
        break
      }

      el = el.next()
    }
  })

  // Deduplicate by name within state
  const seen = new Set()
  return candidates.filter(c => {
    const key = `${c.name}|${c.district}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Main entry point. Scrapes battleground-state House pages on Ballotpedia.
 * Returns an array of candidate objects for all battleground districts.
 */
export async function scrapeBallotpedia2026House() {
  const states = [...BATTLEGROUND_STATES]
  console.log(`[house] Scraping ${states.length} battleground states…`)

  const allCandidates = []

  for (const stateName of states) {
    try {
      const stateCandidates = await scrapeStatePage(stateName)
      // Only keep battleground district candidates
      const battleground = stateCandidates.filter(c => c.isBattleground)
      allCandidates.push(...battleground)
      console.log(`[house] ${stateName}: ${battleground.length} battleground candidates (${stateCandidates.length} total scraped)`)
    } catch (err) {
      console.warn(`[house] Error scraping ${stateName}: ${err.message}`)
    }
    // Polite delay
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`[house] Done. ${allCandidates.length} battleground candidates from ${states.length} states.`)
  return allCandidates
}
