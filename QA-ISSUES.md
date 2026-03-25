# QA Issues — Climate Candidate Tracker
*Generated: 2026-03-24 | Non-critical issues found during QA regression*

---

## P2 — Fix Soon

### 1. Duplicate issue tags not deduplicated before DB write
**File:** `pages/api/analyze.js`
**Detail:** Tag validation (`ISSUE_TAGS.some(...)`) passes duplicate tags through. Cory Booker has `clean-energy` twice in his `issue_tags` array.
**Fix:** Add `[...new Set(issues)]` before writing to Supabase.

### 2. `compareCandiates` is a typo throughout
**Files:** `services/compareApi.js` (export), `components/ClimateTracker.jsx` (import + call)
**Detail:** Function is spelled `compareCandiates` (missing second `d`). No runtime error since both sides match, but should be corrected.
**Fix:** Rename to `compareCandidates` in both files.

### 3. `compare.js` uses raw `fetch()` instead of `@anthropic-ai/sdk`
**File:** `pages/api/compare.js`
**Detail:** `analyze.js` uses the official SDK (with retries, error normalization). `compare.js` calls the REST API directly via `fetch`. Inconsistent and misses SDK-level reliability.
**Fix:** Refactor `compare.js` to use `new Anthropic().messages.create(...)`.

---

## P3 — Fix When Possible

### 4. Ballotpedia scraper special election office detection is broken
**File:** `lib/scrapers/ballotpedia.js`
**Detail:** `scrapeStatePage` checks `state.includes('Special')` to set the office label, but `state` is a US state name (e.g. `"Ohio"`) and will never contain "Special". Special election candidates scraped from Ballotpedia will always get `office: 'U.S. Senate'` instead of `'U.S. Senate (Special)'`.
**Fix:** Use the Ballotpedia page URL or a hardcoded list (`['Ohio', 'Florida']`) to detect special elections.

### 5. Ashley Moody appears twice in the database
**Detail:** id=15 (Senate, Florida) and id=36 (Governor, Florida) are separate rows with no cross-reference. Users see her listed twice under "All Offices".
**Fix:** Add a visual indicator on candidate cards when the same person appears in multiple races (e.g. a note in `knownPositions` or a `multi_race: true` flag).

### 6. `/api/candidates` and `pages/index.js` are duplicate data-loading paths
**Detail:** `getServerSideProps` in `pages/index.js` queries Supabase directly. `/api/candidates` is only used for post-sync refresh in the UI. The two paths can drift out of sync.
**Fix:** Extract a shared `mapCandidateRow(row)` function used by both.

### 7. Silent Supabase fallback gives no user feedback
**File:** `pages/index.js`
**Detail:** If Supabase is unreachable, the app silently loads `CANDIDATES_FALLBACK` with no indication to the user that they are seeing static data.
**Fix:** Pass a `dataSource` prop to `ClimateTracker` and show a subtle banner when `source === 'fallback'`.

### 8. No CSS breakpoint below 480px
**File:** `styles/climate.css`
**Detail:** Only one breakpoint at `768px`. On very small phones (375px), the 2-column filter grid with 5 dropdowns can be cramped.
**Fix:** Add `@media (max-width: 480px)` to stack filters into a single column.

### 9. `isAdmin` check is purely cosmetic
**Detail:** Any user can add `?admin=true` to the URL to reveal the sync button. The endpoint itself is protected by `SYNC_SECRET`, so there is no security risk — but the pattern may cause confusion.
**Fix:** Document this behavior with a comment, or replace with a password prompt modal before showing the sync button.
