alter table public.interview_availability_slots enable row level security;
alter table public.interview_slot_requests enable row level security;

drop policy if exists "Users can read interview availability slots" on public.interview_availability_slots;
drop policy if exists "Tutors can insert own interview availability slots" on public.interview_availability_slots;
drop policy if exists "Tutors can update own interview availability slots" on public.interview_availability_slots;
drop policy if exists "Tutors can delete own interview availability slots" on public.interview_availability_slots;

drop policy if exists "Participants can read interview slot requests" on public.interview_slot_requests;
drop policy if exists "Employers can create interview slot requests" on public.interview_slot_requests;
drop policy if exists "Participants can update interview slot requests" on public.interview_slot_requests;

create policy "Users can read interview availability slots"
  on public.interview_availability_slots
  for select
  using (
    tutor_id = auth.uid()
    or exists (
      select 1
      from public.interview_slot_requests request
      where request.availability_slot_id = interview_availability_slots.id
        and (request.tutor_id = auth.uid() or request.requester_school_id = auth.uid())
    )
  );

create policy "Tutors can insert own interview availability slots"
  on public.interview_availability_slots
  for insert
  with check (tutor_id = auth.uid());

create policy "Tutors can update own interview availability slots"
  on public.interview_availability_slots
  for update
  using (tutor_id = auth.uid())
  with check (tutor_id = auth.uid());

create policy "Tutors can delete own interview availability slots"
  on public.interview_availability_slots
  for delete
  using (tutor_id = auth.uid());

create policy "Participants can read interview slot requests"
  on public.interview_slot_requests
  for select
  using (
    tutor_id = auth.uid() or requester_school_id = auth.uid()
  );

create policy "Employers can create interview slot requests"
  on public.interview_slot_requests
  for insert
  with check (
    requester_school_id = auth.uid()
    and exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and lower(coalesce(profile.role, '')) in ('school', 'family', 'ngo')
    )
    and exists (
      select 1
      from public.applications application
      join public.jobs job on job.id = application.job_id
      where application.id = interview_slot_requests.application_id
        and application.applicant_id = interview_slot_requests.tutor_id
        and job.organization_id = auth.uid()
    )
  );

create policy "Participants can update interview slot requests"
  on public.interview_slot_requests
  for update
  using (
    tutor_id = auth.uid() or requester_school_id = auth.uid()
  )
  with check (
    tutor_id = auth.uid() or requester_school_id = auth.uid()
  );
