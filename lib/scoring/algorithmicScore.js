/**
 * Compute an algorithmic climate score for Tier 3 House candidates
 * (safe incumbents where a full AI analysis is not cost-effective).
 *
 * Returns: { score, summary, stances, confidence, scoreSource, disclaimer }
 */
export function computeAlgorithmicScore(candidate) {
  const party = candidate.party ?? 'I'
  const fossilDonations = candidate.fossilFuelDonations ?? 'unknown'
  const knownPositions = (candidate.knownPositions ?? '').toLowerCase()

  // Base score by party
  let score = party === 'D' ? 55 : party === 'R' ? 35 : 45

  // Adjust for fossil fuel donations
  if (fossilDonations === 'high') {
    score -= 20
  } else if (fossilDonations === 'moderate') {
    score -= 8
  } else if (fossilDonations === 'low') {
    score += 5
  }
  // 'unknown' = no change

  // IRA / Inflation Reduction Act mentions
  const mentionsIra =
    knownPositions.includes('ira') ||
    knownPositions.includes('inflation reduction act')

  if (mentionsIra) {
    if (party === 'D') {
      score += 10
    } else if (
      party === 'R' &&
      (knownPositions.includes('opposed') || knownPositions.includes('against'))
    ) {
      score -= 10
    }
  }

  // Clamp between 5 and 95
  score = Math.max(5, Math.min(95, score))

  const partyLabel = party === 'D' ? 'Democrat' : party === 'R' ? 'Republican' : 'Independent'
  const donationLabel = fossilDonations !== 'unknown'
    ? ` and ${fossilDonations} fossil fuel donations`
    : ''

  const summary = `Algorithmic score based on ${partyLabel} party affiliation${donationLabel}. No AI analysis has been run for this candidate yet.`

  return {
    score,
    summary,
    stances: {
      clean_energy: 'unknown',
      fossil_fuels: 'unknown',
      carbon_pricing: 'unknown',
      environmental_justice: 'unknown',
    },
    confidence: 'low',
    scoreSource: 'algorithmic',
    disclaimer:
      'Score derived from party affiliation and donation data. Click "Run Full Analysis" for AI assessment.',
  }
}
