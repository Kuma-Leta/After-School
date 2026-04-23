create table if not exists public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_visibility text not null default 'public',
  message_permission text not null default 'everyone',
  show_email boolean not null default false,
  show_phone boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privacy_settings_profile_visibility_check
    check (profile_visibility in ('public', 'connections', 'private')),
  constraint privacy_settings_message_permission_check
    check (message_permission in ('everyone', 'connections', 'none'))
);

alter table public.privacy_settings enable row level security;

drop policy if exists "Users can read own privacy settings" on public.privacy_settings;
create policy "Users can read own privacy settings"
  on public.privacy_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own privacy settings" on public.privacy_settings;
create policy "Users can insert own privacy settings"
  on public.privacy_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own privacy settings" on public.privacy_settings;
create policy "Users can update own privacy settings"
  on public.privacy_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
