import { supabase } from '../../lib/supabaseClient.js'

const OFFICE_TYPE_MAP = {
  'U.S. Senate':  'us_senate',
  'U.S. House':   'us_house',
  'Governor':     'governor',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, action, party } = req.body ?? {}

  if (!id || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'id and action (approve|reject) are required' })
  }

  if (action === 'reject') {
    const { error } = await supabase
      .from('candidate_requests')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[admin-request-action] Reject error:', error.message)
      return res.status(500).json({ error: 'Failed to reject request' })
    }
    return res.status(200).json({ ok: true, action: 'rejected' })
  }

  // approve
  if (!party || !['D', 'R', 'I', 'L', 'G'].includes(party)) {
    return res.status(400).json({ error: 'A valid party (D/R/I/L/G) is required to add a candidate' })
  }

  // Fetch the request row
  const { data: request, error: fetchError } = await supabase
    .from('candidate_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !request) {
    return res.status(404).json({ error: 'Request not found' })
  }

  if (request.status !== 'pending') {
    return res.status(409).json({ error: `Request is already ${request.status}` })
  }

  // Insert into candidates
  const { error: insertError } = await supabase.from('candidates').insert({
    name:             request.requested_name,
    state:            request.state,
    office:           request.office,
    office_type:      OFFICE_TYPE_MAP[request.office] ?? 'us_senate',
    party,
    incumbent_status: 'challenger',
    candidacy_status: 'declared',
    ballotpedia_url:  request.source_url ?? null,
  })

  if (insertError) {
    console.error('[admin-request-action] Candidate insert error:', insertError.message)
    return res.status(500).json({ error: `Failed to insert candidate: ${insertError.message}` })
  }

  // Mark request approved
  const { error: updateError } = await supabase
    .from('candidate_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[admin-request-action] Approve update error:', updateError.message)
    // Candidate was inserted; log but don't fail the response
  }

  return res.status(200).json({ ok: true, action: 'approved', name: request.requested_name })
}
