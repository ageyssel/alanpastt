// Configuración pública de Supabase. La anon key es segura en navegador solo si RLS está bien configurado.
window.ALANPASTT_CONFIG = {
  SUPABASE_URL: 'https://gpswsmhfrdetvztstnyi.supabase.co',
  SUPABASE_ANON_KEY: 'REEMPLAZA_CON_TU_SUPABASE_ANON_KEY',
  SITE_URL: window.location.origin
};

window.alanpasttSupabase = window.supabase.createClient(
  window.ALANPASTT_CONFIG.SUPABASE_URL,
  window.ALANPASTT_CONFIG.SUPABASE_ANON_KEY
);
