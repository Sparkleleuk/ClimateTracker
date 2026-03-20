import ClimateTracker from '../components/ClimateTracker'
import { CANDIDATES_FALLBACK } from '../lib/data/candidatesFallback.js'

export default function Home({ initialCandidates }) {
  return <ClimateTracker initialCandidates={initialCandidates} />
}

export async function getServerSideProps() {
  try {
    // Attempt to load from Supabase via the internal API
    // This runs server-side so we import directly to avoid an HTTP round-trip
    const { supabase } = await import('../lib/supabaseClient.js')

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase not configured')
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('name')

    if (error) throw error

    const candidates = data.map(row => ({
      id:                  row.id,
      name:                row.name,
      state:               row.state,
      office:              row.office,
      party:               row.party,
      incumbentStatus:     row.incumbent_status,
      raceCompetitiveness: row.race_competitiveness,
      primaryDate:         row.primary_date,
      generalDate:         row.general_date,
      officeType:          row.office_type ?? 'us_senate',
      candidacyStatus:     row.candidacy_status,
      knownPositions:      row.known_positions,
      fossilFuelDonations: row.fossil_fuel_donations,
      fossilFuelAmount:    row.fossil_fuel_amount,
      fossilFuelCycle:     row.fossil_fuel_cycle,
      fossilFuelSource:    row.fossil_fuel_source,
      opponent:            row.opponent,
      ballotpediaUrl:      row.ballotpedia_url,
      climateScore:        row.climate_score ?? null,
      climateAnalysis:     row.climate_analysis ?? null,
      issues:              row.issue_tags ?? [],
    }))

    return { props: { initialCandidates: candidates } }
  } catch {
    // Supabase not set up yet — use the hardcoded fallback list
    return { props: { initialCandidates: CANDIDATES_FALLBACK } }
  }
}
