// Configuración pública de Supabase. La anon key es segura en navegador solo si RLS está bien configurado.
window.ALANPASTT_CONFIG = {
  SUPABASE_URL: 'https://gpswsmhfrdetvztstnyi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc3dzbWhmcmRldHZ6dHN0bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDc1ODUsImV4cCI6MjA5Mjg4MzU4NX0.gxPo5N_cc0uU3CwQCtPrq2WFD1Q6l3i4FSr8XZCV4Lk',
  SITE_URL: window.location.origin
};

window.alanpasttSupabase = window.supabase.createClient(
  window.ALANPASTT_CONFIG.SUPABASE_URL,
  window.ALANPASTT_CONFIG.SUPABASE_ANON_KEY
);
