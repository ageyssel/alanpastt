// Configuración pública de Supabase.
// La anon key puede estar en navegador si RLS está bien configurado.
// Nunca colocar aquí la service_role key.

window.ALANPASTT_CONFIG = {
  SUPABASE_URL: 'https://gpswsmhfrdetvztstnyi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc3dzbWhmcmRldHZ6dHN0bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDc1ODUsImV4cCI6MjA5Mjg4MzU4NX0.gxPo5N_cc0uU3CwQCtPrq2WFD1Q6l3i4FSr8XZCV4Lk',
  SITE_URL: window.location.origin,

  // Compatibilidad con scripts antiguos del admin
  supabaseUrl: 'https://gpswsmhfrdetvztstnyi.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc3dzbWhmcmRldHZ6dHN0bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDc1ODUsImV4cCI6MjA5Mjg4MzU4NX0.gxPo5N_cc0uU3CwQCtPrq2WFD1Q6l3i4FSr8XZCV4Lk',
  storageBucket: 'alanpastt-assets'
};

window.alanpasttSupabase = window.supabase.createClient(
  window.ALANPASTT_CONFIG.SUPABASE_URL,
  window.ALANPASTT_CONFIG.SUPABASE_ANON_KEY
);
