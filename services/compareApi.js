export async function compareCandiates(candidate1, candidate2, issue) {
  const response = await fetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate1, candidate2, issue }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `API error: ${response.status}`)
  }

  return response.json()
}
