import { supabase } from '../../lib/supabaseClient.js'

// Fallback to hardcoded data if Supabase is not yet configured
import { CANDIDATES_FALLBACK } from '../../lib/data/candidatesFallback.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // If Supabase is not configured, return fallback data
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(200).json({ candidates: CANDIDATES_FALLBACK, source: 'fallback' })
  }

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('name')

  if (error) {
    console.error('[candidates API] Supabase error:', error.message)
    // Fallback to static data on error
    return res.status(200).json({ candidates: CANDIDATES_FALLBACK, source: 'fallback', supabaseError: error.message })
  }

  // Map snake_case DB columns → camelCase frontend schema
  const candidates = data.map(row => ({
    id:                   row.id,
    name:                 row.name,
    state:                row.state,
    office:               row.office,
    party:                row.party,
    incumbentStatus:      row.incumbent_status,
    raceCompetitiveness:  row.race_competitiveness,
    primaryDate:          row.primary_date,
    generalDate:          row.general_date,
    officeType:           row.office_type ?? 'us_senate',
    candidacyStatus:      row.candidacy_status,
    knownPositions:       row.known_positions,
    fossilFuelDonations:  row.fossil_fuel_donations,
    fossilFuelAmount:     row.fossil_fuel_amount,
    fossilFuelCycle:      row.fossil_fuel_cycle,
    fossilFuelSource:     row.fossil_fuel_source,
    opponent:             row.opponent,
    ballotpediaUrl:       row.ballotpedia_url,
    district:             row.district ?? null,
    isBattleground:       row.is_battleground ?? false,
    tier:                 row.tier ?? null,
    climateScore:         row.climate_score ?? null,
    climateAnalysis:      row.climate_analysis ?? null,
    issues:               row.issue_tags ?? [],
  }))

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
  return res.status(200).json({ candidates, source: 'supabase' })
}
