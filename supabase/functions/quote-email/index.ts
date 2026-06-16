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
