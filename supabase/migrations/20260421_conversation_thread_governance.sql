-- Conversation governance fields and audit log

alter table if exists public.conversations
  add column if not exists is_governed_thread boolean not null default false,
  add column if not exists thread_state text,
  add column if not exists initiated_by uuid,
  add column if not exists initiated_at timestamptz,
  add column if not exists closed_by uuid,
  add column if not exists closed_at timestamptz;

-- Keep states explicit and constrained
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'conversations_thread_state_check'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_thread_state_check
      CHECK (
        thread_state IS NULL
        OR thread_state IN ('employer_initiated', 'candidate_replied', 'closed')
      );
  END IF;
END $$;

create table if not exists public.conversation_thread_audit (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  actor_id uuid not null,
  action text not null,
  previous_state text,
  new_state text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversation_thread_audit_conversation_id
  on public.conversation_thread_audit (conversation_id);

create index if not exists idx_conversation_thread_audit_created_at
  on public.conversation_thread_audit (created_at desc);

-- Best effort backfill: mark existing employer/candidate one-to-one threads as governed
update public.conversations c
set
  is_governed_thread = true,
  thread_state = coalesce(c.thread_state, 'employer_initiated')
where
  c.is_group = false
  and exists (
    select 1
    from public.conversation_participants cp
    join public.profiles p on p.id = cp.user_id
    where cp.conversation_id = c.id
      and lower(coalesce(p.role, '')) in ('school', 'ngo', 'family')
  )
  and exists (
    select 1
    from public.conversation_participants cp
    join public.profiles p on p.id = cp.user_id
    where cp.conversation_id = c.id
      and lower(coalesce(p.role, '')) in ('teacher', 'student')
  );
