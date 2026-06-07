import { supabase } from '../../lib/supabaseClient.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { search_term, results_count, triggered_request_form } = req.body ?? {}

  if (!search_term?.trim() || typeof results_count !== 'number') {
    return res.status(400).json({ error: 'search_term and results_count are required' })
  }

  const { error } = await supabase.from('search_analytics').insert({
    search_term:            search_term.trim(),
    results_count,
    triggered_request_form: triggered_request_form === true,
  })

  if (error) {
    console.error('[log-search] Insert error:', error.message)
    return res.status(500).json({ error: 'Failed to log search' })
  }

  return res.status(201).json({ ok: true })
}
