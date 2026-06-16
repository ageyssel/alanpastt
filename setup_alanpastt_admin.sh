#!/usr/bin/env bash
set -euo pipefail

# Ejecutar desde la raíz del proyecto alanpastt.
if [[ ! -f "index.html" || ! -d "src/js" ]]; then
  echo "Error: ejecuta este script desde la raíz del proyecto alanpastt, donde existe index.html y src/js."
  exit 1
fi

echo "Creando estructura de portal administrativo..."
mkdir -p admin/assets supabase src/js src/css

# Respaldos simples antes de reemplazar archivos principales.
cp index.html "index.backup.$(date +%Y%m%d%H%M%S).html"
if [[ -f src/js/main.js ]]; then
  cp src/js/main.js "src/js/main.backup.$(date +%Y%m%d%H%M%S).js"
fi

# Extrae las credenciales públicas actuales desde src/js/main.js sin imprimirlas en pantalla.
SUPABASE_URL=$(grep -E "const supabaseUrl\s*=" src/js/main.js | head -n 1 | sed -E "s/.*'([^']+)'.*/\1/" || true)
SUPABASE_KEY=$(grep -E "const supabaseKey\s*=" src/js/main.js | head -n 1 | sed -E "s/.*'([^']+)'.*/\1/" || true)

if [[ -z "${SUPABASE_URL}" || -z "${SUPABASE_KEY}" ]]; then
  echo "No pude extraer Supabase URL/Anon Key desde src/js/main.js."
  echo "Edita manualmente src/js/config.js después de ejecutar el script."
fi

cat > src/js/config.js <<EOF
window.ALANPASTT_CONFIG = {
  supabaseUrl: '${SUPABASE_URL}',
  supabaseAnonKey: '${SUPABASE_KEY}',
  storageBucket: 'alanpastt-assets'
};
EOF

cat > supabase/schema.sql <<'SQL'
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
SQL

cat > src/js/main.js <<'JS'
(function () {
  'use strict';

  function getSupabaseClient() {
    if (window.alanpasttSupabase) return window.alanpasttSupabase;

    const config = window.ALANPASTT_CONFIG || {};
    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('Falta configuración de Supabase. Revisa src/js/config.js');
      return null;
    }

    window.alanpasttSupabase = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    return window.alanpasttSupabase;
  }

  function showMessage(element, message) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('hidden');
  }

  function hideMessage(element) {
    if (!element) return;
    element.classList.add('hidden');
  }

  function createStatusMessage(id, className, text, form) {
    let element = document.getElementById(id);
    if (!element && form) {
      element = document.createElement('div');
      element.id = id;
      element.className = className;
      element.textContent = text;
      form.parentNode.appendChild(element);
    }
    return element;
  }

  function initHeaderShrink() {
    const header = document.getElementById('main-header');
    const logo = document.getElementById('header-logo');
    if (!header || !logo) return;

    const updateHeader = () => {
      if (window.scrollY > 50) {
        header.style.height = '96px';
        logo.style.height = '80px';
        header.classList.add('shadow-2xl');
      } else {
        header.style.height = '192px';
        logo.style.height = '160px';
        header.classList.remove('shadow-2xl');
      }
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  function initQuoteForm() {
    const supabaseClient = getSupabaseClient();
    const form = document.getElementById('form-cotizacion');
    const btnEnviar = document.getElementById('btn-enviar');

    if (!form || !btnEnviar || !supabaseClient) return;

    const msjExito = createStatusMessage(
      'mensaje-exito',
      'hidden mt-6 bg-green-600 text-white font-black p-4 rounded text-center',
      'Solicitud enviada con éxito. Te contactaremos pronto.',
      form
    );

    const msjError = createStatusMessage(
      'mensaje-error',
      'hidden mt-6 bg-red-600 text-white font-black p-4 rounded text-center',
      'Hubo un error al enviar. Intenta nuevamente.',
      form
    );

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      hideMessage(msjExito);
      hideMessage(msjError);

      const formData = {
        nombre: document.getElementById('nombre')?.value?.trim(),
        email: document.getElementById('email')?.value?.trim(),
        telefono: document.getElementById('telefono')?.value?.trim() || null,
        empresa: document.getElementById('empresa')?.value?.trim() || null,
        mensaje: document.getElementById('mensaje')?.value?.trim(),
        estado: 'Nueva'
      };

      if (!formData.nombre || !formData.email || !formData.mensaje) {
        showMessage(msjError, 'Completa nombre, email y mensaje antes de enviar.');
        return;
      }

      const originalText = btnEnviar.textContent;
      btnEnviar.textContent = 'Enviando...';
      btnEnviar.disabled = true;
      btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');

      try {
        const { error } = await supabaseClient
          .from('cotizaciones_entrantes')
          .insert([formData]);

        if (error) throw error;

        form.reset();
        showMessage(msjExito, 'Solicitud enviada con éxito. Te contactaremos pronto.');
      } catch (error) {
        console.error('Error al enviar cotización:', error);
        showMessage(msjError, 'No se pudo enviar la solicitud. Intenta nuevamente o escríbenos por WhatsApp.');
      } finally {
        btnEnviar.textContent = originalText;
        btnEnviar.disabled = false;
        btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderShrink();
    initQuoteForm();
  });
})();
JS

cat > src/js/public-content.js <<'JS'
(function () {
  'use strict';

  function getSupabaseClient() {
    if (window.alanpasttSupabase) return window.alanpasttSupabase;

    const config = window.ALANPASTT_CONFIG || {};
    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('Falta configuración de Supabase. Revisa src/js/config.js');
      return null;
    }

    window.alanpasttSupabase = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    return window.alanpasttSupabase;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) element.textContent = value;
  }

  function setHTML(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) element.innerHTML = value;
  }

  function setHref(id, value) {
    const element = document.getElementById(id);
    if (element && value) element.href = value;
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildWhatsAppUrl(number, message) {
    const cleanNumber = String(number || '').replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message || 'Hola Alanpastt, me gustaría solicitar una cotización.');
    return cleanNumber ? `https://wa.me/${cleanNumber}?text=${encodedMessage}` : '#contacto';
  }

  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid || !Array.isArray(products) || products.length === 0) return;

    grid.innerHTML = products.map((product) => `
      <article class="group cursor-pointer">
        <div class="relative overflow-hidden rounded-lg h-80 mb-6 shadow-xl border-b-8 border-alanpastt-amarillo bg-slate-100">
          <img
            src="${escapeHTML(product.image_url || 'public/images/logo.png')}"
            alt="${escapeHTML(product.image_alt || product.title)}"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          >
        </div>
        <h3 class="text-2xl font-black uppercase text-alanpastt-negro">${escapeHTML(product.title)}</h3>
        <p class="text-slate-600 mt-2 mb-4">${escapeHTML(product.description)}</p>
      </article>
    `).join('');
  }

  async function loadPublicContent() {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    try {
      const [contentResult, productsResult, contactResult] = await Promise.all([
        supabaseClient.from('site_content').select('key,value'),
        supabaseClient.from('products').select('title,description,image_url,image_alt,sort_order').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabaseClient.from('contact_settings').select('*').eq('id', 1).single()
      ]);

      if (contentResult.error) throw contentResult.error;
      if (productsResult.error) throw productsResult.error;
      if (contactResult.error) throw contactResult.error;

      const content = Object.fromEntries((contentResult.data || []).map((row) => [row.key, row.value || {}]));
      const hero = content.hero || {};
      const productsSection = content.products_section || {};
      const contactSection = content.contact_section || {};
      const footer = content.footer || {};
      const contact = contactResult.data || {};

      document.title = 'Alanpastt | Soluciones de Goma para Seguridad y Construcción';

      setText('hero-badge', hero.badge);
      setHTML('hero-title', hero.title_html);
      setText('hero-subtitle', hero.subtitle);
      setText('btn-catalog', hero.primary_button_text);
      setText('btn-expert', hero.secondary_button_text);

      setText('products-title', productsSection.title);
      setText('products-subtitle', productsSection.subtitle);
      setHTML('contact-title', contactSection.title_html);
      setText('contact-subtitle', contactSection.subtitle);

      renderProducts(productsResult.data || []);

      const whatsappUrl = buildWhatsAppUrl(contact.whatsapp_number, contact.whatsapp_message);
      const salesEmailHref = contact.sales_email ? `mailto:${contact.sales_email}` : '#contacto';
      const contactEmailHref = contact.contact_email ? `mailto:${contact.contact_email}` : '#contacto';

      setText('sales-email-header', contact.sales_email);
      setHref('sales-email-header', salesEmailHref);
      setText('sales-email-contact', contact.sales_email);
      setHref('sales-email-contact', salesEmailHref);
      setText('contact-email', contact.contact_email);
      setHref('contact-email', contactEmailHref);
      setText('contact-whatsapp', contact.whatsapp_number ? `+${contact.whatsapp_number}` : 'WhatsApp');
      setHref('contact-whatsapp', whatsappUrl);
      setHref('hero-whatsapp', whatsappUrl);
      setHref('floating-whatsapp', whatsappUrl);

      setText('footer-year-brand', `© ${new Date().getFullYear()} ${footer.brand || 'Alanpastt'}`);
      setText('footer-text', contact.footer_text);
      setText('developer-label', footer.developer_label);
      setText('developer-name', footer.developer_name);
      setHref('developer-link', footer.developer_url);
    } catch (error) {
      console.error('No se pudo cargar contenido dinámico. Se mantiene contenido de respaldo.', error);
    }
  }

  document.addEventListener('DOMContentLoaded', loadPublicContent);
})();
JS

cat > index.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alanpastt | Soluciones de Goma para Seguridad y Construcción</title>
  <meta name="description" content="Soluciones industriales en caucho para seguridad y construcción: pisos antideslizantes, gradas de goma y correas de transmisión.">

  <link rel="shortcut icon" href="public/images/logo.png" type="image/x-icon">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="src/js/config.js"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            alanpastt: {
              amarillo: '#FACC15',
              negro: '#000000',
              gris: '#1F2937',
              acento: '#EAB308'
            }
          }
        }
      }
    };
  </script>

  <style>
    html { scroll-behavior: smooth; }
    .bg-industrial {
      background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1589939705384-5185138a04b9?q=80&w=2070&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
    }
    .float-wa { animation: pulse 2s infinite; }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    .footer-logo-glow { filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.45)); }
  </style>
</head>
<body class="font-sans text-slate-800 bg-slate-50 antialiased">
  <header id="main-header" class="fixed w-full top-0 z-50 bg-white shadow-xl h-48 border-b-4 border-alanpastt-amarillo transition-all duration-500 ease-in-out">
    <div class="container mx-auto px-4 h-full flex justify-between items-center">
      <a href="#inicio" class="flex items-center h-full py-2">
        <img id="header-logo" src="public/images/logo.png" alt="Alanpastt Logo" class="h-40 w-auto object-contain object-left transition-all duration-500 ease-in-out">
      </a>

      <nav class="hidden lg:flex space-x-10 font-black uppercase tracking-tighter text-alanpastt-negro">
        <a href="#inicio" class="hover:text-alanpastt-acento transition-colors">Inicio</a>
        <a href="#productos" class="hover:text-alanpastt-acento transition-colors">Productos</a>
        <a href="#contacto" class="hover:text-alanpastt-acento transition-colors">Contacto</a>
      </nav>

      <div class="hidden md:flex items-center space-x-4">
        <a id="sales-email-header" href="mailto:ventas@alanpastt.cl" class="text-sm font-bold text-alanpastt-negro hidden xl:block hover:text-alanpastt-acento">ventas@alanpastt.cl</a>
        <a href="#contacto" class="bg-alanpastt-negro text-alanpastt-amarillo px-6 py-3 rounded font-black hover:bg-alanpastt-amarillo hover:text-alanpastt-negro transition-all shadow-lg uppercase tracking-wide">
          Cotizar Ahora
        </a>
      </div>
    </div>
  </header>

  <section id="inicio" class="relative min-h-screen flex items-center justify-center text-white bg-industrial pt-48">
    <div class="container mx-auto px-4 relative z-10 text-center">
      <div id="hero-badge" class="inline-block bg-alanpastt-amarillo text-alanpastt-negro px-4 py-1 mb-6 font-black uppercase tracking-widest text-sm">
        Expertos en Soluciones de Caucho
      </div>
      <h1 id="hero-title" class="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter leading-none">
        Goma para <span class="text-alanpastt-amarillo">Seguridad</span> <br>& Construcción
      </h1>
      <p id="hero-subtitle" class="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light">
        Proveemos y realizamos trabajos con productos de alta resistencia: Pisos antideslizantes, gradas y correas industriales.
      </p>
      <div class="flex flex-col md:flex-row justify-center gap-4">
        <a id="btn-catalog" href="#productos" class="bg-alanpastt-amarillo text-alanpastt-negro px-10 py-4 rounded font-black text-xl hover:bg-white transition-all shadow-2xl uppercase">
          Ver Catálogo
        </a>
        <a id="hero-whatsapp" href="https://wa.me/56933365549?text=Hola%20Alanpastt,%20necesito%20información%20sobre%20sus%20productos%20y%20servicios." target="_blank" rel="noopener" class="bg-transparent border-2 border-white px-10 py-4 rounded font-black text-xl hover:bg-white hover:text-alanpastt-negro transition-all uppercase">
          <span id="btn-expert">Hablar con un Experto</span>
        </a>
      </div>
    </div>
  </section>

  <section id="productos" class="scroll-mt-32 py-24 bg-white">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4 border-l-8 border-alanpastt-amarillo pl-6">
        <div>
          <h2 id="products-title" class="text-5xl font-black text-alanpastt-negro uppercase tracking-tighter">Nuestros Productos</h2>
          <p id="products-subtitle" class="text-slate-500 font-bold max-w-md mt-2 uppercase text-sm tracking-widest">Soluciones de caucho industrial</p>
        </div>
      </div>

      <div id="products-grid" class="grid grid-cols-1 md:grid-cols-3 gap-10">
        <article class="group cursor-pointer">
          <div class="relative overflow-hidden rounded-lg h-80 mb-6 shadow-xl border-b-8 border-alanpastt-amarillo">
            <img src="public/images/piso_goma.jpg" alt="Pisos de Goma" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          </div>
          <h3 class="text-2xl font-black uppercase text-alanpastt-negro">Pisos Antideslizantes</h3>
          <p class="text-slate-600 mt-2 mb-4">Máxima tracción para rampas y áreas de alto tráfico húmedo o seco.</p>
        </article>
        <article class="group cursor-pointer">
          <div class="relative overflow-hidden rounded-lg h-80 mb-6 shadow-xl border-b-8 border-alanpastt-amarillo">
            <img src="public/images/gradas.jpg" alt="Gradas de Goma" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          </div>
          <h3 class="text-2xl font-black uppercase text-alanpastt-negro">Gradas de Goma para Escaleras formato 1.20 y 1.50 Negras, Bicolor (negro/amarillo)</h3>
          <p class="text-slate-600 mt-2 mb-4">Para otros formatos solicita cotización.</p>
        </article>
        <article class="group cursor-pointer">
          <div class="relative overflow-hidden rounded-lg h-80 mb-6 shadow-xl border-b-8 border-alanpastt-amarillo">
            <img src="public/images/correas.jpeg" alt="Correas Industriales" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
          </div>
          <h3 class="text-2xl font-black uppercase text-alanpastt-negro">Correas de Transmisión</h3>
          <p class="text-slate-600 mt-2 mb-4">Alta fricción y resistencia para maquinaria pesada y cortadoras de pavimento.</p>
        </article>
      </div>
    </div>
  </section>

  <section id="contacto" class="scroll-mt-32 py-24 bg-alanpastt-negro text-white">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 id="contact-title" class="text-5xl font-black uppercase tracking-tighter mb-8">Hablemos de tu <br><span class="text-alanpastt-amarillo">Proyecto</span></h2>
          <p id="contact-subtitle" class="text-xl text-gray-400 mb-12">Asesoría técnica y soluciones a medida en caucho.</p>

          <div class="space-y-8">
            <div class="flex items-start space-x-4">
              <div class="bg-alanpastt-amarillo p-3 rounded">
                <svg class="w-6 h-6 text-alanpastt-negro" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <h4 class="font-black uppercase text-alanpastt-amarillo">Ventas</h4>
                <a id="sales-email-contact" href="mailto:ventas@alanpastt.cl" class="text-xl hover:text-alanpastt-amarillo transition-colors block">ventas@alanpastt.cl</a>
                <a id="contact-whatsapp" href="https://wa.me/56933365549" target="_blank" rel="noopener" class="text-lg text-gray-300 hover:text-[#25D366] transition-colors mt-1 inline-flex items-center">
                  +56 9 3336 5549
                </a>
              </div>
            </div>

            <div class="flex items-start space-x-4">
              <div class="bg-alanpastt-amarillo p-3 rounded">
                <svg class="w-6 h-6 text-alanpastt-negro" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h4 class="font-black uppercase text-alanpastt-amarillo">Contacto</h4>
                <a id="contact-email" href="mailto:contacto@alanpastt.cl" class="text-xl hover:text-alanpastt-amarillo transition-colors">contacto@alanpastt.cl</a>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-8 md:p-12 rounded-xl text-alanpastt-negro">
          <form id="form-cotizacion" class="space-y-6">
            <div>
              <label for="nombre" class="block font-black uppercase text-xs mb-2">Nombre o Empresa</label>
              <input type="text" id="nombre" required class="w-full px-4 py-4 bg-slate-100 border-none rounded focus:ring-4 focus:ring-alanpastt-amarillo transition-all font-bold">
            </div>
            <div>
              <label for="email" class="block font-black uppercase text-xs mb-2">Email</label>
              <input type="email" id="email" required class="w-full px-4 py-4 bg-slate-100 border-none rounded focus:ring-4 focus:ring-alanpastt-amarillo transition-all font-bold">
            </div>
            <div>
              <label for="telefono" class="block font-black uppercase text-xs mb-2">Teléfono / WhatsApp</label>
              <input type="tel" id="telefono" class="w-full px-4 py-4 bg-slate-100 border-none rounded focus:ring-4 focus:ring-alanpastt-amarillo transition-all font-bold">
            </div>
            <div>
              <label for="empresa" class="block font-black uppercase text-xs mb-2">Empresa</label>
              <input type="text" id="empresa" class="w-full px-4 py-4 bg-slate-100 border-none rounded focus:ring-4 focus:ring-alanpastt-amarillo transition-all font-bold">
            </div>
            <div>
              <label for="mensaje" class="block font-black uppercase text-xs mb-2">Mensaje</label>
              <textarea id="mensaje" rows="4" required class="w-full px-4 py-4 bg-slate-100 border-none rounded focus:ring-4 focus:ring-alanpastt-amarillo transition-all font-bold resize-none"></textarea>
            </div>
            <button type="submit" id="btn-enviar" class="w-full bg-alanpastt-negro text-alanpastt-amarillo font-black py-5 rounded-lg hover:bg-alanpastt-amarillo hover:text-alanpastt-negro transition-all uppercase tracking-widest text-lg">
              Enviar Solicitud
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <footer class="bg-alanpastt-negro text-gray-400 py-20 border-t border-gray-900">
    <div class="container mx-auto px-4 flex flex-col items-center text-center">
      <div class="mb-14">
        <img src="public/images/logo.png" alt="Alanpastt Footer" class="h-48 md:h-64 object-contain footer-logo-glow transition-transform duration-500 hover:scale-105">
      </div>
      <p id="footer-year-brand" class="font-bold text-lg mb-1 text-white uppercase tracking-widest italic">&copy; 2026 Alanpastt</p>
      <p id="footer-text" class="text-sm mb-12">Soluciones Industriales - Santiago, Chile.</p>
      <div class="border-t border-gray-800 pt-8 w-full max-w-sm">
        <p id="developer-label" class="mb-2 uppercase tracking-widest text-[10px] text-gray-600">Desarrollo Digital</p>
        <a id="developer-link" href="https://focusframe.cl" target="_blank" rel="noopener" class="text-alanpastt-amarillo font-bold text-sm hover:text-white transition-colors tracking-tighter">
          <span id="developer-name">FocusFrame Media SpA.</span>
        </a>
      </div>
    </div>
  </footer>

  <a id="floating-whatsapp" href="https://wa.me/56933365549?text=Hola%20Alanpastt,%20me%20gustaría%20solicitar%20una%20cotización." target="_blank" rel="noopener" class="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-4 rounded-full shadow-2xl float-wa hover:scale-110 transition-transform" aria-label="Contactar por WhatsApp">
    <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.893-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.891-11.893 11.891-2.01 0-3.991-.511-5.758-1.483l-6.235 1.635zm5.136-4.524l.368.219c1.503.893 3.238 1.364 5.025 1.364 5.398 0 9.791-4.394 9.791-9.793 0-2.617-1.02-5.078-2.871-6.93s-4.313-2.871-6.931-2.871c-5.396 0-9.791 4.394-9.791 9.793 0 1.831.509 3.618 1.472 5.18l.24.388-1.047 3.824 3.921-1.027zm10.771-6.611c-.305-.152-1.805-.891-2.085-.993-.28-.103-.485-.152-.69.152-.204.304-.791.993-.969 1.196-.178.203-.356.229-.661.077-.305-.152-1.287-.474-2.451-1.512-.906-.808-1.517-1.806-1.695-2.11-.178-.304-.019-.468.133-.62.137-.136.305-.355.457-.533.153-.178.203-.304.305-.507.102-.203.051-.381-.026-.533-.076-.152-.69-1.66-.945-2.27-.248-.594-.5-.513-.69-.523-.178-.008-.382-.01-.585-.01-.203 0-.534.076-.814.381-.28.305-1.069 1.04-1.069 2.539 0 1.498 1.092 2.943 1.245 3.146.152.203 2.15 3.284 5.21 4.605.727.314 1.293.501 1.735.642.73.232 1.393.199 1.918.121.585-.087 1.805-.737 2.06-1.448.254-.71.254-1.319.178-1.448-.076-.129-.28-.203-.585-.355z"/></svg>
  </a>

  <script src="src/js/public-content.js"></script>
  <script src="src/js/main.js"></script>
</body>
</html>
HTML

cat > admin/assets/admin.css <<'CSS'
body { min-height: 100vh; }
.admin-card { border: 1px solid rgb(226 232 240); box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
CSS

cat > admin/assets/admin.js <<'JS'
(function () {
  'use strict';

  const config = window.ALANPASTT_CONFIG || {};
  const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const bucket = config.storageBucket || 'alanpastt-assets';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function setStatus(message, type = 'info') {
    const el = $('#status');
    if (!el) return;
    const styles = {
      info: 'bg-slate-100 text-slate-700 border-slate-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      error: 'bg-red-50 text-red-700 border-red-200'
    };
    el.className = `border rounded-lg px-4 py-3 text-sm font-bold ${styles[type] || styles.info}`;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `producto-${Date.now()}`;
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function getSessionOrRedirect() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
      window.location.href = 'login.html';
      return null;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('admin_profiles')
      .select('role')
      .eq('user_id', data.session.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'admin') {
      await supabaseClient.auth.signOut();
      window.location.href = 'login.html';
      return null;
    }

    return data.session;
  }

  async function initLogin() {
    const form = $('#login-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Validando acceso...', 'info');

      const email = $('#email').value.trim();
      const password = $('#password').value;

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setStatus('Credenciales inválidas o usuario no autorizado.', 'error');
        return;
      }

      const { data: profile } = await supabaseClient
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'admin') {
        await supabaseClient.auth.signOut();
        setStatus('Este usuario existe, pero no tiene permiso de administrador.', 'error');
        return;
      }

      window.location.href = 'dashboard.html';
    });
  }

  async function initProtectedPage() {
    if (!$('[data-admin-page]')) return;
    const session = await getSessionOrRedirect();
    if (!session) return;

    const userEmail = $('#user-email');
    if (userEmail) userEmail.textContent = session.user.email;

    $$('#logout-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
      });
    });
  }

  async function uploadProductImage(file) {
    if (!file) return null;
    const extension = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function loadProducts() {
    const list = $('#products-list');
    if (!list) return;

    list.innerHTML = '<p class="text-slate-500 font-bold">Cargando productos...</p>';

    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      list.innerHTML = '<p class="text-red-600 font-bold">No se pudieron cargar los productos.</p>';
      return;
    }

    if (!data.length) {
      list.innerHTML = '<p class="text-slate-500 font-bold">No hay productos registrados.</p>';
      return;
    }

    list.innerHTML = data.map((product) => `
      <div class="admin-card bg-white rounded-xl p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div class="flex gap-4">
          <img src="${escapeHTML(product.image_url || '../public/images/logo.png')}" alt="${escapeHTML(product.image_alt || product.title)}" class="w-24 h-24 rounded-lg object-cover bg-slate-100">
          <div>
            <p class="text-xs font-black uppercase ${product.is_active ? 'text-green-600' : 'text-slate-400'}">${product.is_active ? 'Activo' : 'Oculto'} · Orden ${product.sort_order}</p>
            <h3 class="text-xl font-black text-slate-900">${escapeHTML(product.title)}</h3>
            <p class="text-slate-500 text-sm mt-1">${escapeHTML(product.description)}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="edit-product bg-slate-900 text-yellow-300 px-4 py-2 rounded-lg font-black" data-id="${product.id}">Editar</button>
          <button class="delete-product bg-red-600 text-white px-4 py-2 rounded-lg font-black" data-id="${product.id}">Eliminar</button>
        </div>
      </div>
    `).join('');

    $$('.edit-product').forEach((button) => {
      button.addEventListener('click', () => {
        const product = data.find((item) => item.id === button.dataset.id);
        if (!product) return;
        $('#product-id').value = product.id;
        $('#title').value = product.title || '';
        $('#description').value = product.description || '';
        $('#image-url').value = product.image_url || '';
        $('#image-alt').value = product.image_alt || '';
        $('#sort-order').value = product.sort_order || 0;
        $('#is-active').checked = !!product.is_active;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    $$('.delete-product').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
        const { error: deleteError } = await supabaseClient.from('products').delete().eq('id', button.dataset.id);
        if (deleteError) {
          setStatus('No se pudo eliminar el producto.', 'error');
          return;
        }
        setStatus('Producto eliminado correctamente.', 'success');
        await loadProducts();
      });
    });
  }

  async function initProductsPage() {
    const form = $('#product-form');
    if (!form) return;
    await getSessionOrRedirect();
    await loadProducts();

    $('#clear-form').addEventListener('click', () => {
      form.reset();
      $('#product-id').value = '';
      $('#sort-order').value = '0';
      $('#is-active').checked = true;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Guardando producto...', 'info');

      const id = $('#product-id').value || null;
      const file = $('#image-file').files[0];
      let imageUrl = $('#image-url').value.trim();

      try {
        const uploadedUrl = await uploadProductImage(file);
        if (uploadedUrl) imageUrl = uploadedUrl;

        const payload = {
          title: $('#title').value.trim(),
          description: $('#description').value.trim(),
          image_url: imageUrl || null,
          image_alt: $('#image-alt').value.trim() || $('#title').value.trim(),
          sort_order: Number($('#sort-order').value || 0),
          is_active: $('#is-active').checked
        };

        if (!payload.title || !payload.description) {
          setStatus('Título y descripción son obligatorios.', 'error');
          return;
        }

        let result;
        if (id) {
          result = await supabaseClient.from('products').update(payload).eq('id', id);
        } else {
          payload.slug = `${slugify(payload.title)}-${Date.now()}`;
          result = await supabaseClient.from('products').insert([payload]);
        }

        if (result.error) throw result.error;

        form.reset();
        $('#product-id').value = '';
        $('#is-active').checked = true;
        setStatus('Producto guardado correctamente.', 'success');
        await loadProducts();
      } catch (error) {
        console.error(error);
        setStatus(`No se pudo guardar: ${error.message || 'error desconocido'}`, 'error');
      }
    });
  }

  async function initContentPage() {
    const form = $('#content-form');
    if (!form) return;
    await getSessionOrRedirect();

    const { data, error } = await supabaseClient.from('site_content').select('key,value');
    if (error) {
      setStatus('No se pudo cargar el contenido.', 'error');
      return;
    }

    const content = Object.fromEntries((data || []).map((row) => [row.key, row.value || {}]));
    $('#hero-badge').value = content.hero?.badge || '';
    $('#hero-title-html').value = content.hero?.title_html || '';
    $('#hero-subtitle').value = content.hero?.subtitle || '';
    $('#hero-primary').value = content.hero?.primary_button_text || '';
    $('#hero-secondary').value = content.hero?.secondary_button_text || '';
    $('#products-title').value = content.products_section?.title || '';
    $('#products-subtitle').value = content.products_section?.subtitle || '';
    $('#contact-title-html').value = content.contact_section?.title_html || '';
    $('#contact-subtitle').value = content.contact_section?.subtitle || '';
    $('#footer-brand').value = content.footer?.brand || '';
    $('#developer-label').value = content.footer?.developer_label || '';
    $('#developer-name').value = content.footer?.developer_name || '';
    $('#developer-url').value = content.footer?.developer_url || '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Guardando contenido...', 'info');

      const rows = [
        {
          key: 'hero',
          value: {
            badge: $('#hero-badge').value.trim(),
            title_html: $('#hero-title-html').value.trim(),
            subtitle: $('#hero-subtitle').value.trim(),
            primary_button_text: $('#hero-primary').value.trim(),
            secondary_button_text: $('#hero-secondary').value.trim()
          }
        },
        {
          key: 'products_section',
          value: {
            title: $('#products-title').value.trim(),
            subtitle: $('#products-subtitle').value.trim()
          }
        },
        {
          key: 'contact_section',
          value: {
            title_html: $('#contact-title-html').value.trim(),
            subtitle: $('#contact-subtitle').value.trim()
          }
        },
        {
          key: 'footer',
          value: {
            brand: $('#footer-brand').value.trim(),
            developer_label: $('#developer-label').value.trim(),
            developer_name: $('#developer-name').value.trim(),
            developer_url: $('#developer-url').value.trim()
          }
        }
      ];

      const { error: saveError } = await supabaseClient.from('site_content').upsert(rows, { onConflict: 'key' });
      if (saveError) {
        setStatus(`No se pudo guardar: ${saveError.message}`, 'error');
        return;
      }
      setStatus('Contenido guardado correctamente.', 'success');
    });
  }

  async function initContactPage() {
    const form = $('#contact-form');
    if (!form) return;
    await getSessionOrRedirect();

    const { data, error } = await supabaseClient.from('contact_settings').select('*').eq('id', 1).single();
    if (error) {
      setStatus('No se pudo cargar la configuración de contacto.', 'error');
      return;
    }

    $('#sales-email').value = data.sales_email || '';
    $('#contact-email').value = data.contact_email || '';
    $('#whatsapp-number').value = data.whatsapp_number || '';
    $('#whatsapp-message').value = data.whatsapp_message || '';
    $('#footer-text').value = data.footer_text || '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Guardando contacto...', 'info');

      const payload = {
        id: 1,
        sales_email: $('#sales-email').value.trim(),
        contact_email: $('#contact-email').value.trim(),
        whatsapp_number: $('#whatsapp-number').value.replace(/\D/g, ''),
        whatsapp_message: $('#whatsapp-message').value.trim(),
        footer_text: $('#footer-text').value.trim()
      };

      const { error: saveError } = await supabaseClient.from('contact_settings').upsert([payload], { onConflict: 'id' });
      if (saveError) {
        setStatus(`No se pudo guardar: ${saveError.message}`, 'error');
        return;
      }
      setStatus('Datos de contacto guardados correctamente.', 'success');
    });
  }

  async function initDashboard() {
    const container = $('#cotizaciones-list');
    if (!container) return;
    await getSessionOrRedirect();

    const { data, error } = await supabaseClient
      .from('cotizaciones_entrantes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      container.innerHTML = '<p class="text-red-600 font-bold">No se pudieron cargar las solicitudes.</p>';
      return;
    }

    if (!data.length) {
      container.innerHTML = '<p class="text-slate-500 font-bold">Todavía no hay solicitudes registradas.</p>';
      return;
    }

    container.innerHTML = data.map((item) => `
      <div class="border border-slate-200 rounded-xl p-4 bg-white">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-black text-slate-900">${escapeHTML(item.nombre)}</h3>
          <span class="text-xs font-black bg-yellow-100 text-yellow-800 px-2 py-1 rounded">${escapeHTML(item.estado)}</span>
        </div>
        <p class="text-sm text-slate-500 mt-1">${escapeHTML(item.email)} ${item.telefono ? '· ' + escapeHTML(item.telefono) : ''}</p>
        <p class="text-slate-700 mt-2">${escapeHTML(item.mensaje)}</p>
        <p class="text-xs text-slate-400 mt-2">${new Date(item.created_at).toLocaleString('es-CL')}</p>
      </div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await initLogin();
    await initProtectedPage();
    await initProductsPage();
    await initContentPage();
    await initContactPage();
    await initDashboard();
  });
})();
JS

cat > admin/login.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Admin | Alanpastt</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../src/js/config.js"></script>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body class="bg-slate-950 flex items-center justify-center p-6">
  <main class="w-full max-w-md bg-white rounded-2xl p-8 admin-card">
    <div class="text-center mb-8">
      <img src="../public/images/logo.png" alt="Alanpastt" class="h-28 mx-auto object-contain">
      <h1 class="text-3xl font-black text-slate-950 mt-4">Portal Administrativo</h1>
      <p class="text-slate-500 font-bold">Ingresa para editar la web</p>
    </div>

    <div id="status" class="hidden mb-4"></div>

    <form id="login-form" class="space-y-5">
      <div>
        <label for="email" class="block text-xs uppercase font-black text-slate-600 mb-2">Email</label>
        <input id="email" type="email" required class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300">
      </div>
      <div>
        <label for="password" class="block text-xs uppercase font-black text-slate-600 mb-2">Contraseña</label>
        <input id="password" type="password" required class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300">
      </div>
      <button class="w-full bg-slate-950 text-yellow-300 rounded-xl py-4 font-black uppercase hover:bg-yellow-300 hover:text-slate-950 transition">
        Entrar
      </button>
    </form>
  </main>

  <script src="assets/admin.js"></script>
</body>
</html>
HTML

cat > admin/dashboard.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard | Alanpastt</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../src/js/config.js"></script>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body data-admin-page class="bg-slate-100 text-slate-900">
  <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="dashboard.html" class="font-black text-xl">Alanpastt Admin</a>
      <div class="flex items-center gap-3">
        <span id="user-email" class="hidden md:inline text-sm font-bold text-slate-500"></span>
        <button id="logout-btn" class="bg-slate-950 text-yellow-300 px-4 py-2 rounded-lg font-black">Salir</button>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-10">
    <div class="mb-8">
      <h1 class="text-4xl font-black">Panel principal</h1>
      <p class="text-slate-500 font-bold mt-2">Administra la página web de Alanpastt.</p>
    </div>

    <section class="grid md:grid-cols-3 gap-5 mb-10">
      <a href="productos.html" class="admin-card bg-white rounded-2xl p-6 hover:-translate-y-1 transition">
        <p class="text-xs uppercase font-black text-yellow-600">Catálogo</p>
        <h2 class="text-2xl font-black mt-2">Productos</h2>
        <p class="text-slate-500 mt-2">Crear, editar, ocultar o eliminar productos.</p>
      </a>
      <a href="contenido.html" class="admin-card bg-white rounded-2xl p-6 hover:-translate-y-1 transition">
        <p class="text-xs uppercase font-black text-yellow-600">Página</p>
        <h2 class="text-2xl font-black mt-2">Contenido</h2>
        <p class="text-slate-500 mt-2">Editar títulos, subtítulos y textos principales.</p>
      </a>
      <a href="contacto.html" class="admin-card bg-white rounded-2xl p-6 hover:-translate-y-1 transition">
        <p class="text-xs uppercase font-black text-yellow-600">Datos</p>
        <h2 class="text-2xl font-black mt-2">Contacto</h2>
        <p class="text-slate-500 mt-2">Actualizar emails, WhatsApp y footer.</p>
      </a>
    </section>

    <section class="admin-card bg-white rounded-2xl p-6">
      <h2 class="text-2xl font-black mb-4">Últimas solicitudes</h2>
      <div id="cotizaciones-list" class="space-y-4">
        <p class="text-slate-500 font-bold">Cargando solicitudes...</p>
      </div>
    </section>
  </main>

  <script src="assets/admin.js"></script>
</body>
</html>
HTML

cat > admin/productos.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Productos | Alanpastt Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../src/js/config.js"></script>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body data-admin-page class="bg-slate-100 text-slate-900">
  <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="dashboard.html" class="font-black text-xl">← Alanpastt Admin</a>
      <button id="logout-btn" class="bg-slate-950 text-yellow-300 px-4 py-2 rounded-lg font-black">Salir</button>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-10">
    <h1 class="text-4xl font-black mb-2">Productos</h1>
    <p class="text-slate-500 font-bold mb-8">Administra los productos visibles en la página pública.</p>

    <div id="status" class="hidden mb-6"></div>

    <section class="admin-card bg-white rounded-2xl p-6 mb-8">
      <h2 class="text-2xl font-black mb-5">Crear / editar producto</h2>
      <form id="product-form" class="grid md:grid-cols-2 gap-5">
        <input type="hidden" id="product-id">
        <div class="md:col-span-2">
          <label class="block text-xs uppercase font-black text-slate-600 mb-2">Título</label>
          <input id="title" required class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300">
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs uppercase font-black text-slate-600 mb-2">Descripción</label>
          <textarea id="description" required rows="3" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300"></textarea>
        </div>
        <div>
          <label class="block text-xs uppercase font-black text-slate-600 mb-2">Subir imagen</label>
          <input id="image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold">
        </div>
        <div>
          <label class="block text-xs uppercase font-black text-slate-600 mb-2">URL de imagen</label>
          <input id="image-url" placeholder="public/images/logo.png o URL" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300">
        </div>
        <div>
          <label class="block text-xs uppercase font-black text-slate-600 mb-2">Texto alternativo</label>
          <input id="image-alt" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300">
        </div>
        <div>
          <label class="block text-xs uppercase font-black text-slate-600 mb-2">Orden</label>
          <input id="sort-order" type="number" value="0" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-yellow-300">
        </div>
        <label class="flex items-center gap-3 font-black">
          <input id="is-active" type="checkbox" checked class="w-5 h-5">
          Producto visible en la web
        </label>
        <div class="md:col-span-2 flex flex-col md:flex-row gap-3">
          <button class="bg-slate-950 text-yellow-300 px-6 py-4 rounded-xl font-black uppercase">Guardar producto</button>
          <button type="button" id="clear-form" class="bg-slate-200 text-slate-900 px-6 py-4 rounded-xl font-black uppercase">Limpiar</button>
        </div>
      </form>
    </section>

    <section>
      <h2 class="text-2xl font-black mb-5">Listado</h2>
      <div id="products-list" class="space-y-4"></div>
    </section>
  </main>

  <script src="assets/admin.js"></script>
</body>
</html>
HTML

cat > admin/contenido.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contenido | Alanpastt Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../src/js/config.js"></script>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body data-admin-page class="bg-slate-100 text-slate-900">
  <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="dashboard.html" class="font-black text-xl">← Alanpastt Admin</a>
      <button id="logout-btn" class="bg-slate-950 text-yellow-300 px-4 py-2 rounded-lg font-black">Salir</button>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-10">
    <h1 class="text-4xl font-black mb-2">Contenido de la web</h1>
    <p class="text-slate-500 font-bold mb-8">Edita los textos principales. Los campos con HTML permiten mantener resaltados y saltos de línea.</p>
    <div id="status" class="hidden mb-6"></div>

    <form id="content-form" class="admin-card bg-white rounded-2xl p-6 space-y-8">
      <section>
        <h2 class="text-2xl font-black mb-4">Inicio</h2>
        <div class="grid gap-4">
          <input id="hero-badge" placeholder="Insignia" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
          <textarea id="hero-title-html" rows="3" placeholder="Título HTML" class="rounded-xl bg-slate-100 px-4 py-4 font-bold"></textarea>
          <textarea id="hero-subtitle" rows="3" placeholder="Subtítulo" class="rounded-xl bg-slate-100 px-4 py-4 font-bold"></textarea>
          <input id="hero-primary" placeholder="Texto botón principal" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
          <input id="hero-secondary" placeholder="Texto botón WhatsApp" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-black mb-4">Productos</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <input id="products-title" placeholder="Título sección productos" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
          <input id="products-subtitle" placeholder="Subtítulo sección productos" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-black mb-4">Contacto</h2>
        <div class="grid gap-4">
          <textarea id="contact-title-html" rows="3" placeholder="Título contacto HTML" class="rounded-xl bg-slate-100 px-4 py-4 font-bold"></textarea>
          <textarea id="contact-subtitle" rows="3" placeholder="Subtítulo contacto" class="rounded-xl bg-slate-100 px-4 py-4 font-bold"></textarea>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-black mb-4">Footer / Desarrollo</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <input id="footer-brand" placeholder="Marca" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
          <input id="developer-label" placeholder="Etiqueta desarrollo" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
          <input id="developer-name" placeholder="Nombre desarrollador" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
          <input id="developer-url" placeholder="URL desarrollador" class="rounded-xl bg-slate-100 px-4 py-4 font-bold">
        </div>
      </section>

      <button class="bg-slate-950 text-yellow-300 px-6 py-4 rounded-xl font-black uppercase">Guardar contenido</button>
    </form>
  </main>

  <script src="assets/admin.js"></script>
</body>
</html>
HTML

cat > admin/contacto.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contacto | Alanpastt Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="../src/js/config.js"></script>
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body data-admin-page class="bg-slate-100 text-slate-900">
  <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
    <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="dashboard.html" class="font-black text-xl">← Alanpastt Admin</a>
      <button id="logout-btn" class="bg-slate-950 text-yellow-300 px-4 py-2 rounded-lg font-black">Salir</button>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="text-4xl font-black mb-2">Contacto</h1>
    <p class="text-slate-500 font-bold mb-8">Edita correos, WhatsApp, mensaje prellenado y texto del footer.</p>
    <div id="status" class="hidden mb-6"></div>

    <form id="contact-form" class="admin-card bg-white rounded-2xl p-6 space-y-5">
      <div>
        <label class="block text-xs uppercase font-black text-slate-600 mb-2">Email ventas</label>
        <input id="sales-email" type="email" required class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold">
      </div>
      <div>
        <label class="block text-xs uppercase font-black text-slate-600 mb-2">Email contacto</label>
        <input id="contact-email" type="email" required class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold">
      </div>
      <div>
        <label class="block text-xs uppercase font-black text-slate-600 mb-2">WhatsApp en formato internacional sin +</label>
        <input id="whatsapp-number" required placeholder="56933365549" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold">
      </div>
      <div>
        <label class="block text-xs uppercase font-black text-slate-600 mb-2">Mensaje automático WhatsApp</label>
        <textarea id="whatsapp-message" required rows="3" class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold"></textarea>
      </div>
      <div>
        <label class="block text-xs uppercase font-black text-slate-600 mb-2">Texto footer</label>
        <input id="footer-text" required class="w-full rounded-xl bg-slate-100 px-4 py-4 font-bold">
      </div>
      <button class="bg-slate-950 text-yellow-300 px-6 py-4 rounded-xl font-black uppercase">Guardar contacto</button>
    </form>
  </main>

  <script src="assets/admin.js"></script>
</body>
</html>
HTML

echo "Listo. Archivos creados/actualizados."
echo "Siguiente: ejecuta el SQL de supabase/schema.sql en Supabase y crea el usuario admin."
