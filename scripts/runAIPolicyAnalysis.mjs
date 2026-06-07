#!/usr/bin/env node
/**
 * Runs Tier 1 AI policy analysis on all Senate+Governor candidates
 * that already have a climate score, then saves results to Supabase.
 *
 * Usage: node scripts/runAIPolicyAnalysis.mjs [--dry-run] [--ids 1,2,3]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const path = resolve(__dirname, '../.env.local')
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY
const DRY_RUN = process.argv.includes('--dry-run')
const IDS_FLAG = process.argv.indexOf('--ids')
const ONLY_IDS = IDS_FLAG !== -1 ? process.argv[IDS_FLAG + 1].split(',').map(Number) : null

// ── Data center map (inline — avoids ESM issues) ─────────────────────────────
const DC_MAP = {
  Virginia: { marketSize: 'major',       waterStress: 'medium', gridStress: 'high',   note: 'Largest data center market globally.' },
  Texas:    { marketSize: 'major',       waterStress: 'high',   gridStress: 'high',   note: 'Dallas, Austin, San Antonio major hubs.' },
  Iowa:     { marketSize: 'significant', waterStress: 'medium', gridStress: 'low',    note: 'Google, Microsoft, Meta campuses.' },
  Georgia:  { marketSize: 'significant', waterStress: 'medium', gridStress: 'medium', note: 'Growing Atlanta hub; AWS, Google, Microsoft.' },
  Nevada:   { marketSize: 'significant', waterStress: 'high',   gridStress: 'medium', note: 'Las Vegas and Reno. High desert water stress.' },
  Ohio:     { marketSize: 'significant', waterStress: 'low',    gridStress: 'medium', note: 'Columbus emerging as major hub.' },
  Arizona:  { marketSize: 'significant', waterStress: 'high',   gridStress: 'medium', note: 'Phoenix fastest-growing. Extreme water stress.' },
  'North Carolina': { marketSize: 'significant', waterStress: 'low', gridStress: 'medium', note: 'Research Triangle; Apple, Google, Microsoft.' },
  Illinois: { marketSize: 'significant', waterStress: 'low',    gridStress: 'medium', note: 'Chicago Midwest financial data hub.' },
  'New Jersey': { marketSize: 'significant', waterStress: 'low', gridStress: 'high',  note: 'Northern NJ financial data center hub.' },
}

function getDCInfo(state) { return DC_MAP[state] ?? null }

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildTier1Prompt(c) {
  const dc = getDCInfo(c.state)
  const dcText = dc
    ? `${dc.marketSize} data center market. ${dc.note} Water stress: ${dc.waterStress}. Grid stress: ${dc.gridStress}.`
    : 'No significant data center presence.'

  return `You are a nonpartisan technology policy analyst specializing in AI governance and data infrastructure. Analyze this candidate's positions on AI policy and data center regulation.

IMPORTANT: Do not consider climate positions in this score. Score only AI and data center policy positions.

Candidate: ${c.name}, ${c.party}, ${c.state}, ${c.office}
Known positions: ${c.known_positions || 'None on record'}
Big Tech PAC donations: unknown (data pending FEC API integration)
AI bill cosponsorships: unknown (data pending Congress.gov API integration)
State data center presence: ${dcText}

Score each dimension 0-100 and provide overall AI Policy Score.
Return as SCORE: XX/100

Provide:
1. AI POLICY SCORE (0-100)
   0 = opposes all AI regulation, no data center requirements
   50 = mixed or no public positions
   100 = comprehensive AI oversight champion

2. DIMENSION SCORES as JSON:
   {"datacenters_energy": N, "water_usage": N, "grid_impact": N, "ai_safety": N, "algorithmic_accountability": N, "ai_elections": N, "ai_economic": N}

3. POLICY ANALYSIS (3-4 sentences): Key AI policy positions and record

4. DATA CENTER RELEVANCE: Is this a high data center state? What specific local issues apply?

5. STRENGTHS: 1-2 AI policy strengths

6. CONCERNS: 1-2 AI policy concerns or gaps

7. BIG TECH INFLUENCE: Note party affiliations and known stances as proxy for potential conflicts

8. KEY BILLS: List any AI-related legislation they are known to have supported

Be factual and nonpartisan. Note where the record is thin or unknown.`
}

// ── Response parsers ──────────────────────────────────────────────────────────
function parseScore(text) {
  const m = text.match(/SCORE:\s*(\d+)\/100/i)
  return m ? parseInt(m[1], 10) : null
}

function parseDimensions(text) {
  try {
    const m = text.match(/\{[^{}]*"datacenters_energy"[^{}]*\}/s)
    if (!m) return null
    return JSON.parse(m[0])
  } catch { return null }
}

// ── Anthropic call ────────────────────────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`HTTP ${res.status}: ${err.error?.message ?? JSON.stringify(err)}`)
  }
  const data = await res.json()
  return {
    text: data.content.map(b => b.type === 'text' ? b.text : '').join(''),
    tokensIn: data.usage?.input_tokens ?? 0,
    tokensOut: data.usage?.output_tokens ?? 0,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🤖 AI Policy Analysis Pipeline${DRY_RUN ? ' [DRY RUN]' : ''}\n`)

  // 1. Fetch candidates
  let query = supabase
    .from('candidates')
    .select('id,name,state,office,office_type,party,known_positions,climate_score,ai_policy_score')
    .in('office_type', ['us_senate', 'governor'])
    .not('climate_score', 'is', null)
    .order('name')

  if (ONLY_IDS) query = query.in('id', ONLY_IDS)

  const { data: candidates, error } = await query
  if (error) { console.error('DB error:', error.message); process.exit(1) }

  // Skip already-scored unless forced
  const toRun = ONLY_IDS ? candidates : candidates.filter(c => c.ai_policy_score === null)
  console.log(`Found ${candidates.length} Senate/Gov with climate scores`)
  console.log(`To analyze: ${toRun.length} (${candidates.length - toRun.length} already have AI score)\n`)

  const results = []
  let totalCost = 0
  let succeeded = 0
  let failed = 0

  for (const [i, c] of toRun.entries()) {
    process.stdout.write(`[${i + 1}/${toRun.length}] ${c.name} (${c.state})... `)

    if (DRY_RUN) { console.log('SKIP (dry run)'); continue }

    try {
      const prompt = buildTier1Prompt(c)
      const { text, tokensIn, tokensOut } = await callClaude(prompt)

      const score = parseScore(text)
      const dimensions = parseDimensions(text)
      const cost = (tokensIn / 1000 * 0.015) + (tokensOut / 1000 * 0.075)
      totalCost += cost

      if (score === null) {
        console.log(`⚠ No score parsed`)
        failed++
        continue
      }

      console.log(`score=${score}/100  dim=${dimensions ? 'ok' : 'missing'}  cost=$${cost.toFixed(4)}`)

      const now = new Date().toISOString()

      // Save to ai_analyses
      await supabase.from('ai_analyses').upsert({
        candidate_id: c.id,
        ai_policy_score: score,
        ai_analysis: text,
        scores_by_dimension: dimensions,
        data_sources: { bigTech: 'unknown', aiBills: [], datacenterInfo: getDCInfo(c.state) },
        model_version: 'claude-opus-4-6',
        updated_at: now,
      }, { onConflict: 'candidate_id' })

      // Update candidates table
      await supabase.from('candidates').update({
        ai_policy_score: score,
        ai_score_updated_at: now,
      }).eq('id', c.id)

      // Log to api_usage
      await supabase.from('api_usage').insert({
        candidate_id: c.id,
        tier: 1,
        tokens_input: tokensIn,
        tokens_output: tokensOut,
        model: 'claude-opus-4-6',
        call_type: 'realtime',
        estimated_cost: cost,
        analysis_type: 'ai_policy',
      })

      results.push({ id: c.id, name: c.name, climateScore: c.climate_score, aiScore: score, dimensions })
      succeeded++

      // Rate limit pause
      if (i < toRun.length - 1) await new Promise(r => setTimeout(r, 2000))

    } catch (err) {
      console.log(`❌ ${err.message}`)
      failed++
    }
  }

  // Results table
  console.log('\n══════════════════════════════════════════════════════════════════════')
  console.log('RESULTS SUMMARY')
  console.log('══════════════════════════════════════════════════════════════════════')
  console.log(`Succeeded: ${succeeded}  Failed: ${failed}  Total API cost: $${totalCost.toFixed(4)}`)
  console.log('')

  if (results.length > 0) {
    console.log('Candidate                        Climate  AI Policy  Score Gap  Biggest Dim Gap')
    console.log('─'.repeat(80))
    for (const r of results.slice(0, 20)) {
      const gap = r.aiScore - r.climateScore
      let biggestDim = '—'
      if (r.dimensions) {
        const entries = Object.entries(r.dimensions)
        const maxDiff = entries.reduce((best, [k, v]) => {
          const diff = Math.abs(v - r.aiScore)
          return diff > best.diff ? { key: k, diff } : best
        }, { key: '', diff: 0 })
        biggestDim = `${maxDiff.key} (${r.dimensions[maxDiff.key]})`
      }
      const name = r.name.padEnd(30)
      const climate = String(r.climateScore).padStart(7)
      const ai = String(r.aiScore).padStart(9)
      const gapStr = (gap >= 0 ? '+' : '') + gap
      console.log(`${name} ${climate}  ${ai}     ${gapStr.padStart(6)}  ${biggestDim}`)
    }
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
