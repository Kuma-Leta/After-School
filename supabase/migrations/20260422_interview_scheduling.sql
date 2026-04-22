create table if not exists public.interview_availability_slots (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'UTC',
  notes text,
  status text not null default 'open' check (status in ('open', 'booked', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table if not exists public.interview_slot_requests (
  id uuid primary key default gen_random_uuid(),
  availability_slot_id uuid not null references public.interview_availability_slots(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  requester_school_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (availability_slot_id, requester_school_id)
);

create index if not exists idx_interview_availability_slots_tutor_start
  on public.interview_availability_slots (tutor_id, start_at);

create index if not exists idx_interview_availability_slots_status_start
  on public.interview_availability_slots (status, start_at);

create index if not exists idx_interview_slot_requests_tutor_status
  on public.interview_slot_requests (tutor_id, status);

create index if not exists idx_interview_slot_requests_school_status
  on public.interview_slot_requests (requester_school_id, status);

create unique index if not exists idx_interview_slot_requests_active_slot
  on public.interview_slot_requests (availability_slot_id)
  where status in ('pending', 'accepted');
