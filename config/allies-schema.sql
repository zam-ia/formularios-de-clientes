-- Crisdal / Red de Aliados — Module A v1
create extension if not exists pgcrypto;

create table if not exists public.allies (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('DNI','RUC')),
  document_number text not null unique,
  business_name text not null,
  category text not null,
  description text not null default '',
  contact_name text not null,
  contact_whatsapp text not null,
  contact_email text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending','approved','suspended','rejected')),
  visible boolean not null default false,
  password_hash text not null,
  must_change_password boolean not null default true,
  last_login_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint allies_document_format check (
    (document_type = 'DNI' and document_number ~ '^\d{8}$') or
    (document_type = 'RUC' and document_number ~ '^\d{11}$')
  )
);

create index if not exists allies_status_idx on public.allies(status);
create index if not exists allies_category_idx on public.allies(category);
create index if not exists allies_directory_idx on public.allies(status, visible);

create table if not exists public.ally_contact_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.allies(id) on delete cascade,
  recipient_id uuid not null references public.allies(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending','notified','contacted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ally_contact_not_self check (sender_id <> recipient_id)
);

create index if not exists ally_contact_sender_idx on public.ally_contact_requests(sender_id, created_at desc);
create index if not exists ally_contact_recipient_idx on public.ally_contact_requests(recipient_id, created_at desc);

alter table public.allies enable row level security;
alter table public.ally_contact_requests enable row level security;
-- No anon policies. All reads/writes go through authenticated server routes using service role.

drop trigger if exists trg_allies_updated_at on public.allies;
create trigger trg_allies_updated_at before update on public.allies
for each row execute function public.set_updated_at();

drop trigger if exists trg_ally_contact_updated_at on public.ally_contact_requests;
create trigger trg_ally_contact_updated_at before update on public.ally_contact_requests
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crisdal-allies-data', 'crisdal-allies-data', false, 6291456,
  array['application/json','image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit,
allowed_mime_types=excluded.allowed_mime_types;
