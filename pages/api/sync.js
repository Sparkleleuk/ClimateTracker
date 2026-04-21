import { scrapeBallotpedia2026Senate, scrapeBallotpedia2026Governors } from '../../lib/scrapers/ballotpedia.js'
import { scrapeBallotpedia2026House } from '../../lib/scrapers/ballotpediaHouse.js'
import { syncCandidates } from '../../lib/sync/candidateSync.js'
import { computeAlgorithmicScore } from '../../lib/scoring/algorithmicScore.js'
import { computeDataHash } from '../../lib/utils/dataHash.js'

export default async function handler(req, res) {
  // Allow GET (Vercel cron) and POST (manual admin trigger)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authenticate
  // GET requests (Vercel cron): Authorization: Bearer <SYNC_SECRET>
  // POST requests (admin button): x-sync-secret: <SYNC_SECRET>
  const secret = process.env.SYNC_SECRET
  if (!secret) {
    return res.status(500).json({ error: 'SYNC_SECRET environment variable not set' })
  }

  const authHeader = req.headers['authorization']
  const syncHeader = req.headers['x-sync-secret']
  const isVercelCron = authHeader === `Bearer ${secret}`
  const isAdminPost  = syncHeader === secret

  if (!isVercelCron && !isAdminPost) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const startedAt = new Date().toISOString()
  console.log(`[sync] Starting sync at ${startedAt}`)

  try {
    // Scrape Senate, Governor, and House candidates in parallel
    const [senateScraped, govScraped, houseScraped] = await Promise.all([
      scrapeBallotpedia2026Senate(),
      scrapeBallotpedia2026Governors(),
      scrapeBallotpedia2026House(),
    ])

    // Annotate House candidates with data_hash and tier fields before sync
    const houseAnnotated = houseScraped.map(c => {
      const dataHash = computeDataHash({
        known_positions:     c.knownPositions ?? null,
        fossil_fuel_donations: c.fossilFuelDonations ?? null,
        incumbent_status:    c.incumbentStatus ?? null,
      })
      return {
        ...c,
        dataHash,
        // tier is already set by the scraper (1 for battleground, 2 otherwise)
        // Safe incumbents with no known positions could be Tier 3 — handled below
      }
    })

    const scraped = [...senateScraped, ...govScraped, ...houseAnnotated]

    if (scraped.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'Scrapers returned 0 candidates — Ballotpedia may have changed its HTML structure. No database changes were made.',
        startedAt,
        scrapedCount: 0,
        summary: null,
      })
    }

    const summary = await syncCandidates(scraped)

    // Post-sync: for Tier 3 House candidates (safe incumbents, tier=2 but no known positions),
    // compute and persist algorithmic scores immediately
    const tier3Candidates = houseAnnotated.filter(c =>
      c.incumbentStatus === 'incumbent' &&
      !c.isBattleground &&
      !c.knownPositions
    )

    let tier3Scored = 0
    if (tier3Candidates.length > 0) {
      console.log(`[sync] Computing algorithmic scores for ${tier3Candidates.length} Tier 3 House candidates…`)
      try {
        const { supabase } = await import('../../lib/supabaseClient.js')
        for (const c of tier3Candidates) {
          // Look up the DB record to get the ID
          const { data: rows } = await supabase
            .from('candidates')
            .select('id')
            .eq('name', c.name)
            .eq('state', c.state)
            .limit(1)

          const dbId = rows?.[0]?.id
          if (!dbId) continue

          const algoResult = computeAlgorithmicScore({
            party:               c.party,
            fossilFuelDonations: c.fossilFuelDonations ?? 'unknown',
            knownPositions:      c.knownPositions ?? '',
          })

          await supabase.from('candidates').update({
            climate_score:    algoResult.score,
            climate_analysis: algoResult.summary,
            issue_tags:       [],
          }).eq('id', dbId)

          tier3Scored++
        }
      } catch (err) {
        console.error('[sync] Error computing Tier 3 algorithmic scores:', err.message)
      }
    }

    const houseBattlegroundCount = houseAnnotated.filter(c => c.isBattleground).length

    return res.status(200).json({
      ok: true,
      startedAt,
      scrapedCount: scraped.length,
      senateCount: senateScraped.length,
      govCount: govScraped.length,
      houseCount: houseAnnotated.length,
      houseBattlegroundCount,
      tier3Scored,
      summary: {
        added:      summary.added,
        updated:    summary.updated,
        withdrawn:  summary.withdrawn,
        nominees:   summary.nominees,
        eliminated: summary.eliminated,
        errors:     summary.errors,
      },
      message: [
        summary.added.length      && `${summary.added.length} new candidate(s) added`,
        summary.updated.length    && `${summary.updated.length} candidate(s) updated`,
        summary.withdrawn.length  && `${summary.withdrawn.length} marked withdrew`,
        summary.nominees.length   && `${summary.nominees.length} marked nominee`,
        summary.eliminated.length && `${summary.eliminated.length} marked eliminated`,
        houseAnnotated.length     && `${houseAnnotated.length} House candidates scraped (${houseBattlegroundCount} battleground)`,
        tier3Scored               && `${tier3Scored} algorithmic scores computed`,
        summary.errors.length     && `${summary.errors.length} error(s)`,
      ].filter(Boolean).join(', ') || 'No changes',
    })
  } catch (err) {
    console.error('[sync] Fatal error:', err)
    return res.status(500).json({
      ok: false,
      error: err.message,
      startedAt,
    })
  }
}

// Increase timeout for this route — scraping many pages takes time
export const config = {
  api: { responseLimit: false },
  maxDuration: 300,
}
