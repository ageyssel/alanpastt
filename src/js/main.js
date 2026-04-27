// Configuración de Supabase
// Asegúrate de que las credenciales estén correctas en tu entorno o aquí para desarrollo local
const supabaseUrl = 'https://gpswsmhfrdetvztstnyi.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc3dzbWhmcmRldHZ6dHN0bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDc1ODUsImV4cCI6MjA5Mjg4MzU4NX0.gxPo5N_cc0uU3CwQCtPrq2WFD1Q6l3i4FSr8XZCV4Lk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cotizacion');
    const btnEnviar = document.getElementById('btn-enviar');
    const msjExito = document.getElementById('mensaje-exito');
    const msjError = document.getElementById('mensaje-error');

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página se recargue
            
            // Cambiar estado del botón
            const textoOriginal = btnEnviar.innerHTML;
            btnEnviar.innerHTML = 'Enviando...';
            btnEnviar.disabled = true;
            btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');
            
            // Ocultar mensajes previos
            msjExito.classList.add('hidden');
            msjError.classList.add('hidden');

            // Capturar datos
            const formData = {
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                empresa: document.getElementById('empresa').value,
                mensaje: document.getElementById('mensaje').value
            };

            try {
                // Enviar a Supabase
                const { error } = await supabase
                    .from('cotizaciones')
                    .insert([formData]);

                if (error) throw error;

                // Éxito
                msjExito.classList.remove('hidden');
                form.reset(); // Limpiar formulario
            } catch (error) {
                // Error
                console.error('Error al enviar cotización:', error);
                msjError.classList.remove('hidden');
            } finally {
                // Restaurar botón
                btnEnviar.innerHTML = textoOriginal;
                btnEnviar.disabled = false;
                btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }
});