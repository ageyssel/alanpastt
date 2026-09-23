-- Codimas: migración de correos desde alanpastt.cl a codimas.cl
-- Ejecutar una vez en Supabase SQL Editor si existen datos históricos previos.

update public.contact_settings
set
  sales_email = regexp_replace(sales_email, '@alanpastt\\.cl$', '@codimas.cl', 'i'),
  contact_email = regexp_replace(contact_email, '@alanpastt\\.cl$', '@codimas.cl', 'i'),
  whatsapp_message = replace(whatsapp_message, 'Alanpastt', 'Codimas'),
  updated_at = now()
where
  sales_email ~* '@alanpastt\\.cl$'
  or contact_email ~* '@alanpastt\\.cl$'
  or whatsapp_message ilike '%Alanpastt%';

update public.site_content
set
  value = replace(value::text, '@alanpastt.cl', '@codimas.cl')::jsonb,
  updated_at = now()
where value::text ilike '%@alanpastt.cl%';

-- Verificación
select id, sales_email, contact_email, whatsapp_message
from public.contact_settings
where id = 1;

select key
from public.site_content
where value::text ilike '%@alanpastt.cl%';
