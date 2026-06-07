-- Candidate requests submitted by users when a search returns no results
create table candidate_requests (
  id            uuid primary key default gen_random_uuid(),
  requested_name text not null,
  state         text not null,
  office        text not null,
  party         text,
  source_url    text,
  search_term   text,
  status        text not null default 'pending',
  admin_notes   text,
  created_at    timestamp with time zone not null default now(),
  reviewed_at   timestamp with time zone
);

-- Search analytics to track zero-result searches and request form triggers
create table search_analytics (
  id                    uuid primary key default gen_random_uuid(),
  search_term           text not null,
  results_count         integer not null,
  triggered_request_form boolean not null default false,
  created_at            timestamp with time zone not null default now()
);
