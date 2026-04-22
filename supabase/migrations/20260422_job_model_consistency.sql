-- Job model consistency hardening: align part_time and employment_type.

-- Backfill existing inconsistent records before adding constraint.
update public.jobs
set part_time = (employment_type = 'part_time')
where coalesce(part_time, false) <> (employment_type = 'part_time');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_part_time_matches_employment_type_check'
  ) then
    alter table public.jobs
      add constraint jobs_part_time_matches_employment_type_check
      check (coalesce(part_time, false) = (employment_type = 'part_time'));
  end if;
end
$$;
