// Usamos un nombre diferente (supabaseClient) para evitar el conflicto
const supabaseUrl = 'https://gpswsmhfrdetvztstnyi.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc3dzbWhmcmRldHZ6dHN0bnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDc1ODUsImV4cCI6MjA5Mjg4MzU4NX0.gxPo5N_cc0uU3CwQCtPrq2WFD1Q6l3i4FSr8XZCV4Lk';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cotizacion');
    const btnEnviar = document.getElementById('btn-enviar');
    
    // Si los mensajes no existen en el HTML, los creamos dinámicamente
    let msjExito = document.getElementById('mensaje-exito');
    let msjError = document.getElementById('mensaje-error');

    if (!msjError && form) {
        msjError = document.createElement('div');
        msjError.id = 'mensaje-error';
        msjError.className = 'hidden mt-6 bg-red-500 text-white font-black p-4 rounded text-center';
        msjError.textContent = 'Hubo un error al enviar. Intenta de nuevo.';
        form.parentNode.appendChild(msjError);
    }
    
    if (!msjExito && form) {
        msjExito = document.createElement('div');
        msjExito.id = 'mensaje-exito';
        msjExito.className = 'hidden mt-6 bg-green-500 text-white font-black p-4 rounded text-center';
        msjExito.textContent = '¡SOLICITUD ENVIADA CON ÉXITO!';
        form.parentNode.appendChild(msjExito);
    }

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const textoOriginal = btnEnviar.innerHTML;
            btnEnviar.innerHTML = 'Enviando...';
            btnEnviar.disabled = true;
            btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');
            
            msjExito.classList.add('hidden');
            msjError.classList.add('hidden');

            const formData = {
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                // Agregamos un campo de estado inicial para tu futuro CRM
                estado: 'Nueva',
                mensaje: document.getElementById('mensaje').value
            };

            try {
                // Paso A: Guardar en Supabase
                const { error } = await supabaseClient
                    .from('cotizaciones_entrantes') // Cambié el nombre de la tabla para el CRM
                    .insert([formData]);

                if (error) throw error;

                // Paso B: Enviar el correo usando EmailJS (Ver instrucciones abajo)
                // Aquí irá el código de EmailJS...

                msjExito.classList.remove('hidden');
                form.reset();
            } catch (error) {
                console.error('Error:', error);
                msjError.classList.remove('hidden');
            } finally {
                btnEnviar.innerHTML = textoOriginal;
                btnEnviar.disabled = false;
                btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }
});