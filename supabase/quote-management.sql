-- Alanpastt - Gestión avanzada de solicitudes/cotizaciones
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
      and ap.role = 'admin'
  );
$$;

create table if not exists public.cotizaciones_entrantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  mensaje text not null,
  estado text not null default 'Nueva',
  created_at timestamptz not null default now()
);

alter table public.cotizaciones_entrantes
  add column if not exists tracking_code text,
  add column if not exists telefono text,
  add column if not exists empresa text,
  add column if not exists internal_notes text,
  add column if not exists last_response_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.cotizaciones_entrantes
set tracking_code = 'ALP-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6))
where tracking_code is null;

alter table public.cotizaciones_entrantes
  alter column tracking_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cotizaciones_entrantes_tracking_code_key'
  ) then
    alter table public.cotizaciones_entrantes
      add constraint cotizaciones_entrantes_tracking_code_key unique (tracking_code);
  end if;
end $$;

create table if not exists public.quote_attachments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.cotizaciones_entrantes(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_responses (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.cotizaciones_entrantes(id) on delete cascade,
  subject text not null,
  body text not null,
  sent_to text not null,
  sent_by uuid references auth.users(id) on delete set null,
  attachment_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_cotizaciones_tracking_code on public.cotizaciones_entrantes(tracking_code);
create index if not exists idx_cotizaciones_created_at on public.cotizaciones_entrantes(created_at desc);
create index if not exists idx_quote_attachments_quote_id on public.quote_attachments(quote_id);
create index if not exists idx_quote_responses_quote_id on public.quote_responses(quote_id);

alter table public.admin_profiles enable row level security;
alter table public.cotizaciones_entrantes enable row level security;
alter table public.quote_attachments enable row level security;
alter table public.quote_responses enable row level security;

-- Policies admin_profiles
drop policy if exists "Admins can read admin profiles" on public.admin_profiles;
create policy "Admins can read admin profiles"
on public.admin_profiles for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

-- Policies cotizaciones
drop policy if exists "Public can insert quote requests" on public.cotizaciones_entrantes;
create policy "Public can insert quote requests"
on public.cotizaciones_entrantes for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read quote requests" on public.cotizaciones_entrantes;
create policy "Admins can read quote requests"
on public.cotizaciones_entrantes for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update quote requests" on public.cotizaciones_entrantes;
create policy "Admins can update quote requests"
on public.cotizaciones_entrantes for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Policies quote attachments
drop policy if exists "Admins can manage quote attachments" on public.quote_attachments;
create policy "Admins can manage quote attachments"
on public.quote_attachments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Policies quote responses
drop policy if exists "Admins can manage quote responses" on public.quote_responses;
create policy "Admins can manage quote responses"
on public.quote_responses for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage privado para archivos de cotizaciones
insert into storage.buckets (id, name, public)
values ('quote-attachments', 'quote-attachments', false)
on conflict (id) do update set public = false;

drop policy if exists "Admins can manage quote attachment files" on storage.objects;
create policy "Admins can manage quote attachment files"
on storage.objects for all
to authenticated
using (bucket_id = 'quote-attachments' and public.is_admin())
with check (bucket_id = 'quote-attachments' and public.is_admin());

-- Fix estados permitidos para gestión de solicitudes
alter table public.cotizaciones_entrantes
drop constraint if exists cotizaciones_entrantes_estado_check;

alter table public.cotizaciones_entrantes
add constraint cotizaciones_entrantes_estado_check
check (
  estado in (
    'Nueva',
    'En revisión',
    'Cotizando',
    'Respondida',
    'Cerrada'
  )
);
