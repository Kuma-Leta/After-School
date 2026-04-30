-- Add education level metadata to jobs for posting requirements and browsing filters.

alter table public.jobs
  add column if not exists education_level text;
