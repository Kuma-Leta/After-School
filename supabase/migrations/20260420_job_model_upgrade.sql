-- Job model upgrade: explicit mode, city, and employment type.

alter table public.jobs
  add column if not exists job_mode text,
  add column if not exists city text,
  add column if not exists employment_type text,
  add column if not exists part_time boolean default false;

-- Backfill job_mode from existing data.
update public.jobs
set job_mode = case
  when coalesce(job_mode, '') <> '' then job_mode
  when coalesce(location, '') ~* '(remote|online|virtual|work\s*from\s*home|wfh)' then 'remote'
  else 'onsite'
end;

-- Backfill employment_type from legacy job_type and part_time.
update public.jobs
set employment_type = case
  when coalesce(employment_type, '') <> '' then employment_type
  when coalesce(part_time, false) = true then 'part_time'
  when lower(coalesce(job_type, '')) in ('full-time', 'fulltime') then 'full_time'
  when lower(coalesce(job_type, '')) in ('part-time', 'parttime') then 'part_time'
  when lower(coalesce(job_type, '')) = 'contract' then 'contract'
  when lower(coalesce(job_type, '')) = 'temporary' then 'temporary'
  when lower(coalesce(job_type, '')) = 'volunteer' then 'volunteer'
  else 'part_time'
end;

-- Backfill city from location for non-remote jobs.
update public.jobs
set city = case
  when coalesce(city, '') <> '' then city
  when job_mode in ('onsite', 'hybrid') then nullif(trim(location), '')
  else city
end;

-- Keep legacy columns aligned for existing UI consumers.
update public.jobs
set
  part_time = (employment_type = 'part_time'),
  job_type = case employment_type
    when 'full_time' then 'Full-time'
    when 'part_time' then 'Part-time'
    when 'contract' then 'Contract'
    when 'temporary' then 'Temporary'
    when 'volunteer' then 'Volunteer'
    else coalesce(job_type, 'Part-time')
  end,
  location = case
    when job_mode = 'remote' then 'Remote'
    else coalesce(city, location)
  end;

-- Enforce valid values.
alter table public.jobs
  alter column job_mode set not null,
  alter column employment_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_job_mode_check'
  ) then
    alter table public.jobs
      add constraint jobs_job_mode_check
      check (job_mode in ('onsite', 'remote', 'hybrid'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_employment_type_check'
  ) then
    alter table public.jobs
      add constraint jobs_employment_type_check
      check (employment_type in ('full_time', 'part_time', 'contract', 'temporary', 'volunteer'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_city_required_for_local_modes_check'
  ) then
    alter table public.jobs
      add constraint jobs_city_required_for_local_modes_check
      check (
        (job_mode = 'remote')
        or (nullif(trim(coalesce(city, '')), '') is not null)
      );
  end if;
end
$$;
