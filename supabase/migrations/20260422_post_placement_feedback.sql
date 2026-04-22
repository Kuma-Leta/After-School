create table if not exists public.placement_feedback_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  employer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  feedback_text text not null check (char_length(feedback_text) between 30 and 1200),
  strengths text[] not null default '{}'::text[],
  edit_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_edited_at timestamptz
);

create index if not exists idx_placement_feedback_reviews_candidate_id
  on public.placement_feedback_reviews(candidate_id);

create index if not exists idx_placement_feedback_reviews_employer_id
  on public.placement_feedback_reviews(employer_id);

create index if not exists idx_placement_feedback_reviews_job_id
  on public.placement_feedback_reviews(job_id);
