-- ============================================================
-- Climate Candidate Tracker — Full Schema
-- Run this in the Supabase SQL Editor to create all tables
-- and seed all candidates from scratch.
-- ============================================================

-- ── candidates ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS candidates (
  id                    SERIAL PRIMARY KEY,
  name                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  office                TEXT NOT NULL,
  office_type           TEXT NOT NULL DEFAULT 'us_senate',
  party                 CHAR(1) NOT NULL CHECK (party IN ('D','R','I','L','G')),
  incumbent_status      TEXT NOT NULL DEFAULT 'challenger',
  race_competitiveness  TEXT,
  primary_date          TEXT,
  general_date          TEXT,
  candidacy_status      TEXT NOT NULL DEFAULT 'declared'
                          CHECK (candidacy_status IN ('declared','nominee','withdrew','eliminated')),
  known_positions       TEXT,
  fossil_fuel_donations  TEXT,
  fossil_fuel_amount    TEXT,
  fossil_fuel_cycle     TEXT,
  fossil_fuel_source    TEXT,
  opponent              TEXT,
  ballotpedia_url       TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidates_updated_at ON candidates;
CREATE TRIGGER candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ── filing_deadlines ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS filing_deadlines (
  state           TEXT PRIMARY KEY,
  deadline_date   DATE NOT NULL,
  deadline_label  TEXT NOT NULL,
  primary_date    DATE,
  notes           TEXT
);

-- ── Senate candidates (IDs 1–24) ─────────────────────────────

INSERT INTO candidates (
  id, name, state, office, office_type, party, incumbent_status, race_competitiveness,
  primary_date, general_date, candidacy_status, known_positions,
  fossil_fuel_donations, fossil_fuel_amount, fossil_fuel_cycle, fossil_fuel_source, opponent
) VALUES

(1,'Susan Collins','Maine','U.S. Senate','us_senate','R','incumbent','Toss-Up',
 'June 9, 2026','Nov 3, 2026','declared',
 'Has broken with party on some climate votes; supported offshore wind. Voted against IRA.',
 'moderate','$289,469','2020 cycle',
 'https://www.opensecrets.org/members-of-congress/susan-collins/industries?cid=N00000491&cycle=2020',
 'Janet Mills (D)'),

(2,'Jon Ossoff','Georgia','U.S. Senate','us_senate','D','incumbent','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Voted for IRA. Supports clean energy investment and EV manufacturing in Georgia.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/jon-ossoff/industries?cid=N00040675&cycle=2026',
 'R primary: Mike Collins, Buddy Carter, Derek Dooley'),

(3,'Roy Cooper','North Carolina','U.S. Senate','us_senate','D','challenger','Lean R',
 'May 19, 2026','Nov 3, 2026','declared',
 'As Governor signed executive orders on clean energy; set 2050 carbon neutrality goals for NC.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNC2026',
 'Michael Whatley (R)'),

(4,'Michael Whatley','North Carolina','U.S. Senate','us_senate','R','challenger','Lean R',
 'May 19, 2026','Nov 3, 2026','declared',
 'Former RNC Chairman. Trump-endorsed. Limited public climate record.',
 'unknown',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNC2026',
 'Roy Cooper (D)'),

(5,'Janet Mills','Maine','U.S. Senate','us_senate','D','challenger','Toss-Up',
 'June 9, 2026','Nov 3, 2026','declared',
 'As Maine Governor, set 100% clean electricity goal by 2040. Strong environmental record.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SME2026',
 'Susan Collins (R)'),

(6,'Sherrod Brown','Ohio','U.S. Senate (Special)','us_senate','D','challenger','Lean R',
 'May 5, 2026','Nov 3, 2026','declared',
 'Former Senator; has supported clean energy manufacturing. Mixed fossil fuel record for Ohio.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/sherrod-brown/industries?cid=N00003374&cycle=2024',
 'Jon Husted (R)'),

(7,'Jon Husted','Ohio','U.S. Senate (Special)','us_senate','R','incumbent (appointed)','Lean R',
 'May 5, 2026','Nov 3, 2026','declared',
 'Appointed by Gov. DeWine. Supportive of Ohio energy sector including natural gas.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SOH2026',
 'Sherrod Brown (D)'),

(8,'Ashley Hinson','Iowa','U.S. Senate','us_senate','R','challenger','Likely R',
 'June 2, 2026','Nov 3, 2026','declared',
 'Congresswoman. Supports wind energy (Iowa is major wind state). Opposed carbon pricing.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/ashley-hinson/industries?cid=N00044544&cycle=2024',
 'D primary: Zach Wahls (leading), Josh Turek'),

(9,'John Cornyn','Texas','U.S. Senate','us_senate','R','incumbent','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Strongly pro-oil & gas. Opposed IRA, climate regulations. Supported LNG exports.',
 'high','$4,067,906','Career total (through 2020)',
 'https://www.opensecrets.org/members-of-congress/john-cornyn/industries?cid=N00024852',
 'James Talarico (D); Cornyn in R runoff vs. Ken Paxton (May 26)'),

(10,'Mark Warner','Virginia','U.S. Senate','us_senate','D','incumbent','Lean D',
 'June 9, 2026','Nov 3, 2026','declared',
 'Voted for IRA. Supports offshore wind off Virginia coast. Climate-focused record.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/mark-warner/industries?cid=N00002097&cycle=2026',
 'David Williams (R)'),

(11,'Cory Booker','New Jersey','U.S. Senate','us_senate','D','incumbent','Lean D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Strong climate champion. Co-sponsored Green New Deal. Advocates environmental justice.',
 'low','$0','Ongoing',
 'https://nofossilfuelmoney.org/pledges/',
 'R primary: Alex Zdan (leading), Justin Murphy'),

(12,'William Cassidy','Louisiana','U.S. Senate','us_senate','R','incumbent','Safe R',
 'Nov 3, 2026','Nov 3, 2026','declared',
 'Has acknowledged climate science. Supported some coastal restoration. Strong oil & gas ties.',
 'high','$1,554,805','Career total (through 2020)',
 'https://www.opensecrets.org/members-of-congress/bill-cassidy/industries?cid=N00030245',
 'Julia Letlow (R primary); D primary: Jamie Davis, Nick Albares'),

(13,'Ben Ray Luján','New Mexico','U.S. Senate','us_senate','D','incumbent','Lean D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Voted for IRA. Advocates clean energy transition while balancing New Mexico oil economy. Pledged not to take fossil fuel exploration money.',
 'low','$0 (fossil fuel exploration)','Pledge since 2019',
 'https://readsludge.com/2019/04/19/democratic-leader-ben-ray-lujan-endorses-green-new-deal-wont-take-fossil-fuel-exploration-money/',
 'No Republican on ballot (disqualified); D primary challenger: Matt Dodson'),

(14,'Mary Peltola','Alaska','U.S. Senate','us_senate','D','challenger','Likely R',
 'Aug 25, 2026','Nov 3, 2026','declared',
 'Former Rep. Supported some resource development while emphasizing environmental protection for Alaska communities.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/mary-peltola/industries?cid=N00050780&cycle=2024',
 'Dan Sullivan (R, incumbent)'),

(15,'Ashley Moody','Florida','U.S. Senate (Special)','us_senate','R','incumbent (appointed)','Lean R',
 'Aug 18, 2026','Nov 3, 2026','declared',
 'Appointed AG turned Senator. Florida faces major climate threats (sea level, hurricanes). Limited proactive climate record.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SFL2026',
 'Alexander Vindman (D)'),

(16,'Alexander Vindman','Florida','U.S. Senate (Special)','us_senate','D','challenger','Lean R',
 'Aug 18, 2026','Nov 3, 2026','declared',
 'National security focus. Has cited climate as a national security threat. No detailed legislative climate record.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SFL2026',
 'Ashley Moody (R)'),

(17,'John E. Sununu','New Hampshire','U.S. Senate','us_senate','R','challenger','Lean D',
 'Sept 8, 2026','Nov 3, 2026','declared',
 'Former Senator. Generally skeptical of climate regulations. Opposes carbon taxes.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNH2026',
 'Chris Pappas (D)'),

(18,'Dan Osborn','Nebraska','U.S. Senate','us_senate','I','challenger','Lean R',
 'May 12, 2026','Nov 3, 2026','declared',
 'Independent. Ran strong race in 2024. Labor-focused. Climate position not prominently defined.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNE2026',
 'Pete Ricketts (R, incumbent)'),

(19,'James Talarico','Texas','U.S. Senate','us_senate','D','challenger','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Former Texas state legislator. Progressive climate champion. Co-authored Texas clean energy legislation. Supports aggressive federal climate action and clean energy transition.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=STX2026',
 'John Cornyn (R)'),

(20,'Ken Paxton','Texas','U.S. Senate','us_senate','R','challenger','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Former Texas AG. Led multi-state lawsuit against EPA climate regulations. Deeply anti-climate policy. In Republican runoff against Cornyn.',
 'high',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=STX2026',
 'John Cornyn (R, primary runoff)'),

(21,'Zach Wahls','Iowa','U.S. Senate','us_senate','D','challenger','Likely R',
 'June 2, 2026','Nov 3, 2026','declared',
 'Iowa state senator. Supports renewable energy transition, particularly wind. Has backed clean energy investments and climate-aligned agriculture policies.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SIA2026',
 'Ashley Hinson (R)'),

(22,'Chris Pappas','New Hampshire','U.S. Senate','us_senate','D','challenger','Lean D',
 'Sept 8, 2026','Nov 3, 2026','declared',
 'Former NH Congressman. Supported IRA and clean energy investments. Focused on climate resilience for New England.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNH2026',
 'John E. Sununu (R)'),

(23,'David Williams','Virginia','U.S. Senate','us_senate','R','challenger','Lean D',
 'June 9, 2026','Nov 3, 2026','declared',
 'Virginia politician. Limited public climate record. Expected to oppose Biden-era climate regulations.',
 'unknown',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SVA2026',
 'Mark Warner (D)'),

(24,'Dan Sullivan','Alaska','U.S. Senate','us_senate','R','incumbent','Likely R',
 'Aug 25, 2026','Nov 3, 2026','declared',
 'Alaska incumbent. Supports oil and gas development including ANWR. Mixed on climate — has backed some conservation but opposed major climate legislation.',
 'high',NULL,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/dan-sullivan/industries?cid=N00035774&cycle=2024',
 'Mary Peltola (D)')

ON CONFLICT (id) DO NOTHING;

-- ── Governor candidates (IDs 25–36) ──────────────────────────

INSERT INTO candidates (
  id, name, state, office, office_type, party, incumbent_status, race_competitiveness,
  primary_date, general_date, candidacy_status, known_positions,
  fossil_fuel_donations, fossil_fuel_amount, fossil_fuel_cycle, fossil_fuel_source, opponent
) VALUES

(25,'Stacey Abrams','Georgia','Governor','governor','D','challenger','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Two-time gubernatorial candidate. Strong climate advocate. Supports clean energy economy for Georgia, environmental justice in communities of color, and clean water protections. Has spoken about climate as an economic and health issue.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GGA2026',
 'Burt Jones (R)'),

(26,'Andre Dickens','Georgia','Governor','governor','D','challenger','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Mayor of Atlanta. Has led Atlanta sustainability initiatives including 100% clean electricity for city operations, EV fleet transition, and urban heat island mitigation. Climate record grounded in municipal action.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GGA2026',
 'D primary: Stacey Abrams; general: Burt Jones (R)'),

(27,'Burt Jones','Georgia','Governor','governor','R','challenger','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Georgia Lt. Governor. Pro-business, pro-natural gas. Has not prioritized climate action. Georgia is a major climate vulnerability state (heat, flooding, drought in south). Limited public climate agenda.',
 'high',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GGA2026',
 'D primary winner (Abrams or Dickens)'),

(28,'Kelly Ayotte','New Hampshire','Governor','governor','R','incumbent','Lean R',
 'Sept 8, 2026','Nov 3, 2026','declared',
 'Current NH Governor (elected 2024). Former US Senator. New Hampshire is heavily dependent on clean energy and tourism. Has supported offshore wind permitting and NH clean energy economy. Climate record is pragmatic-moderate.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GNH2026',
 'D candidate TBD'),

(29,'Joe Lombardo','Nevada','Governor','governor','R','incumbent','Lean R',
 'June 9, 2026','Nov 3, 2026','declared',
 'Nevada Governor since 2023. Nevada is a top solar and geothermal state. Has not reversed renewable energy standards but has prioritized economic growth over climate action. Limited new climate initiatives; opposed Biden EPA rules.',
 'high',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GNV2026',
 'D candidate TBD'),

(30,'Amy Klobuchar','Minnesota','Governor','governor','D','challenger','Lean D',
 'Aug 11, 2026','Nov 3, 2026','declared',
 'US Senator considering gubernatorial run. Moderate Democrat. Voted for IRA. Supports clean energy transition, wind energy for Minnesota (top wind state), and climate-resilient agriculture. Pragmatic approach balancing rural and urban interests.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GMN2026',
 'Lisa Demuth (R)'),

(31,'Lisa Demuth','Minnesota','Governor','governor','R','challenger','Lean D',
 'Aug 11, 2026','Nov 3, 2026','declared',
 'Minnesota House Republican Leader. Challenger. Has criticized MN clean energy mandates and carbon-free electricity standard. Supports rolling back MN''s 2040 100% clean electricity law. Pro-natural gas and energy affordability framing.',
 'high',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GMN2026',
 'Amy Klobuchar (D)'),

(32,'Rob Sand','Iowa','Governor','governor','D','challenger','Lean D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Iowa State Auditor. Farmer background. Supports clean energy transition for Iowa''s agricultural economy, especially wind energy (Iowa is #1 wind state). Advocates for climate-smart farming practices and clean water protections for Iowa rivers.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GIA2026',
 'R primary winner TBD'),

(33,'Antonio Villaraigosa','California','Governor','governor','D','challenger','Safe D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Former LA Mayor. Has a mixed climate record — championed urban clean energy as mayor but has received oil industry support. Supports CA clean energy standards and EV mandate but has a more moderate stance than progressive rivals on oil production.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GCA2026',
 'D primary: Eleni Kounalakis; general: R candidate TBD'),

(34,'Eleni Kounalakis','California','Governor','governor','D','challenger','Safe D',
 'June 2, 2026','Nov 3, 2026','declared',
 'CA Lieutenant Governor. Strong climate champion. Fully supports CA climate targets, offshore wind, accelerated clean energy transition, climate adaptation infrastructure, and environmental justice. Closer to Gov. Newsom''s ambitious climate record.',
 'low',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GCA2026',
 'D primary: Antonio Villaraigosa; general: R candidate TBD'),

(35,'Greg Abbott','Texas','Governor','governor','R','incumbent','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Texas Governor since 2015. Strongly pro-oil & gas. Sued Biden administration over climate and energy regulations. However, Texas leads nation in wind energy and has significant solar growth — primarily as economic development. Opposes carbon pricing and federal climate mandates.',
 'high','$5,000,000+','Career total',
 'https://www.opensecrets.org/races/industries?id=GTX2026',
 'D candidate TBD'),

(36,'Ashley Moody','Florida','Governor','governor','R','challenger','Safe R',
 'Aug 18, 2026','Nov 3, 2026','declared',
 'Currently serving as appointed US Senator. Previously FL Attorney General. Led multi-state lawsuits against Biden EPA climate regulations. Florida is extremely climate-vulnerable (sea level rise, hurricanes, flooding) but Moody has not prioritized climate adaptation policy.',
 'moderate',NULL,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GFL2026',
 'D candidate TBD')

ON CONFLICT (id) DO NOTHING;

-- ── Filing deadlines ──────────────────────────────────────────

INSERT INTO filing_deadlines (state, deadline_date, deadline_label, primary_date, notes) VALUES
('Alaska',         '2026-06-01', 'June 1, 2026',     '2026-08-25', 'Alaska Division of Elections deadline'),
('Florida',        '2026-05-08', 'May 8, 2026',      '2026-08-18', 'Special election qualifying period'),
('Georgia',        '2026-03-06', 'Mar 6, 2026',      '2026-05-19', 'Georgia qualifying closed'),
('Iowa',           '2026-03-13', 'Mar 13, 2026',     '2026-06-02', 'Iowa Secretary of State deadline'),
('Louisiana',      '2026-08-14', 'Aug 14, 2026',     '2026-11-03', 'Louisiana jungle primary qualifying'),
('Maine',          '2026-03-15', 'Mar 15, 2026',     '2026-06-09', 'Maine filing deadline'),
('Nebraska',       '2026-03-02', 'Mar 2, 2026',      '2026-05-12', 'Nebraska filing closed'),
('New Hampshire',  '2026-06-12', 'June 12, 2026',    '2026-09-08', 'NH filing opens closer to primary'),
('New Jersey',     '2026-04-06', 'Apr 6, 2026',      '2026-06-02', 'NJ petition deadline'),
('New Mexico',     '2026-03-10', 'Mar 10, 2026',     '2026-06-02', 'NM filing closed'),
('North Carolina', '2025-12-19', 'Dec 19, 2025',     '2026-05-19', 'NC filing closed — passed'),
('Ohio',           '2026-02-20', 'Feb 20, 2026',     '2026-05-05', 'Ohio special election filing closed'),
('Texas',          '2025-12-09', 'Dec 9, 2025',      '2026-03-03', 'TX filing closed — primary held'),
('Virginia',       '2026-03-26', 'Mar 26, 2026',     '2026-06-09', 'VA deadline pending')
ON CONFLICT (state) DO UPDATE
  SET deadline_date  = EXCLUDED.deadline_date,
      deadline_label = EXCLUDED.deadline_label,
      primary_date   = EXCLUDED.primary_date,
      notes          = EXCLUDED.notes;

-- ── Reset sequence ────────────────────────────────────────────

SELECT setval('candidates_id_seq', (SELECT MAX(id) FROM candidates));
