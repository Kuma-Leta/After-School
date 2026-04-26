create table if not exists public.organization_verification_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  original_file_name text,
  content_type text,
  file_size bigint,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_verification_documents_type_check
    check (document_type in ('license', 'certificate', 'authorization_letter', 'other')),
  constraint org_verification_documents_file_size_check
    check (file_size is null or file_size >= 0)
);

create unique index if not exists idx_org_verification_documents_storage_unique
  on public.organization_verification_documents (storage_bucket, storage_path);

create index if not exists idx_org_verification_documents_org
  on public.organization_verification_documents (organization_id, created_at desc);

alter table public.organization_verification_documents enable row level security;

drop policy if exists "Organizations can read own verification docs" on public.organization_verification_documents;
create policy "Organizations can read own verification docs"
  on public.organization_verification_documents
  for select
  using (organization_id = auth.uid());

drop policy if exists "Organizations can insert own verification docs" on public.organization_verification_documents;
create policy "Organizations can insert own verification docs"
  on public.organization_verification_documents
  for insert
  with check (organization_id = auth.uid() and uploaded_by = auth.uid());

drop policy if exists "Admins can read verification docs" on public.organization_verification_documents;
create policy "Admins can read verification docs"
  on public.organization_verification_documents
  for select
  using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and lower(coalesce(profile.role, '')) = 'admin'
    )
  );

drop policy if exists "Admins can update verification docs" on public.organization_verification_documents;
create policy "Admins can update verification docs"
  on public.organization_verification_documents
  for update
  using (
    exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and lower(coalesce(profile.role, '')) = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles profile
      where profile.id = auth.uid()
        and lower(coalesce(profile.role, '')) = 'admin'
    )
  );
