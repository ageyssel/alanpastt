# Codimas - Gestión de solicitudes

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
supabase secrets set FROM_EMAIL="Codimas SpA <ventas@codimas.cl>"
supabase secrets set SALES_EMAIL="ventas@codimas.cl"
supabase secrets set SITE_URL="https://codimas.cl"
supabase secrets set LOGO_URL="https://codimas.cl/public/images/codimas-logo.svg"
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
