create table if not exists public.service_availability_weekly (
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_available boolean not null default false,
  start_time time,
  end_time time,
  timezone text not null default 'UTC',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tutor_id, day_of_week),
  check (
    (is_available = false and start_time is null and end_time is null)
    or (is_available = true and start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists idx_service_availability_weekly_tutor
  on public.service_availability_weekly (tutor_id);

alter table public.service_availability_weekly enable row level security;

drop policy if exists "Tutors can read own service availability" on public.service_availability_weekly;
drop policy if exists "Tutors can upsert own service availability" on public.service_availability_weekly;
drop policy if exists "Tutors can delete own service availability" on public.service_availability_weekly;
drop policy if exists "Employers can read applicant service availability" on public.service_availability_weekly;

create policy "Tutors can read own service availability"
  on public.service_availability_weekly
  for select
  using (tutor_id = auth.uid());

create policy "Tutors can upsert own service availability"
  on public.service_availability_weekly
  for all
  using (tutor_id = auth.uid())
  with check (tutor_id = auth.uid());

create policy "Employers can read applicant service availability"
  on public.service_availability_weekly
  for select
  using (
    exists (
      select 1
      from public.applications application
      join public.jobs job on job.id = application.job_id
      where application.applicant_id = service_availability_weekly.tutor_id
        and job.organization_id = auth.uid()
    )
  );
