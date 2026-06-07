import { supabase } from '../../lib/supabaseClient.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const [{ data: pending, error: e1 }, { data: archived, error: e2 }] = await Promise.all([
    supabase
      .from('candidate_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('candidate_requests')
      .select('*')
      .in('status', ['approved', 'rejected'])
      .order('reviewed_at', { ascending: false }),
  ])

  if (e1 || e2) {
    console.error('[admin-requests] Fetch error:', e1?.message ?? e2?.message)
    return res.status(500).json({ error: 'Failed to fetch requests' })
  }

  return res.status(200).json({ pending: pending ?? [], archived: archived ?? [] })
}
