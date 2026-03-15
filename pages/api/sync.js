import { scrapeBallotpedia2026Senate } from '../../lib/scrapers/ballotpedia.js'
import { syncCandidates } from '../../lib/sync/candidateSync.js'

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
    const scraped = await scrapeBallotpedia2026Senate()

    if (scraped.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'Scraper returned 0 candidates — Ballotpedia may have changed its HTML structure. No database changes were made.',
        startedAt,
        scrapedCount: 0,
        summary: null,
      })
    }

    const summary = await syncCandidates(scraped)

    return res.status(200).json({
      ok: true,
      startedAt,
      scrapedCount: scraped.length,
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
