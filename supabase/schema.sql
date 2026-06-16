-- Alanpastt CMS - Schema inicial
-- Ejecutar en Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
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

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  image_url text,
  image_alt text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_settings (
  id int primary key default 1,
  sales_email text not null default 'ventas@alanpastt.cl',
  contact_email text not null default 'contacto@alanpastt.cl',
  whatsapp_number text not null default '56933365549',
  whatsapp_message text not null default 'Hola Alanpastt, me gustaría solicitar una cotización.',
  footer_text text not null default 'Soluciones Industriales - Santiago, Chile.',
  updated_at timestamptz not null default now(),
  constraint contact_settings_singleton check (id = 1)
);

create table if not exists public.cotizaciones_entrantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  empresa text,
  mensaje text not null,
  estado text not null default 'Nueva' check (estado in ('Nueva', 'Contactado', 'Cotizado', 'Cerrado', 'Descartado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_sort_idx on public.products (is_active, sort_order, created_at);
create index if not exists cotizaciones_created_idx on public.cotizaciones_entrantes (created_at desc);

-- Triggers updated_at
drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_settings_updated_at on public.contact_settings;
create trigger set_contact_settings_updated_at
before update on public.contact_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_cotizaciones_updated_at on public.cotizaciones_entrantes;
create trigger set_cotizaciones_updated_at
before update on public.cotizaciones_entrantes
for each row execute function public.set_updated_at();

-- Grants para API Supabase
grant usage on schema public to anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.contact_settings to anon, authenticated;
grant insert on public.cotizaciones_entrantes to anon, authenticated;
grant select, insert, update, delete on public.site_content to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.contact_settings to authenticated;
grant select, update, delete on public.cotizaciones_entrantes to authenticated;
grant select on public.admin_profiles to authenticated;

-- RLS
alter table public.admin_profiles enable row level security;
alter table public.site_content enable row level security;
alter table public.products enable row level security;
alter table public.contact_settings enable row level security;
alter table public.cotizaciones_entrantes enable row level security;

-- Limpieza de policies para que el script sea re-ejecutable.
drop policy if exists "admin_profiles_select_own" on public.admin_profiles;
drop policy if exists "site_content_public_read" on public.site_content;
drop policy if exists "site_content_admin_manage" on public.site_content;
drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_admin_select_all" on public.products;
drop policy if exists "products_admin_manage" on public.products;
drop policy if exists "contact_settings_public_read" on public.contact_settings;
drop policy if exists "contact_settings_admin_manage" on public.contact_settings;
drop policy if exists "cotizaciones_public_insert" on public.cotizaciones_entrantes;
drop policy if exists "cotizaciones_admin_read" on public.cotizaciones_entrantes;
drop policy if exists "cotizaciones_admin_update" on public.cotizaciones_entrantes;
drop policy if exists "cotizaciones_admin_delete" on public.cotizaciones_entrantes;

create policy "admin_profiles_select_own"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "site_content_public_read"
on public.site_content
for select
to anon, authenticated
using (true);

create policy "site_content_admin_manage"
on public.site_content
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "products_public_read_active"
on public.products
for select
to anon, authenticated
using (is_active = true);

create policy "products_admin_select_all"
on public.products
for select
to authenticated
using (public.is_admin());

create policy "products_admin_manage"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "contact_settings_public_read"
on public.contact_settings
for select
to anon, authenticated
using (true);

create policy "contact_settings_admin_manage"
on public.contact_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cotizaciones_public_insert"
on public.cotizaciones_entrantes
for insert
to anon, authenticated
with check (
  length(trim(nombre)) >= 2
  and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  and length(trim(mensaje)) >= 3
);

create policy "cotizaciones_admin_read"
on public.cotizaciones_entrantes
for select
to authenticated
using (public.is_admin());

create policy "cotizaciones_admin_update"
on public.cotizaciones_entrantes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cotizaciones_admin_delete"
on public.cotizaciones_entrantes
for delete
to authenticated
using (public.is_admin());

-- Storage público para visualizar imágenes y privado para escritura admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'alanpastt-assets',
  'alanpastt-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "alanpastt_assets_public_read" on storage.objects;
drop policy if exists "alanpastt_assets_admin_insert" on storage.objects;
drop policy if exists "alanpastt_assets_admin_update" on storage.objects;
drop policy if exists "alanpastt_assets_admin_delete" on storage.objects;

create policy "alanpastt_assets_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'alanpastt-assets');

create policy "alanpastt_assets_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'alanpastt-assets' and public.is_admin());

create policy "alanpastt_assets_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'alanpastt-assets' and public.is_admin())
with check (bucket_id = 'alanpastt-assets' and public.is_admin());

create policy "alanpastt_assets_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'alanpastt-assets' and public.is_admin());

-- Contenido inicial
insert into public.site_content (key, value)
values
  ('hero', '{
    "badge": "Expertos en Soluciones de Caucho",
    "title_html": "Goma para <span class=\"text-alanpastt-amarillo\">Seguridad</span> <br>& Construcción",
    "subtitle": "Proveemos y realizamos trabajos con productos de alta resistencia: Pisos antideslizantes, gradas y correas industriales.",
    "primary_button_text": "Ver Catálogo",
    "secondary_button_text": "Hablar con un Experto"
  }'::jsonb),
  ('products_section', '{
    "title": "Nuestros Productos",
    "subtitle": "Soluciones de caucho industrial"
  }'::jsonb),
  ('contact_section', '{
    "title_html": "Hablemos de tu <br><span class=\"text-alanpastt-amarillo\">Proyecto</span>",
    "subtitle": "Asesoría técnica y soluciones a medida en caucho."
  }'::jsonb),
  ('footer', '{
    "brand": "Alanpastt",
    "developer_label": "Desarrollo Digital",
    "developer_name": "FocusFrame Media SpA.",
    "developer_url": "https://focusframe.cl"
  }'::jsonb)
on conflict (key) do update set value = excluded.value;

insert into public.contact_settings (id, sales_email, contact_email, whatsapp_number, whatsapp_message, footer_text)
values (
  1,
  'ventas@alanpastt.cl',
  'contacto@alanpastt.cl',
  '56933365549',
  'Hola Alanpastt, me gustaría solicitar una cotización.',
  'Soluciones Industriales - Santiago, Chile.'
)
on conflict (id) do update set
  sales_email = excluded.sales_email,
  contact_email = excluded.contact_email,
  whatsapp_number = excluded.whatsapp_number,
  whatsapp_message = excluded.whatsapp_message,
  footer_text = excluded.footer_text;

insert into public.products (slug, title, description, image_url, image_alt, sort_order, is_active)
values
  ('pisos-antideslizantes', 'Pisos Antideslizantes', 'Máxima tracción para rampas y áreas de alto tráfico húmedo o seco.', 'public/images/piso_goma.jpg', 'Pisos de Goma', 1, true),
  ('gradas-goma-escaleras', 'Gradas de Goma para Escaleras formato 1.20 y 1.50 Negras, Bicolor (negro/amarillo)', 'Para otros formatos solicita cotización.', 'public/images/gradas.jpg', 'Gradas de Goma', 2, true),
  ('correas-transmision', 'Correas de Transmisión', 'Alta fricción y resistencia para maquinaria pesada y cortadoras de pavimento.', 'public/images/correas.jpeg', 'Correas Industriales', 3, true)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
