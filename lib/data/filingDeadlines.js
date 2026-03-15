// 2026 U.S. Senate filing deadlines by state
// Dates reflect the last day to submit qualifying paperwork/petitions.
// Sources: individual state Secretary of State offices and Ballotpedia.

export const FILING_DEADLINES = {
  Alaska:          { date: '2026-06-01', label: 'June 1, 2026',    primaryDate: '2026-08-25' },
  Florida:         { date: '2026-05-08', label: 'May 8, 2026',     primaryDate: '2026-08-18' },
  Georgia:         { date: '2026-03-06', label: 'Mar 6, 2026',     primaryDate: '2026-05-19' },
  Iowa:            { date: '2026-03-13', label: 'Mar 13, 2026',    primaryDate: '2026-06-02' },
  Louisiana:       { date: '2026-08-14', label: 'Aug 14, 2026',    primaryDate: '2026-11-03' },
  Maine:           { date: '2026-03-15', label: 'Mar 15, 2026',    primaryDate: '2026-06-09' },
  Nebraska:        { date: '2026-03-02', label: 'Mar 2, 2026',     primaryDate: '2026-05-12' },
  'New Hampshire': { date: '2026-06-12', label: 'June 12, 2026',   primaryDate: '2026-09-08' },
  'New Jersey':    { date: '2026-04-06', label: 'Apr 6, 2026',     primaryDate: '2026-06-02' },
  'New Mexico':    { date: '2026-03-10', label: 'Mar 10, 2026',    primaryDate: '2026-06-02' },
  'North Carolina':{ date: '2025-12-19', label: 'Dec 19, 2025',    primaryDate: '2026-05-19' },
  Ohio:            { date: '2026-02-20', label: 'Feb 20, 2026',    primaryDate: '2026-05-05' },
  Texas:           { date: '2025-12-09', label: 'Dec 9, 2025',     primaryDate: '2026-03-03' },
  Virginia:        { date: '2026-03-26', label: 'Mar 26, 2026',    primaryDate: '2026-06-09' },
}

/**
 * Returns true if the filing deadline for a given state has already passed.
 * @param {string} state
 * @returns {boolean}
 */
export function filingDeadlinePassed(state) {
  const entry = FILING_DEADLINES[state]
  if (!entry) return true // assume closed if unknown
  return new Date(entry.date) < new Date()
}

/**
 * Returns the filing deadline entry for a state, or null.
 * @param {string} state
 */
export function getFilingDeadline(state) {
  return FILING_DEADLINES[state] ?? null
}
