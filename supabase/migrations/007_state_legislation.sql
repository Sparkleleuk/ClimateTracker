-- State legislature bill sponsorships — for candidates with prior state legislative service.
-- Populated via the OpenStates API. 30-day TTL enforced in app layer.

create table if not exists state_legislation (
  id           uuid primary key default gen_random_uuid(),
  candidate_id integer references candidates(id),
  bill_number  text not null,
  state        text not null,
  title        text not null,
  description  text,
  status       text,
  session      text,
  relevance    text not null check (relevance in ('climate', 'ai_policy')),
  fetched_at   timestamp with time zone not null default now(),
  unique (candidate_id, bill_number, relevance)
);

create index if not exists idx_state_legislation_candidate
  on state_legislation(candidate_id);
create index if not exists idx_state_legislation_relevance
  on state_legislation(candidate_id, relevance);
