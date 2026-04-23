create table if not exists public.payment_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_snapshot text,
  method text not null,
  amount numeric(10, 2) not null default 100.00,
  currency text not null default 'ETB',
  status text not null default 'pending',
  tx_ref text,
  checkout_url text,
  proof_url text,
  proof_file_path text,
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_upgrade_requests_method_check
    check (method in ('chappa', 'bank_transfer')),
  constraint payment_upgrade_requests_status_check
    check (status in ('pending', 'paid', 'approved', 'rejected'))
);

create unique index if not exists payment_upgrade_requests_tx_ref_unique
  on public.payment_upgrade_requests(tx_ref)
  where tx_ref is not null;

create index if not exists payment_upgrade_requests_user_id_created_idx
  on public.payment_upgrade_requests(user_id, created_at desc);

create index if not exists payment_upgrade_requests_status_created_idx
  on public.payment_upgrade_requests(status, created_at desc);

alter table public.payment_upgrade_requests enable row level security;

drop policy if exists "Users can insert own upgrade requests" on public.payment_upgrade_requests;
create policy "Users can insert own upgrade requests"
  on public.payment_upgrade_requests
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own upgrade requests" on public.payment_upgrade_requests;
create policy "Users can read own upgrade requests"
  on public.payment_upgrade_requests
  for select
  using (auth.uid() = user_id);
