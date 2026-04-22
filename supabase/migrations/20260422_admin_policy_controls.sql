create table if not exists public.admin_policy_controls (
  id integer primary key,
  allow_cross_city_browsing boolean not null default false,
  allow_candidate_initiated_employer_messages boolean not null default false,
  subscription_required_for_employer_contact boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.admin_policy_controls (
  id,
  allow_cross_city_browsing,
  allow_candidate_initiated_employer_messages,
  subscription_required_for_employer_contact
)
values (1, false, false, true)
on conflict (id) do nothing;
