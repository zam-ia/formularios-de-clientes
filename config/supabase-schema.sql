-- Radiografía de Marca / Crisdal Agency
-- Initial schema v1.0

create extension if not exists pgcrypto;

create table if not exists public.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid unique not null,
  submission_code text unique not null,
  form_version text not null default '1.0',
  status text not null default 'pending'
    check (status in ('pending','submitted','reviewed','archived')),

  service_types jsonb not null default '[]'::jsonb,

  business_name text,
  sector text,
  location text,
  business_age text,
  social_links text,

  brand_words jsonb not null default '[]'::jsonb,
  brand_assets_status text,
  brand_colors_text text,
  brand_tone text,
  brand_avoid text,

  primary_goal text,
  four_week_result text,
  primary_cta text,

  ideal_customer text,
  customer_problem text,
  customer_channels jsonb not null default '[]'::jsonb,
  main_objection text,

  star_offer text,
  average_price text,
  differentiator text,
  current_promo text,
  competitors text,
  competitor_notes text,

  marketing_invested boolean,
  marketing_history text,
  ad_budget text,
  own_materials text,
  materials_link text,

  deadline_type text,
  deadline_date date,
  key_date text,

  contact_name text,
  contact_whatsapp text,
  contact_email text,
  best_contact_time text,

  consent boolean not null default false,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_path text,

  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  email_status text default 'not_sent'
    check (email_status in ('not_sent','sent','failed')),
  email_error_code text
);

create index if not exists onboarding_created_at_idx
  on public.onboarding_submissions (created_at desc);

create index if not exists onboarding_status_idx
  on public.onboarding_submissions (status);

create index if not exists onboarding_phone_idx
  on public.onboarding_submissions (contact_whatsapp);

create table if not exists public.onboarding_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.onboarding_submissions(id) on delete cascade,
  category text not null check (category in ('brand_assets','materials')),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists onboarding_files_submission_idx
  on public.onboarding_files (submission_id);

-- Security: public clients should not read these tables.
alter table public.onboarding_submissions enable row level security;
alter table public.onboarding_files enable row level security;

-- Intentionally no anon SELECT/INSERT policies.
-- Recommended architecture writes through server-side routes with service-role.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

-- Optional updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_onboarding_updated_at on public.onboarding_submissions;
create trigger trg_onboarding_updated_at
before update on public.onboarding_submissions
for each row execute function public.set_updated_at();

-- Private Storage bucket used by signed upload URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-intake-files',
  'brand-intake-files',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
-- For a multi-file submission, validate total size in application code.
