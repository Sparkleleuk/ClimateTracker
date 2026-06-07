import { supabase } from '../../lib/supabaseClient.js'
import { serialize, parse } from 'cookie'

const RATE_LIMIT = 5
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const COOKIE_NAME = 'candidate_requests'

function getRateLimitState(req) {
  const cookies = parse(req.headers.cookie ?? '')
  if (!cookies[COOKIE_NAME]) return { count: 0, windowStart: Date.now() }
  try {
    return JSON.parse(Buffer.from(cookies[COOKIE_NAME], 'base64').toString())
  } catch {
    return { count: 0, windowStart: Date.now() }
  }
}

function buildRateLimitCookie(state) {
  const encoded = Buffer.from(JSON.stringify(state)).toString('base64')
  return serialize(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, state, office, party, source_url } = req.body ?? {}

  // Validation
  if (!name?.trim() || !state?.trim() || !office?.trim()) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'name, state, and office are required',
    })
  }

  // Rate limiting
  const now = Date.now()
  let rl = getRateLimitState(req)
  if (now - rl.windowStart > WINDOW_MS) {
    rl = { count: 0, windowStart: now }
  }
  if (rl.count >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `You can submit up to ${RATE_LIMIT} requests per 24 hours`,
    })
  }

  // Check for existing candidate (case-insensitive)
  const { data: existing, error: lookupError } = await supabase
    .from('candidates')
    .select('id, name, state, office')
    .ilike('name', name.trim())
    .ilike('state', state.trim())
    .limit(1)

  if (lookupError) {
    console.error('[request-candidate] Lookup error:', lookupError.message)
    return res.status(500).json({ error: 'server_error', message: 'Database lookup failed' })
  }

  if (existing?.length > 0) {
    const match = existing[0]
    return res.status(200).json({
      status: 'duplicate',
      message: `${match.name} (${match.state}) is already tracked`,
      candidate: match,
    })
  }

  // Save request
  const { error: insertError } = await supabase.from('candidate_requests').insert({
    requested_name: name.trim(),
    state:          state.trim(),
    office:         office.trim(),
    party:          party?.trim() ?? null,
    source_url:     source_url?.trim() ?? null,
    search_term:    name.trim(),
    status:         'pending',
  })

  if (insertError) {
    console.error('[request-candidate] Insert error:', insertError.message)
    return res.status(500).json({ error: 'server_error', message: 'Failed to save request' })
  }

  // Increment rate limit counter and set cookie
  rl.count += 1
  res.setHeader('Set-Cookie', buildRateLimitCookie(rl))

  return res.status(201).json({
    status: 'success',
    message: `Request for ${name.trim()} submitted. We'll review it shortly.`,
    remaining: RATE_LIMIT - rl.count,
  })
}
