import { supabase } from '../supabaseClient.js'

// 2026 primary dates by state — applied to all scraped candidates from that state.
// General election is Nov 3, 2026 for all states.
const STATE_ELECTION_DATES = {
  'Alabama':        { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Alaska':         { primary: 'Aug 25, 2026',   general: 'Nov 3, 2026' },
  'Arkansas':       { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'California':     { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Colorado':       { primary: 'June 23, 2026',  general: 'Nov 3, 2026' },
  'Connecticut':    { primary: 'Aug 11, 2026',   general: 'Nov 3, 2026' },
  'Delaware':       { primary: 'Sep 15, 2026',   general: 'Nov 3, 2026' },
  'Florida':        { primary: 'Aug 18, 2026',   general: 'Nov 3, 2026' },
  'Georgia':        { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'Hawaii':         { primary: 'Aug 8, 2026',    general: 'Nov 3, 2026' },
  'Idaho':          { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'Illinois':       { primary: 'Mar 17, 2026',   general: 'Nov 3, 2026' },
  'Indiana':        { primary: 'May 5, 2026',    general: 'Nov 3, 2026' },
  'Iowa':           { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Kansas':         { primary: 'Aug 4, 2026',    general: 'Nov 3, 2026' },
  'Kentucky':       { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'Louisiana':      { primary: 'Nov 3, 2026',    general: 'Nov 3, 2026' },
  'Maine':          { primary: 'June 9, 2026',   general: 'Nov 3, 2026' },
  'Maryland':       { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Massachusetts':  { primary: 'Sep 15, 2026',   general: 'Nov 3, 2026' },
  'Michigan':       { primary: 'Aug 4, 2026',    general: 'Nov 3, 2026' },
  'Minnesota':      { primary: 'Aug 11, 2026',   general: 'Nov 3, 2026' },
  'Mississippi':    { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Missouri':       { primary: 'Aug 4, 2026',    general: 'Nov 3, 2026' },
  'Montana':        { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Nebraska':       { primary: 'May 12, 2026',   general: 'Nov 3, 2026' },
  'Nevada':         { primary: 'June 9, 2026',   general: 'Nov 3, 2026' },
  'New Hampshire':  { primary: 'Sep 8, 2026',    general: 'Nov 3, 2026' },
  'New Jersey':     { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'New Mexico':     { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'New York':       { primary: 'June 23, 2026',  general: 'Nov 3, 2026' },
  'North Carolina': { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'North Dakota':   { primary: 'June 9, 2026',   general: 'Nov 3, 2026' },
  'Ohio':           { primary: 'May 5, 2026',    general: 'Nov 3, 2026' },
  'Oklahoma':       { primary: 'June 23, 2026',  general: 'Nov 3, 2026' },
  'Oregon':         { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'Pennsylvania':   { primary: 'May 19, 2026',   general: 'Nov 3, 2026' },
  'Rhode Island':   { primary: 'Sep 15, 2026',   general: 'Nov 3, 2026' },
  'South Carolina': { primary: 'June 9, 2026',   general: 'Nov 3, 2026' },
  'South Dakota':   { primary: 'June 2, 2026',   general: 'Nov 3, 2026' },
  'Tennessee':      { primary: 'Aug 6, 2026',    general: 'Nov 3, 2026' },
  'Texas':          { primary: 'Mar 3, 2026',    general: 'Nov 3, 2026' },
  'Utah':           { primary: 'June 23, 2026',  general: 'Nov 3, 2026' },
  'Vermont':        { primary: 'Aug 11, 2026',   general: 'Nov 3, 2026' },
  'Virginia':       { primary: 'June 9, 2026',   general: 'Nov 3, 2026' },
  'Washington':     { primary: 'Aug 4, 2026',    general: 'Nov 3, 2026' },
  'West Virginia':  { primary: 'May 12, 2026',   general: 'Nov 3, 2026' },
  'Wisconsin':      { primary: 'Aug 11, 2026',   general: 'Nov 3, 2026' },
  'Wyoming':        { primary: 'Aug 18, 2026',   general: 'Nov 3, 2026' },
}

/**
 * Normalize a candidate name for fuzzy matching
 * (removes suffixes like Jr., III, accents, extra spaces)
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find the best existing candidate match for a scraped candidate.
 * Matches on normalized name + state + office.
 */
function findMatch(existing, scraped) {
  const scrapedKey = `${normalizeName(scraped.name)}|${scraped.state}`
  return existing.find(e => {
    const existingKey = `${normalizeName(e.name)}|${e.state}`
    return existingKey === scrapedKey
  }) ?? null
}

/**
 * Main sync function.
 * Compares scraped Ballotpedia candidates against the Supabase candidates table.
 *
 * @param {Array} scrapedCandidates - output of scrapeBallotpedia2026Senate()
 * @returns {Object} summary of changes
 */
export async function syncCandidates(scrapedCandidates) {
  const summary = {
    added: [],
    updated: [],
    withdrawn: [],
    nominees: [],
    eliminated: [],
    errors: [],
  }

  // Fetch all existing candidates from Supabase
  const { data: existing, error: fetchError } = await supabase
    .from('candidates')
    .select('*')

  if (fetchError) {
    throw new Error(`Failed to fetch existing candidates: ${fetchError.message}`)
  }

  console.log(`[sync] ${existing.length} existing candidates in database`)
  console.log(`[sync] ${scrapedCandidates.length} candidates scraped from Ballotpedia`)

  for (const scraped of scrapedCandidates) {
    // Skip candidates without a parseable party
    if (!scraped.party || !['D', 'R', 'I', 'L', 'G'].includes(scraped.party)) {
      continue
    }

    const match = findMatch(existing, scraped)

    if (!match) {
      // NEW candidate — insert
      const { error } = await supabase.from('candidates').insert({
        name:                 scraped.name,
        state:                scraped.state,
        office:               scraped.office ?? 'U.S. Senate',
        office_type:          scraped.officeType ?? 'us_senate',
        party:                scraped.party,
        incumbent_status:     scraped.incumbentStatus ?? 'challenger',
        race_competitiveness: scraped.raceCompetitiveness ?? null,
        primary_date:         scraped.primaryDate ?? STATE_ELECTION_DATES[scraped.state]?.primary ?? null,
        general_date:         scraped.generalDate ?? STATE_ELECTION_DATES[scraped.state]?.general ?? null,
        candidacy_status:     scraped.candidacyStatus ?? 'declared',
        known_positions:      scraped.knownPositions ?? null,
        fossil_fuel_donations: scraped.fossilFuelDonations ?? 'unknown',
        ballotpedia_url:      scraped.ballotpediaUrl ?? null,
      })

      if (error) {
        summary.errors.push({ name: scraped.name, error: error.message })
        console.error(`[sync] Insert failed for ${scraped.name}: ${error.message}`)
      } else {
        summary.added.push(scraped.name)
        console.log(`[sync] + Added: ${scraped.name} (${scraped.state}, ${scraped.party})`)
      }
    } else {
      // EXISTING candidate — check for status changes
      const updates = {}

      if (scraped.candidacyStatus && scraped.candidacyStatus !== match.candidacy_status) {
        updates.candidacy_status = scraped.candidacyStatus
      }

      if (
        scraped.incumbentStatus &&
        scraped.incumbentStatus !== match.incumbent_status &&
        scraped.incumbentStatus !== 'challenger'
      ) {
        updates.incumbent_status = scraped.incumbentStatus
      }

      if (scraped.raceCompetitiveness && scraped.raceCompetitiveness !== match.race_competitiveness) {
        updates.race_competitiveness = scraped.raceCompetitiveness
      }

      if (scraped.ballotpediaUrl && !match.ballotpedia_url) {
        updates.ballotpedia_url = scraped.ballotpediaUrl
      }

      if (Object.keys(updates).length === 0) continue

      const { error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', match.id)

      if (error) {
        summary.errors.push({ name: match.name, error: error.message })
        console.error(`[sync] Update failed for ${match.name}: ${error.message}`)
        continue
      }

      const label = `${match.name} (${match.candidacy_status} → ${updates.candidacy_status ?? match.candidacy_status})`

      if (updates.candidacy_status === 'withdrew') {
        summary.withdrawn.push(label)
        console.log(`[sync] ↙ Withdrew: ${label}`)
      } else if (updates.candidacy_status === 'nominee') {
        summary.nominees.push(label)
        console.log(`[sync] ★ Nominee: ${label}`)
      } else if (updates.candidacy_status === 'eliminated') {
        summary.eliminated.push(label)
        console.log(`[sync] ✗ Eliminated: ${label}`)
      } else {
        summary.updated.push(label)
        console.log(`[sync] ↻ Updated: ${label}`)
      }
    }
  }

  console.log('[sync] Done.')
  console.log(`  ${summary.added.length} new candidates added`)
  console.log(`  ${summary.updated.length} candidates updated`)
  console.log(`  ${summary.withdrawn.length} candidates marked withdrew`)
  console.log(`  ${summary.nominees.length} candidates marked nominee`)
  console.log(`  ${summary.eliminated.length} candidates marked eliminated`)
  if (summary.errors.length) {
    console.warn(`  ${summary.errors.length} errors`)
  }

  return summary
}
