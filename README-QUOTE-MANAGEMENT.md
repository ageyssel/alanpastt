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
