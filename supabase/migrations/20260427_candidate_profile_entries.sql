alter table public.teacher_profiles
  add column if not exists education_entries jsonb not null default '[]'::jsonb,
  add column if not exists certificate_entries jsonb not null default '[]'::jsonb,
  add column if not exists experience_entries jsonb not null default '[]'::jsonb;

alter table public.student_profiles
  add column if not exists education_entries jsonb not null default '[]'::jsonb,
  add column if not exists certificate_entries jsonb not null default '[]'::jsonb,
  add column if not exists experience_entries jsonb not null default '[]'::jsonb;