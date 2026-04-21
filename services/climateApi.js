export async function analyzeCandidate(candidate) {
  // Extract forceFullAnalysis from the candidate object if set by the UI
  const { forceFullAnalysis, ...candidateData } = candidate

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate: candidateData, forceFullAnalysis: forceFullAnalysis ?? false }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `API error: ${response.status}`)
  }

  return response.json()
}
