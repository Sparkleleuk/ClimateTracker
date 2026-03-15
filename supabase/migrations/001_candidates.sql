-- Climate Candidate Tracker — candidates table
-- Run this in your Supabase SQL editor

create table if not exists candidates (
  id                   serial primary key,
  name                 text not null,
  state                text not null,
  office               text not null,
  party                char(1) not null check (party in ('D','R','I','L','G')),
  incumbent_status     text not null default 'challenger',
  race_competitiveness text,
  primary_date         text,
  general_date         text,
  candidacy_status     text not null default 'declared'
                         check (candidacy_status in ('declared','nominee','withdrew','eliminated')),
  known_positions      text,
  fossil_fuel_donations text,
  fossil_fuel_amount   text,
  fossil_fuel_cycle    text,
  fossil_fuel_source   text,
  opponent             text,
  ballotpedia_url      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger candidates_updated_at
  before update on candidates
  for each row execute procedure set_updated_at();

-- Seed initial candidates (all 24 tracked candidates)
insert into candidates (
  id, name, state, office, party, incumbent_status, race_competitiveness,
  primary_date, general_date, candidacy_status, known_positions,
  fossil_fuel_donations, fossil_fuel_amount, fossil_fuel_cycle, fossil_fuel_source, opponent
) values
-- COMPETITIVE RACES
(1,'Susan Collins','Maine','U.S. Senate','R','incumbent','Toss-Up',
 'June 9, 2026','Nov 3, 2026','declared',
 'Has broken with party on some climate votes; supported offshore wind. Voted against IRA.',
 'moderate','$289,469','2020 cycle',
 'https://www.opensecrets.org/members-of-congress/susan-collins/industries?cid=N00000491&cycle=2020',
 'Janet Mills (D)'),

(2,'Jon Ossoff','Georgia','U.S. Senate','D','incumbent','Toss-Up',
 'May 19, 2026','Nov 3, 2026','declared',
 'Voted for IRA. Supports clean energy investment and EV manufacturing in Georgia.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/jon-ossoff/industries?cid=N00040675&cycle=2026',
 'R primary: Mike Collins, Buddy Carter, Derek Dooley'),

(3,'Roy Cooper','North Carolina','U.S. Senate','D','challenger','Lean R',
 'May 19, 2026','Nov 3, 2026','declared',
 'As Governor signed executive orders on clean energy; set 2050 carbon neutrality goals for NC.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNC2026',
 'Michael Whatley (R)'),

(4,'Michael Whatley','North Carolina','U.S. Senate','R','challenger','Lean R',
 'May 19, 2026','Nov 3, 2026','declared',
 'Former RNC Chairman. Trump-endorsed. Limited public climate record.',
 'unknown',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNC2026',
 'Roy Cooper (D)'),

(5,'Janet Mills','Maine','U.S. Senate','D','challenger','Toss-Up',
 'June 9, 2026','Nov 3, 2026','declared',
 'As Maine Governor, set 100% clean electricity goal by 2040. Strong environmental record.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SME2026',
 'Susan Collins (R)'),

(6,'Sherrod Brown','Ohio','U.S. Senate (Special)','D','challenger','Lean R',
 'May 5, 2026','Nov 3, 2026','declared',
 'Former Senator; has supported clean energy manufacturing. Mixed fossil fuel record for Ohio.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/sherrod-brown/industries?cid=N00003374&cycle=2024',
 'Jon Husted (R)'),

(7,'Jon Husted','Ohio','U.S. Senate (Special)','R','incumbent (appointed)','Lean R',
 'May 5, 2026','Nov 3, 2026','declared',
 'Appointed by Gov. DeWine. Supportive of Ohio energy sector including natural gas.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SOH2026',
 'Sherrod Brown (D)'),

(8,'Ashley Hinson','Iowa','U.S. Senate','R','challenger','Likely R',
 'June 2, 2026','Nov 3, 2026','declared',
 'Congresswoman. Supports wind energy (Iowa is major wind state). Opposed carbon pricing.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/ashley-hinson/industries?cid=N00044544&cycle=2024',
 'D primary: Zach Wahls (leading), Josh Turek'),

(9,'John Cornyn','Texas','U.S. Senate','R','incumbent','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Strongly pro-oil & gas. Opposed IRA, climate regulations. Supported LNG exports.',
 'high','$4,067,906','Career total (through 2020)',
 'https://www.opensecrets.org/members-of-congress/john-cornyn/industries?cid=N00024852',
 'James Talarico (D); Cornyn in R runoff vs. Ken Paxton (May 26)'),

(10,'Mark Warner','Virginia','U.S. Senate','D','incumbent','Lean D',
 'June 9, 2026','Nov 3, 2026','declared',
 'Voted for IRA. Supports offshore wind off Virginia coast. Climate-focused record.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/mark-warner/industries?cid=N00002097&cycle=2026',
 'David Williams (R)'),

(11,'Cory Booker','New Jersey','U.S. Senate','D','incumbent','Lean D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Strong climate champion. Co-sponsored Green New Deal. Advocates environmental justice.',
 'low','$0','Ongoing',
 'https://nofossilfuelmoney.org/pledges/',
 'R primary: Alex Zdan (leading), Justin Murphy'),

(12,'William Cassidy','Louisiana','U.S. Senate','R','incumbent','Safe R',
 'Nov 3, 2026','Nov 3, 2026','declared',
 'Has acknowledged climate science. Supported some coastal restoration. Strong oil & gas ties.',
 'high','$1,554,805','Career total (through 2020)',
 'https://www.opensecrets.org/members-of-congress/bill-cassidy/industries?cid=N00030245',
 'Julia Letlow (R primary); D primary: Jamie Davis, Nick Albares'),

(13,'Ben Ray Luján','New Mexico','U.S. Senate','D','incumbent','Lean D',
 'June 2, 2026','Nov 3, 2026','declared',
 'Voted for IRA. Advocates clean energy transition while balancing New Mexico oil economy. Pledged not to take fossil fuel exploration money.',
 'low','$0 (fossil fuel exploration)','Pledge since 2019',
 'https://readsludge.com/2019/04/19/democratic-leader-ben-ray-lujan-endorses-green-new-deal-wont-take-fossil-fuel-exploration-money/',
 'No Republican on ballot (disqualified); D primary challenger: Matt Dodson'),

(14,'Mary Peltola','Alaska','U.S. Senate','D','challenger','Likely R',
 'Aug 25, 2026','Nov 3, 2026','declared',
 'Former Rep. Supported some resource development while emphasizing environmental protection for Alaska communities.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/mary-peltola/industries?cid=N00050780&cycle=2024',
 'Dan Sullivan (R, incumbent)'),

-- FLORIDA SPECIAL
(15,'Ashley Moody','Florida','U.S. Senate (Special)','R','incumbent (appointed)','Lean R',
 'Aug 18, 2026','Nov 3, 2026','declared',
 'Appointed AG turned Senator. Florida faces major climate threats (sea level, hurricanes). Limited proactive climate record.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SFL2026',
 'Alexander Vindman (D)'),

(16,'Alexander Vindman','Florida','U.S. Senate (Special)','D','challenger','Lean R',
 'Aug 18, 2026','Nov 3, 2026','declared',
 'National security focus. Has cited climate as a national security threat. No detailed legislative climate record.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SFL2026',
 'Ashley Moody (R)'),

-- OPEN SEATS
(17,'John E. Sununu','New Hampshire','U.S. Senate','R','challenger','Lean D',
 'Sept 8, 2026','Nov 3, 2026','declared',
 'Former Senator. Generally skeptical of climate regulations. Opposes carbon taxes.',
 'moderate',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNH2026',
 'Chris Pappas (D)'),

(18,'Dan Osborn','Nebraska','U.S. Senate','I','challenger','Lean R',
 'May 12, 2026','Nov 3, 2026','declared',
 'Independent. Ran strong race in 2024. Labor-focused. Climate position not prominently defined.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNE2026',
 'Pete Ricketts (R, incumbent)'),

-- NEW CANDIDATES (Step 8)
(19,'James Talarico','Texas','U.S. Senate','D','challenger','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Former Texas state legislator. Progressive climate champion. Co-authored Texas clean energy legislation. Supports aggressive federal climate action and clean energy transition.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=STX2026',
 'John Cornyn (R)'),

(20,'Ken Paxton','Texas','U.S. Senate','R','challenger','Likely R',
 'Mar 3, 2026','Nov 3, 2026','declared',
 'Former Texas AG. Led multi-state lawsuit against EPA climate regulations. Deeply anti-climate policy. In Republican runoff against Cornyn.',
 'high',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=STX2026',
 'John Cornyn (R, primary runoff)'),

(21,'Zach Wahls','Iowa','U.S. Senate','D','challenger','Likely R',
 'June 2, 2026','Nov 3, 2026','declared',
 'Iowa state senator. Supports renewable energy transition, particularly wind. Has backed clean energy investments and climate-aligned agriculture policies.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SIA2026',
 'Ashley Hinson (R)'),

(22,'Chris Pappas','New Hampshire','U.S. Senate','D','challenger','Lean D',
 'Sept 8, 2026','Nov 3, 2026','declared',
 'Former NH Congressman. Supported IRA and clean energy investments. Focused on climate resilience for New England.',
 'low',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SNH2026',
 'John E. Sununu (R)'),

(23,'David Williams','Virginia','U.S. Senate','R','challenger','Lean D',
 'June 9, 2026','Nov 3, 2026','declared',
 'Virginia politician. Limited public climate record. Expected to oppose Biden-era climate regulations.',
 'unknown',null,'2026 cycle',
 'https://www.opensecrets.org/races/industries?id=SVA2026',
 'Mark Warner (D)'),

(24,'Dan Sullivan','Alaska','U.S. Senate','R','incumbent','Likely R',
 'Aug 25, 2026','Nov 3, 2026','declared',
 'Alaska incumbent. Supports oil and gas development including ANWR. Mixed on climate — has backed some conservation but opposed major climate legislation.',
 'high',null,'2026 cycle',
 'https://www.opensecrets.org/members-of-congress/dan-sullivan/industries?cid=N00035774&cycle=2024',
 'Mary Peltola (D)')

on conflict (id) do nothing;

-- Reset sequence to start after seeded IDs
select setval('candidates_id_seq', (select max(id) from candidates));
