-- 2026 Gubernatorial Candidates seed
-- Run AFTER 001_candidates.sql and 003_office_types.sql

INSERT INTO candidates (
  id, name, state, office, office_type, party, incumbent_status, race_competitiveness,
  primary_date, general_date, candidacy_status, known_positions,
  fossil_fuel_donations, fossil_fuel_amount, fossil_fuel_cycle, fossil_fuel_source, opponent
) VALUES

-- GEORGIA (Toss-Up — Brian Kemp term-limited)
(25,'Stacey Abrams','Georgia','Governor','governor','D','challenger','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Two-time gubernatorial candidate. Strong climate advocate. Supports clean energy economy for Georgia, environmental justice in communities of color, and clean water protections. Has spoken about climate as an economic and health issue.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GGA2026',
 'Burt Jones (R)'),

(26,'Andre Dickens','Georgia','Governor','governor','D','challenger','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Mayor of Atlanta. Has led Atlanta sustainability initiatives including 100% clean electricity for city operations, EV fleet transition, and urban heat island mitigation. Climate record grounded in municipal action.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GGA2026',
 'D primary: Stacey Abrams; general: Burt Jones (R)'),

(27,'Burt Jones','Georgia','Governor','governor','R','challenger','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Georgia Lt. Governor. Pro-business, pro-natural gas. Has not prioritized climate action. Georgia is a major climate vulnerability state (heat, flooding, drought in south). Limited public climate agenda.',
 'high',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GGA2026',
 'D primary winner (Abrams or Dickens)'),

-- NEW HAMPSHIRE (Lean R — Kelly Ayotte incumbent)
(28,'Kelly Ayotte','New Hampshire','Governor','governor','R','incumbent','Lean R',
 'Sept 8, 2026','Nov 3, 2026','declared',
 'Current NH Governor (elected 2024). Former US Senator. New Hampshire is heavily dependent on clean energy and tourism. Has supported offshore wind permitting and NH clean energy economy. Climate record is pragmatic-moderate.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GNH2026',
 'D candidate TBD'),

-- NEVADA (Lean R — Joe Lombardo incumbent)
(29,'Joe Lombardo','Nevada','Governor','governor','R','incumbent','Lean R',
 'June 9, 2026','Nov 3, 2026','declared',
 'Nevada Governor since 2023. Nevada is a top solar and geothermal state. Has not reversed renewable energy standards but has prioritized economic growth over climate action. Limited new climate initiatives; opposed Biden EPA rules.',
 'high',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GNV2026',
 'D candidate TBD'),

-- MINNESOTA (Lean D — Tim Walz not running)
(30,'Amy Klobuchar','Minnesota','Governor','governor','D','challenger','Lean D',
 'Aug 11, 2026','Nov 3, 2026','declared',
 'US Senator considering gubernatorial run. Moderate Democrat. Voted for IRA. Supports clean energy transition, wind energy for Minnesota (top wind state), and climate-resilient agriculture. Pragmatic approach balancing rural and urban interests.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GMN2026',
 'Lisa Demuth (R)'),

(31,'Lisa Demuth','Minnesota','Governor','governor','R','challenger','Lean D',
 'Aug 11, 2026','Nov 3, 2026','declared',
 'Minnesota House Republican Leader. Challenger. Has criticized MN clean energy mandates and carbon-free electricity standard. Supports rolling back MN''s 2040 100% clean electricity law. Pro-natural gas and energy affordability framing.',
 'high',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GMN2026',
 'Amy Klobuchar (D)'),

-- IOWA (Lean D — Kim Reynolds not running)
(32,'Rob Sand','Iowa','Governor','governor','D','challenger','Lean D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Iowa State Auditor. Farmer background. Supports clean energy transition for Iowa''s agricultural economy, especially wind energy (Iowa is #1 wind state). Advocates for climate-smart farming practices and clean water protections for Iowa rivers.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GIA2026',
 'R primary winner TBD'),

-- CALIFORNIA (Safe D — Gavin Newsom term-limited)
(33,'Antonio Villaraigosa','California','Governor','governor','D','challenger','Safe D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Former LA Mayor. Has a mixed climate record — championed urban clean energy as mayor but has received oil industry support. Supports CA clean energy standards and EV mandate but has a more moderate stance than progressive rivals on oil production.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GCA2026',
 'D primary: Eleni Kounalakis; general: R candidate TBD'),

(34,'Eleni Kounalakis','California','Governor','governor','D','challenger','Safe D',
 'June 2, 2026','Nov 3, 2026','declared',
 'CA Lieutenant Governor. Strong climate champion. Fully supports CA climate targets, offshore wind, accelerated clean energy transition, climate adaptation infrastructure, and environmental justice. Closer to Gov. Newsom''s ambitious climate record.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GCA2026',
 'D primary: Antonio Villaraigosa; general: R candidate TBD'),

-- TEXAS (Likely R — Greg Abbott incumbent)
(35,'Greg Abbott','Texas','Governor','governor','R','incumbent','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Texas Governor since 2015. Strongly pro-oil & gas. Sued Biden administration over climate and energy regulations. However, Texas leads nation in wind energy and has significant solar growth — primarily as economic development. Opposes carbon pricing and federal climate mandates.',
 'high','$5,000,000+','Career total',
 'https://www.opensecrets.org/races/industries?id=GTX2026',
 'D candidate TBD'),

-- FLORIDA (Safe R — Ron DeSantis term-limited)
(36,'Ashley Moody','Florida','Governor','governor','R','challenger','Safe R',
 'Aug 18, 2026','Nov 3, 2026','declared',
 'Currently serving as appointed US Senator. Previously FL Attorney General. Led multi-state lawsuits against Biden EPA climate regulations. Florida is extremely climate-vulnerable (sea level rise, hurricanes, flooding) but Moody has not prioritized climate adaptation policy.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=GFL2026',
 'D candidate TBD')

ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('candidates_id_seq', (SELECT MAX(id) FROM candidates));
