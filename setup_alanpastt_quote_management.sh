#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
cd "$PROJECT_DIR"

if [[ ! -f "index.html" || ! -d "src" ]]; then
  echo "ERROR: Ejecuta este script desde la raíz del proyecto Alanpastt."
  exit 1
fi

mkdir -p supabase/functions/quote-email admin/assets src/js
STAMP=$(date +%Y%m%d%H%M%S)

[[ -f src/js/main.js ]] && cp src/js/main.js "src/js/main.backup.quote-management.$STAMP.js"
[[ -f index.html ]] && cp index.html "index.backup.quote-management.$STAMP.html"
[[ -f admin/dashboard.html ]] && cp admin/dashboard.html "admin/dashboard.backup.quote-management.$STAMP.html"

# Extrae URL y anon key existentes desde main.js si están hardcodeadas.
python3 <<'PY'
from pathlib import Path
import re
main = Path('src/js/main.js').read_text() if Path('src/js/main.js').exists() else ''
url = ''
key = ''
patterns_url = [r"supabaseUrl\s*=\s*['\"]([^'\"]+)['\"]", r"SUPABASE_URL\s*[:=]\s*['\"]([^'\"]+)['\"]"]
patterns_key = [r"supabaseKey\s*=\s*['\"]([^'\"]+)['\"]", r"SUPABASE_ANON_KEY\s*[:=]\s*['\"]([^'\"]+)['\"]"]
for p in patterns_url:
    m = re.search(p, main)
    if m:
        url = m.group(1); break
for p in patterns_key:
    m = re.search(p, main)
    if m:
        key = m.group(1); break
if not url:
    url = 'https://gpswsmhfrdetvztstnyi.supabase.co'
if not key:
    key = 'REEMPLAZA_CON_TU_SUPABASE_ANON_KEY'
Path('src/js/config.js').write_text(f"""// Configuración pública de Supabase. La anon key es segura en navegador solo si RLS está bien configurado.
window.ALANPASTT_CONFIG = {{
  SUPABASE_URL: '{url}',
  SUPABASE_ANON_KEY: '{key}',
  SITE_URL: window.location.origin
}};

window.alanpasttSupabase = window.supabase.createClient(
  window.ALANPASTT_CONFIG.SUPABASE_URL,
  window.ALANPASTT_CONFIG.SUPABASE_ANON_KEY
);
""")
print('src/js/config.js actualizado')
PY

cat > supabase/quote-management.sql <<'SQL'
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
SQL

cat > supabase/functions/quote-email/index.ts <<'TS'
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Quote = {
  id: string;
  tracking_code: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  mensaje: string;
  created_at?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function emailLayout(title: string, content: string) {
  const logoUrl = Deno.env.get('LOGO_URL') || `${Deno.env.get('SITE_URL')}/public/images/logo.png`;
  return `
  <!doctype html>
  <html lang="es">
  <body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#000000;border-bottom:6px solid #FACC15;padding:28px;text-align:center;">
                <img src="${logoUrl}" alt="Alanpastt" style="max-width:220px;height:auto;display:inline-block;">
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="display:inline-block;background:#FACC15;color:#000000;font-weight:900;text-transform:uppercase;letter-spacing:2px;font-size:12px;padding:8px 12px;margin-bottom:18px;">
                  Alanpastt
                </div>
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.1;color:#000000;text-transform:uppercase;font-weight:900;">${title}</h1>
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background:#000000;color:#9ca3af;padding:24px;text-align:center;font-size:12px;">
                <strong style="color:#FACC15;">Alanpastt</strong><br>
                Soluciones de goma para seguridad y construcción<br>
                <span style="color:#ffffff;">ventas@alanpastt.cl · +56 9 3336 5549</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Alanpastt <cotizaciones@alanpastt.cl>';

  if (!RESEND_API_KEY) {
    throw new Error('Falta RESEND_API_KEY en Supabase secrets');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Resend error:', data);
    throw new Error(data?.message || 'No se pudo enviar el correo');
  }
  return data;
}

async function assertAdmin(req: Request, supabaseAdmin: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) throw new Error('No autenticado');

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) throw new Error('Sesión inválida');

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('admin_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') throw new Error('No autorizado');
  return userData.user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')?.default;
  const SALES_EMAIL = Deno.env.get('SALES_EMAIL') || 'ventas@alanpastt.cl';
  const SITE_URL = Deno.env.get('SITE_URL') || 'https://www.alanpastt.cl';

  if (!SERVICE_ROLE_KEY) return jsonResponse({ error: 'Falta service role key en secrets' }, 500);

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const payload = await req.json();

    if (payload.type === 'confirmation') {
      const quote = payload.quote as Quote;
      if (!quote?.id || !quote?.email || !quote?.tracking_code) {
        return jsonResponse({ error: 'Datos incompletos' }, 400);
      }

      const { data: dbQuote, error } = await supabaseAdmin
        .from('cotizaciones_entrantes')
        .select('id, tracking_code, nombre, email, telefono, empresa, mensaje, created_at')
        .eq('id', quote.id)
        .eq('email', quote.email)
        .eq('tracking_code', quote.tracking_code)
        .single();

      if (error || !dbQuote) return jsonResponse({ error: 'Solicitud no encontrada' }, 404);

      const clientHtml = emailLayout('Solicitud recibida', `
        <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">Hola <strong>${escapeHtml(dbQuote.nombre)}</strong>, recibimos correctamente tu solicitud de cotización.</p>
        <div style="background:#111827;color:#ffffff;border-left:8px solid #FACC15;padding:18px;border-radius:12px;margin:22px 0;">
          <div style="font-size:12px;color:#FACC15;text-transform:uppercase;font-weight:900;letter-spacing:1px;">Código de seguimiento</div>
          <div style="font-size:28px;font-weight:900;margin-top:6px;">${escapeHtml(dbQuote.tracking_code)}</div>
        </div>
        <p style="font-size:15px;line-height:1.7;margin:0 0 12px;">Puedes hacer seguimiento respondiendo este correo, escribiendo a <strong>${SALES_EMAIL}</strong> o al WhatsApp <strong>+56 9 3336 5549</strong>, indicando tu código.</p>
        <p style="font-size:15px;line-height:1.7;margin:0;">Nuestro equipo revisará tu requerimiento y te contactará a la brevedad.</p>
      `);

      const adminHtml = emailLayout('Nueva solicitud de cotización', `
        <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">Ingresó una nueva solicitud desde el sitio web.</p>
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:900;">Código</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(dbQuote.tracking_code)}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:900;">Nombre</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(dbQuote.nombre)}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:900;">Email</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(dbQuote.email)}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:900;">Mensaje</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(dbQuote.mensaje)}</td></tr>
        </table>
        <p style="margin-top:22px;"><a href="${SITE_URL}/admin/solicitudes.html" style="background:#FACC15;color:#000000;text-decoration:none;font-weight:900;padding:14px 18px;border-radius:10px;display:inline-block;text-transform:uppercase;">Gestionar solicitud</a></p>
      `);

      await sendEmail(dbQuote.email, `Recibimos tu solicitud ${dbQuote.tracking_code}`, clientHtml);
      await sendEmail(SALES_EMAIL, `Nueva cotización ${dbQuote.tracking_code}`, adminHtml);

      return jsonResponse({ ok: true });
    }

    if (payload.type === 'response') {
      const user = await assertAdmin(req, supabaseAdmin);
      const { quote_id, subject, body, attachment_ids = [] } = payload;

      if (!quote_id || !subject || !body) return jsonResponse({ error: 'Datos incompletos' }, 400);

      const { data: quote, error: quoteError } = await supabaseAdmin
        .from('cotizaciones_entrantes')
        .select('id, tracking_code, nombre, email')
        .eq('id', quote_id)
        .single();

      if (quoteError || !quote) return jsonResponse({ error: 'Solicitud no encontrada' }, 404);

      let attachmentsHtml = '';
      let validAttachmentIds: string[] = [];

      if (Array.isArray(attachment_ids) && attachment_ids.length > 0) {
        const { data: attachments, error: attachmentsError } = await supabaseAdmin
          .from('quote_attachments')
          .select('id, file_name, file_path')
          .eq('quote_id', quote_id)
          .in('id', attachment_ids);

        if (attachmentsError) throw attachmentsError;

        const links: string[] = [];
        for (const file of attachments || []) {
          const { data: signed } = await supabaseAdmin.storage
            .from('quote-attachments')
            .createSignedUrl(file.file_path, 60 * 60 * 24 * 7);
          if (signed?.signedUrl) {
            validAttachmentIds.push(file.id);
            links.push(`<li style="margin-bottom:8px;"><a href="${signed.signedUrl}" style="color:#000000;font-weight:900;">${escapeHtml(file.file_name)}</a></li>`);
          }
        }

        if (links.length) {
          attachmentsHtml = `
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:18px;margin-top:22px;">
              <div style="font-size:13px;color:#111827;text-transform:uppercase;font-weight:900;letter-spacing:1px;margin-bottom:10px;">Archivos adjuntos</div>
              <ul style="margin:0;padding-left:20px;">${links.join('')}</ul>
              <p style="font-size:12px;color:#6b7280;margin:14px 0 0;">Los enlaces estarán disponibles por 7 días.</p>
            </div>`;
        }
      }

      const responseHtml = emailLayout(subject, `
        <p style="font-size:15px;line-height:1.7;margin:0 0 16px;">Hola <strong>${escapeHtml(quote.nombre)}</strong>,</p>
        <div style="font-size:15px;line-height:1.7;color:#111827;white-space:pre-line;">${escapeHtml(body)}</div>
        ${attachmentsHtml}
        <div style="background:#111827;color:#ffffff;border-left:8px solid #FACC15;padding:16px;border-radius:12px;margin-top:24px;">
          <div style="font-size:12px;color:#FACC15;text-transform:uppercase;font-weight:900;letter-spacing:1px;">Código de seguimiento</div>
          <div style="font-size:22px;font-weight:900;margin-top:4px;">${escapeHtml(quote.tracking_code)}</div>
        </div>
      `);

      await sendEmail(quote.email, subject, responseHtml);

      await supabaseAdmin.from('quote_responses').insert({
        quote_id,
        subject,
        body,
        sent_to: quote.email,
        sent_by: user.id,
        attachment_ids: validAttachmentIds,
      });

      await supabaseAdmin
        .from('cotizaciones_entrantes')
        .update({ estado: 'Respondida', last_response_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', quote_id);

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Tipo no soportado' }, 400);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error.message || 'Error interno' }, 500);
  }
});
TS

cat > src/js/main.js <<'JS'
const supabaseClient = window.alanpasttSupabase || window.supabase.createClient(
  window.ALANPASTT_CONFIG.SUPABASE_URL,
  window.ALANPASTT_CONFIG.SUPABASE_ANON_KEY
);

function generarCodigoSeguimiento() {
  const fecha = new Date();
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALP-${y}${m}${d}-${random}`;
}

function ensureMessage(form, id, className, text) {
  let node = document.getElementById(id);
  if (!node && form) {
    node = document.createElement('div');
    node.id = id;
    node.className = className;
    node.textContent = text;
    form.parentNode.appendChild(node);
  }
  return node;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cotizacion');
  const btnEnviar = document.getElementById('btn-enviar');

  const msjExito = ensureMessage(
    form,
    'mensaje-exito',
    'hidden mt-6 bg-green-500 text-white font-black p-4 rounded text-center',
    '¡Solicitud enviada con éxito! Revisa tu correo para ver el código de seguimiento.'
  );

  const msjError = ensureMessage(
    form,
    'mensaje-error',
    'hidden mt-6 bg-red-500 text-white font-black p-4 rounded text-center',
    'Hubo un error al enviar. Intenta nuevamente.'
  );

  if (!form || !btnEnviar) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = 'Enviando...';
    btnEnviar.disabled = true;
    btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');
    msjExito.classList.add('hidden');
    msjError.classList.add('hidden');

    const trackingCode = generarCodigoSeguimiento();

    const formData = {
      tracking_code: trackingCode,
      nombre: document.getElementById('nombre')?.value?.trim(),
      email: document.getElementById('email')?.value?.trim(),
      telefono: document.getElementById('telefono')?.value?.trim() || null,
      empresa: document.getElementById('empresa')?.value?.trim() || null,
      mensaje: document.getElementById('mensaje')?.value?.trim(),
      estado: 'Nueva',
    };

    try {
      const { data, error } = await supabaseClient
        .from('cotizaciones_entrantes')
        .insert([formData])
        .select('id, tracking_code, nombre, email, telefono, empresa, mensaje, created_at')
        .single();

      if (error) throw error;

      // Envía correo de confirmación al cliente y aviso interno a ventas.
      const { error: fnError } = await supabaseClient.functions.invoke('quote-email', {
        body: { type: 'confirmation', quote: data },
      });

      if (fnError) {
        console.warn('La solicitud fue guardada, pero falló el correo:', fnError);
      }

      msjExito.textContent = `¡Solicitud enviada con éxito! Tu código de seguimiento es ${data.tracking_code}. También lo enviamos a tu correo.`;
      msjExito.classList.remove('hidden');
      form.reset();
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      msjError.classList.remove('hidden');
    } finally {
      btnEnviar.innerHTML = textoOriginal;
      btnEnviar.disabled = false;
      btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  });
});
JS

# Asegura que config.js se cargue antes que main.js en index.html.
python3 <<'PY'
from pathlib import Path
p = Path('index.html')
html = p.read_text()
if 'src/js/config.js' not in html:
    html = html.replace('<script src="src/js/main.js"></script>', '<script src="src/js/config.js"></script>\n    <script src="src/js/main.js"></script>')
p.write_text(html)
PY

cat > admin/solicitudes.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitudes | Alanpastt Admin</title>
  <link rel="shortcut icon" href="../public/images/logo.png" type="image/x-icon">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { alanpastt: { amarillo: '#FACC15', negro: '#000000', gris: '#1F2937', acento: '#EAB308' } } } } }
  </script>
</head>
<body class="bg-slate-100 text-slate-900">
  <header class="bg-black border-b-4 border-alanpastt-amarillo">
    <div class="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div class="flex items-center gap-4">
        <img src="../public/images/logo.png" class="h-16 w-auto bg-white rounded p-2" alt="Alanpastt">
        <div>
          <p class="text-alanpastt-amarillo text-xs font-black uppercase tracking-[0.3em]">Panel administrativo</p>
          <h1 class="text-white text-2xl md:text-3xl font-black uppercase tracking-tight">Solicitudes</h1>
        </div>
      </div>
      <nav class="flex flex-wrap gap-2">
        <a href="dashboard.html" class="px-4 py-2 bg-white/10 text-white rounded font-bold hover:bg-white/20">Dashboard</a>
        <a href="productos.html" class="px-4 py-2 bg-white/10 text-white rounded font-bold hover:bg-white/20">Productos</a>
        <a href="../index.html" class="px-4 py-2 bg-alanpastt-amarillo text-black rounded font-black">Ver web</a>
        <button id="logout-btn" class="px-4 py-2 bg-red-600 text-white rounded font-black">Salir</button>
      </nav>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    <div id="alert" class="hidden mb-6 p-4 rounded font-bold"></div>

    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside class="lg:col-span-4 bg-white rounded-2xl shadow p-4">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h2 class="text-xl font-black uppercase">Últimas solicitudes</h2>
          <button id="refresh-btn" class="bg-black text-alanpastt-amarillo px-3 py-2 rounded font-black text-xs uppercase">Actualizar</button>
        </div>
        <div class="mb-4">
          <input id="search-input" type="search" placeholder="Buscar por nombre, correo o código" class="w-full bg-slate-100 rounded px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-alanpastt-amarillo">
        </div>
        <div id="requests-list" class="space-y-3 max-h-[70vh] overflow-auto pr-1"></div>
      </aside>

      <section class="lg:col-span-8 bg-white rounded-2xl shadow overflow-hidden">
        <div id="empty-state" class="p-12 text-center">
          <div class="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mb-4">📩</div>
          <h2 class="text-2xl font-black uppercase">Selecciona una solicitud</h2>
          <p class="text-slate-500 mt-2">Presiona una solicitud para ver detalles, adjuntar archivos y responder al cliente.</p>
        </div>

        <div id="detail-panel" class="hidden">
          <div class="bg-black text-white p-6 border-b-4 border-alanpastt-amarillo">
            <p id="detail-code" class="text-alanpastt-amarillo font-black tracking-widest uppercase text-sm"></p>
            <h2 id="detail-name" class="text-3xl font-black uppercase mt-1"></h2>
            <p id="detail-meta" class="text-slate-300 mt-2"></p>
          </div>

          <div class="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div class="space-y-6">
              <div>
                <h3 class="font-black uppercase text-sm tracking-widest text-slate-500 mb-2">Mensaje recibido</h3>
                <div id="detail-message" class="bg-slate-100 p-4 rounded-xl whitespace-pre-line leading-relaxed"></div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-black uppercase text-xs mb-2">Estado</label>
                  <select id="status-select" class="w-full bg-slate-100 rounded px-4 py-3 font-bold">
                    <option>Nueva</option>
                    <option>En revisión</option>
                    <option>Cotizando</option>
                    <option>Respondida</option>
                    <option>Cerrada</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button id="save-status-btn" class="w-full bg-black text-alanpastt-amarillo py-3 rounded font-black uppercase">Guardar estado</button>
                </div>
              </div>

              <div>
                <label class="block font-black uppercase text-xs mb-2">Notas internas</label>
                <textarea id="internal-notes" rows="5" class="w-full bg-slate-100 rounded px-4 py-3 font-bold resize-none" placeholder="Notas visibles solo para el equipo..."></textarea>
                <button id="save-notes-btn" class="mt-3 bg-slate-900 text-white px-5 py-3 rounded font-black uppercase text-sm">Guardar notas</button>
              </div>

              <div>
                <h3 class="font-black uppercase text-sm tracking-widest text-slate-500 mb-2">Archivos adjuntos</h3>
                <input id="file-input" type="file" class="block w-full text-sm text-slate-600 file:mr-4 file:py-3 file:px-4 file:rounded file:border-0 file:bg-alanpastt-amarillo file:text-black file:font-black">
                <button id="upload-file-btn" class="mt-3 bg-alanpastt-amarillo text-black px-5 py-3 rounded font-black uppercase text-sm">Subir archivo</button>
                <div id="attachments-list" class="mt-4 space-y-2"></div>
              </div>
            </div>

            <div>
              <h3 class="font-black uppercase text-sm tracking-widest text-slate-500 mb-2">Responder al cliente</h3>
              <div class="border rounded-2xl overflow-hidden">
                <div class="bg-black border-b-4 border-alanpastt-amarillo p-5 text-center">
                  <img src="../public/images/logo.png" class="h-20 mx-auto bg-white rounded p-2" alt="Alanpastt">
                </div>
                <div class="p-5 space-y-4">
                  <div>
                    <label class="block font-black uppercase text-xs mb-2">Asunto</label>
                    <input id="response-subject" class="w-full bg-slate-100 rounded px-4 py-3 font-bold" placeholder="Respuesta a tu solicitud ALP-...">
                  </div>
                  <div>
                    <label class="block font-black uppercase text-xs mb-2">Mensaje</label>
                    <textarea id="response-body" rows="12" class="w-full bg-slate-100 rounded px-4 py-3 font-bold resize-none" placeholder="Hola, junto con saludar..."></textarea>
                  </div>
                  <p class="text-xs text-slate-500">Los archivos seleccionados en “adjuntos” serán enviados como enlaces seguros válidos por 7 días.</p>
                  <button id="send-response-btn" class="w-full bg-black text-alanpastt-amarillo py-4 rounded font-black uppercase tracking-widest">Enviar respuesta</button>
                </div>
              </div>

              <div class="mt-6">
                <h3 class="font-black uppercase text-sm tracking-widest text-slate-500 mb-2">Historial de respuestas</h3>
                <div id="responses-list" class="space-y-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>

  <script src="../src/js/config.js"></script>
  <script src="assets/solicitudes.js"></script>
</body>
</html>
HTML

cat > admin/assets/solicitudes.js <<'JS'
const supabaseClient = window.alanpasttSupabase;

let currentUser = null;
let requests = [];
let selectedRequest = null;
let selectedAttachmentIds = new Set();

const els = {
  alert: document.getElementById('alert'),
  list: document.getElementById('requests-list'),
  search: document.getElementById('search-input'),
  empty: document.getElementById('empty-state'),
  panel: document.getElementById('detail-panel'),
  code: document.getElementById('detail-code'),
  name: document.getElementById('detail-name'),
  meta: document.getElementById('detail-meta'),
  message: document.getElementById('detail-message'),
  status: document.getElementById('status-select'),
  notes: document.getElementById('internal-notes'),
  file: document.getElementById('file-input'),
  attachments: document.getElementById('attachments-list'),
  responses: document.getElementById('responses-list'),
  subject: document.getElementById('response-subject'),
  body: document.getElementById('response-body'),
};

function showAlert(message, type = 'success') {
  els.alert.textContent = message;
  els.alert.className = `mb-6 p-4 rounded font-bold ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
  els.alert.classList.remove('hidden');
  setTimeout(() => els.alert.classList.add('hidden'), 5000);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) window.location.href = 'login.html';
  currentUser = session.user;
}

function requestCard(item) {
  const active = selectedRequest?.id === item.id;
  return `
    <button data-id="${item.id}" class="request-card w-full text-left p-4 rounded-xl border ${active ? 'border-black bg-yellow-50' : 'border-slate-200 hover:border-alanpastt-amarillo'} transition-all">
      <div class="flex items-center justify-between gap-2">
        <span class="font-black text-xs uppercase tracking-widest text-alanpastt-acento">${item.tracking_code}</span>
        <span class="text-[10px] font-black uppercase px-2 py-1 rounded ${item.estado === 'Nueva' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}">${item.estado}</span>
      </div>
      <div class="font-black text-lg mt-1 truncate">${item.nombre}</div>
      <div class="text-sm text-slate-500 truncate">${item.email}</div>
      <div class="text-xs text-slate-400 mt-2">${formatDate(item.created_at)}</div>
    </button>`;
}

function renderList(data = requests) {
  if (!data.length) {
    els.list.innerHTML = '<p class="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl">No hay solicitudes para mostrar.</p>';
    return;
  }

  els.list.innerHTML = data.map(requestCard).join('');
  document.querySelectorAll('.request-card').forEach(btn => {
    btn.addEventListener('click', () => selectRequest(btn.dataset.id));
  });
}

async function loadRequests() {
  const { data, error } = await supabaseClient
    .from('cotizaciones_entrantes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    showAlert('No se pudieron cargar las solicitudes. Revisa RLS/admin_profiles.', 'error');
    return;
  }

  requests = data || [];
  renderList();
}

async function selectRequest(id) {
  selectedRequest = requests.find(r => r.id === id);
  selectedAttachmentIds.clear();
  if (!selectedRequest) return;

  els.empty.classList.add('hidden');
  els.panel.classList.remove('hidden');
  renderList();

  els.code.textContent = selectedRequest.tracking_code;
  els.name.textContent = selectedRequest.nombre;
  els.meta.textContent = `${selectedRequest.email}${selectedRequest.telefono ? ' · ' + selectedRequest.telefono : ''} · ${formatDate(selectedRequest.created_at)}`;
  els.message.textContent = selectedRequest.mensaje || '';
  els.status.value = selectedRequest.estado || 'Nueva';
  els.notes.value = selectedRequest.internal_notes || '';
  els.subject.value = `Respuesta a tu solicitud ${selectedRequest.tracking_code}`;
  els.body.value = `Hola ${selectedRequest.nombre},\n\nGracias por contactar a Alanpastt. Revisamos tu solicitud y te compartimos la siguiente respuesta:\n\n`;

  await Promise.all([loadAttachments(), loadResponses()]);
}

async function updateQuote(fields) {
  if (!selectedRequest) return;
  const { error } = await supabaseClient
    .from('cotizaciones_entrantes')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', selectedRequest.id);

  if (error) throw error;
  Object.assign(selectedRequest, fields);
  requests = requests.map(r => r.id === selectedRequest.id ? selectedRequest : r);
  renderList();
}

async function loadAttachments() {
  const { data, error } = await supabaseClient
    .from('quote_attachments')
    .select('*')
    .eq('quote_id', selectedRequest.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    els.attachments.innerHTML = '<p class="text-red-600 text-sm font-bold">No se pudieron cargar adjuntos.</p>';
    return;
  }

  if (!data?.length) {
    els.attachments.innerHTML = '<p class="text-slate-500 text-sm">Sin archivos adjuntos.</p>';
    return;
  }

  els.attachments.innerHTML = data.map(file => `
    <label class="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded border">
      <span class="min-w-0">
        <span class="block font-bold truncate">${file.file_name}</span>
        <span class="block text-xs text-slate-500">${formatDate(file.created_at)}</span>
      </span>
      <input type="checkbox" class="attachment-check h-5 w-5" value="${file.id}" ${selectedAttachmentIds.has(file.id) ? 'checked' : ''}>
    </label>
  `).join('');

  document.querySelectorAll('.attachment-check').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) selectedAttachmentIds.add(input.value);
      else selectedAttachmentIds.delete(input.value);
    });
  });
}

async function loadResponses() {
  const { data, error } = await supabaseClient
    .from('quote_responses')
    .select('*')
    .eq('quote_id', selectedRequest.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    els.responses.innerHTML = '<p class="text-red-600 text-sm font-bold">No se pudo cargar historial.</p>';
    return;
  }

  if (!data?.length) {
    els.responses.innerHTML = '<p class="text-slate-500 text-sm">Sin respuestas enviadas.</p>';
    return;
  }

  els.responses.innerHTML = data.map(item => `
    <article class="bg-slate-50 border rounded-xl p-4">
      <div class="font-black">${item.subject}</div>
      <div class="text-xs text-slate-500 mb-2">${formatDate(item.created_at)} · ${item.sent_to}</div>
      <p class="text-sm whitespace-pre-line line-clamp-4">${item.body}</p>
    </article>
  `).join('');
}

async function uploadFile() {
  if (!selectedRequest || !els.file.files.length) return showAlert('Selecciona un archivo.', 'error');
  const file = els.file.files[0];
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${selectedRequest.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('quote-attachments')
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabaseClient.from('quote_attachments').insert({
    quote_id: selectedRequest.id,
    file_name: file.name,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: currentUser.id,
  });

  if (dbError) throw dbError;
  els.file.value = '';
  showAlert('Archivo adjuntado correctamente.');
  await loadAttachments();
}

async function sendResponse() {
  if (!selectedRequest) return;
  const subject = els.subject.value.trim();
  const body = els.body.value.trim();
  if (!subject || !body) return showAlert('Completa asunto y mensaje.', 'error');

  const { data: { session } } = await supabaseClient.auth.getSession();
  const { data, error } = await supabaseClient.functions.invoke('quote-email', {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: {
      type: 'response',
      quote_id: selectedRequest.id,
      subject,
      body,
      attachment_ids: Array.from(selectedAttachmentIds),
    },
  });

  if (error || data?.error) throw error || new Error(data.error);

  await updateQuote({ estado: 'Respondida', last_response_at: new Date().toISOString() });
  showAlert('Respuesta enviada correctamente.');
  await loadResponses();
}

document.getElementById('refresh-btn').addEventListener('click', loadRequests);
document.getElementById('save-status-btn').addEventListener('click', async () => {
  try {
    await updateQuote({ estado: els.status.value });
    showAlert('Estado actualizado.');
  } catch (error) {
    console.error(error); showAlert('No se pudo actualizar el estado.', 'error');
  }
});
document.getElementById('save-notes-btn').addEventListener('click', async () => {
  try {
    await updateQuote({ internal_notes: els.notes.value });
    showAlert('Notas guardadas.');
  } catch (error) {
    console.error(error); showAlert('No se pudieron guardar las notas.', 'error');
  }
});
document.getElementById('upload-file-btn').addEventListener('click', async () => {
  try { await uploadFile(); } catch (error) { console.error(error); showAlert('No se pudo subir el archivo.', 'error'); }
});
document.getElementById('send-response-btn').addEventListener('click', async () => {
  try { await sendResponse(); } catch (error) { console.error(error); showAlert('No se pudo enviar la respuesta.', 'error'); }
});
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
});
els.search.addEventListener('input', () => {
  const term = els.search.value.toLowerCase().trim();
  const filtered = requests.filter(r => [r.nombre, r.email, r.tracking_code, r.estado].join(' ').toLowerCase().includes(term));
  renderList(filtered);
});

(async () => {
  await requireAuth();
  await loadRequests();
})();
JS

# Si existe dashboard, agregar enlace a Solicitudes sin romperlo. Si no existe, crear uno básico.
if [[ -f admin/dashboard.html ]]; then
  python3 <<'PY'
from pathlib import Path
p = Path('admin/dashboard.html')
html = p.read_text()
if 'solicitudes.html' not in html:
    # Inserta un link justo después del primer <nav...> o antes de productos si existe
    link = '<a href="solicitudes.html" class="px-4 py-2 bg-alanpastt-amarillo text-black rounded font-black">Solicitudes</a>'
    if '</nav>' in html:
        html = html.replace('</nav>', f'        {link}\n      </nav>', 1)
    elif '</body>' in html:
        html = html.replace('</body>', f'<p style="padding:20px"><a href="solicitudes.html">Solicitudes</a></p>\n</body>')
p.write_text(html)
PY
else
cat > admin/dashboard.html <<'HTML'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard | Alanpastt Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100">
  <main class="max-w-5xl mx-auto p-8">
    <h1 class="text-4xl font-black uppercase mb-6">Panel Alanpastt</h1>
    <div class="grid md:grid-cols-3 gap-4">
      <a href="solicitudes.html" class="bg-black text-yellow-400 p-6 rounded-xl font-black uppercase">Solicitudes</a>
      <a href="productos.html" class="bg-white p-6 rounded-xl font-black uppercase">Productos</a>
      <a href="../index.html" class="bg-yellow-400 text-black p-6 rounded-xl font-black uppercase">Ver web</a>
    </div>
  </main>
</body>
</html>
HTML
fi

cat > README-QUOTE-MANAGEMENT.md <<'MD'
# Alanpastt - Gestión de solicitudes

## Archivos creados/actualizados

- `supabase/quote-management.sql`
- `supabase/functions/quote-email/index.ts`
- `src/js/config.js`
- `src/js/main.js`
- `admin/solicitudes.html`
- `admin/assets/solicitudes.js`

## Instalación

1. Ejecutar `supabase/quote-management.sql` en Supabase SQL Editor.
2. Crear usuario admin en Auth y agregarlo a `admin_profiles`.
3. Configurar secrets de Supabase Functions:

```bash
supabase secrets set RESEND_API_KEY="re_xxx"
supabase secrets set FROM_EMAIL="Alanpastt <cotizaciones@alanpastt.cl>"
supabase secrets set SALES_EMAIL="ventas@alanpastt.cl"
supabase secrets set SITE_URL="https://www.alanpastt.cl"
supabase secrets set LOGO_URL="https://www.alanpastt.cl/public/images/logo.png"
```

4. Desplegar la función:

```bash
supabase functions deploy quote-email --no-verify-jwt
```

5. Probar:

```bash
python3 -m http.server 5500
```

Abrir `http://localhost:5500/admin/solicitudes.html`.
MD

echo ""
echo "✅ Gestión avanzada de solicitudes preparada."
echo "Archivos principales:"
echo "- supabase/quote-management.sql"
echo "- supabase/functions/quote-email/index.ts"
echo "- admin/solicitudes.html"
echo "- admin/assets/solicitudes.js"
echo ""
echo "Siguiente paso: ejecutar el SQL en Supabase y desplegar la Edge Function."
