alter table if exists public.organizations
  add column if not exists legal_name text,
  add column if not exists registration_number text,
  add column if not exists tax_id text,
  add column if not exists official_email text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists authorized_representative_name text,
  add column if not exists authorized_representative_role text,
  add column if not exists verification_status text not null default 'verified',
  add column if not exists verification_rejection_reason text,
  add column if not exists documents_submitted_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.organizations
  drop constraint if exists organizations_verification_status_check;

alter table if exists public.organizations
  add constraint organizations_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

create unique index if not exists idx_organizations_registration_number_unique
  on public.organizations (registration_number)
  where registration_number is not null and registration_number <> '';

create index if not exists idx_organizations_verification_status
  on public.organizations (verification_status);

-- Keep existing organizations functional while tightening checks for new school/ngo signups.
update public.organizations
set verification_status = 'verified'
where coalesce(verification_status, '') = '';
