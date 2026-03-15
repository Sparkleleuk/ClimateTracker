-- Filing deadlines table for 2026 Senate races

create table if not exists filing_deadlines (
  state            text primary key,
  deadline_date    date not null,
  deadline_label   text not null,  -- human-readable e.g. "Dec 9, 2025"
  primary_date     date,
  notes            text
);

insert into filing_deadlines (state, deadline_date, deadline_label, primary_date, notes) values
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
on conflict (state) do update
  set deadline_date  = excluded.deadline_date,
      deadline_label = excluded.deadline_label,
      primary_date   = excluded.primary_date,
      notes          = excluded.notes;
