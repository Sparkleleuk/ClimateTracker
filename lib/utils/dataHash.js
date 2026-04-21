import { createHash } from 'crypto'

/**
 * Compute a short MD5 hash of the candidate's mutable data fields.
 * Used to detect whether a candidate's record has changed since last sync,
 * which triggers re-analysis.
 *
 * @param {Object} candidate
 * @returns {string} First 12 characters of the MD5 hex digest
 */
export function computeDataHash(candidate) {
  const input = `${candidate.known_positions ?? ''}|${candidate.fossil_fuel_donations ?? ''}|${candidate.incumbent_status ?? ''}`
  return createHash('md5').update(input).digest('hex').slice(0, 12)
}
