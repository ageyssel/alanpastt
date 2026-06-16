create or replace function public.get_quote_tracking(
  p_tracking_code text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quote public.cotizaciones_entrantes%rowtype;
  v_responses jsonb;
  v_attachments jsonb;
begin
  select *
  into v_quote
  from public.cotizaciones_entrantes
  where upper(tracking_code) = upper(trim(p_tracking_code))
    and lower(email) = lower(trim(p_email))
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'subject', subject,
        'body', body,
        'created_at', created_at
      )
      order by created_at desc
    ),
    '[]'::jsonb
  )
  into v_responses
  from public.quote_responses
  where quote_id = v_quote.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'file_name', file_name,
        'created_at', created_at
      )
      order by created_at desc
    ),
    '[]'::jsonb
  )
  into v_attachments
  from public.quote_attachments
  where quote_id = v_quote.id;

  return jsonb_build_object(
    'found', true,
    'quote', jsonb_build_object(
      'tracking_code', v_quote.tracking_code,
      'nombre', v_quote.nombre,
      'email', v_quote.email,
      'empresa', v_quote.empresa,
      'mensaje', v_quote.mensaje,
      'estado', v_quote.estado,
      'created_at', v_quote.created_at,
      'last_response_at', v_quote.last_response_at
    ),
    'responses', v_responses,
    'attachments', v_attachments
  );
end;
$$;

grant execute on function public.get_quote_tracking(text, text) to anon;
grant execute on function public.get_quote_tracking(text, text) to authenticated;
