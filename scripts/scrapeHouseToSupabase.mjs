#!/usr/bin/env node
// scripts/scrapeHouseToSupabase.mjs
// Run locally (not on Vercel) to bypass Ballotpedia's WAF blocking of AWS IPs.
// Usage: node scripts/scrapeHouseToSupabase.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scrapeBallotpedia2026House } from '../lib/scrapers/ballotpediaHouse.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
const supabaseUrl = env.SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-')) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

async function checkSchema() {
  // Probe for the district column — if it's missing the insert will fail
  const { error } = await supabase
    .from('candidates')
    .select('district, is_battleground, tier, climate_score, issue_tags')
    .limit(1)
  if (error?.message?.includes('column') || error?.message?.includes('does not exist')) {
    console.error('❌ Schema is missing House columns.')
    console.error('   Run supabase/migrations/004_house_candidates.sql in the Supabase SQL Editor first.')
    process.exit(1)
  }
}

async function main() {
  console.log('Scraping Ballotpedia for 2026 House battleground candidates…\n')

  await checkSchema()

  const candidates = await scrapeBallotpedia2026House()

  if (candidates.length === 0) {
    console.error('❌ Scraper returned 0 candidates. Ballotpedia may have changed structure.')
    process.exit(1)
  }

  console.log(`\n✓ Scraped ${candidates.length} battleground candidates. Upserting to Supabase…\n`)

  let added = 0, updated = 0, errors = 0

  for (const c of candidates) {
    // Check if candidate already exists
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .ilike('name', c.name)
      .eq('state', c.state)
      .limit(1)

    const row = {
      name:             c.name,
      state:            c.state,
      office:           c.office,
      office_type:      'us_house',
      party:            c.party,
      incumbent_status: c.incumbentStatus ?? 'challenger',
      candidacy_status: c.candidacyStatus ?? 'declared',
      primary_date:     c.primaryDate ?? null,
      general_date:     c.generalDate ?? 'Nov 3, 2026',
      ballotpedia_url:  c.ballotpediaUrl ?? null,
      district:         c.district ?? null,
      district_pvi:     c.districtPvi ?? null,
      is_battleground:  c.isBattleground ?? false,
      tier:             c.tier ?? 1,
      fossil_fuel_donations: 'unknown',
    }

    if (existing?.length) {
      const { error } = await supabase
        .from('candidates')
        .update(row)
        .eq('id', existing[0].id)
      if (error) { console.error(`  ✗ ${c.name}: ${error.message}`); errors++ }
      else { console.log(`  ↺ Updated: ${c.name} (${c.state})`); updated++ }
    } else {
      const { error } = await supabase
        .from('candidates')
        .insert(row)
      if (error) { console.error(`  ✗ ${c.name}: ${error.message}`); errors++ }
      else { console.log(`  + Added:   ${c.name} (${c.state}, ${c.party})`); added++ }
    }
  }

  console.log(`\n✅ Done. Added: ${added}, Updated: ${updated}, Errors: ${errors}`)
  if (errors > 0) {
    console.log('\n⚠  Some inserts failed. If you see "column does not exist" errors,')
    console.log('   run supabase/migrations/004_house_candidates.sql in the Supabase SQL Editor first.')
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
