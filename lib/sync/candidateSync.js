import { supabase } from '../supabaseClient.js'

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
        primary_date:         scraped.primaryDate ?? null,
        general_date:         scraped.generalDate ?? null,
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
