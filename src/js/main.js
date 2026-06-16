const supabaseClient = window.alanpasttSupabase || window.supabase.createClient(
  window.ALANPASTT_CONFIG.SUPABASE_URL,
  window.ALANPASTT_CONFIG.SUPABASE_ANON_KEY
);

function generarCodigoSeguimiento() {
  const fecha = new Date();
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALP-${y}${m}${d}-${random}`;
}

function ensureMessage(form, id, className, text) {
  let node = document.getElementById(id);
  if (!node && form) {
    node = document.createElement('div');
    node.id = id;
    node.className = className;
    node.textContent = text;
    form.parentNode.appendChild(node);
  }
  return node;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cotizacion');
  const btnEnviar = document.getElementById('btn-enviar');

  const msjExito = ensureMessage(
    form,
    'mensaje-exito',
    'hidden mt-6 bg-green-500 text-white font-black p-4 rounded text-center',
    '¡Solicitud enviada con éxito! Revisa tu correo para ver el código de seguimiento.'
  );

  const msjError = ensureMessage(
    form,
    'mensaje-error',
    'hidden mt-6 bg-red-500 text-white font-black p-4 rounded text-center',
    'Hubo un error al enviar. Intenta nuevamente.'
  );

  if (!form || !btnEnviar) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = 'Enviando...';
    btnEnviar.disabled = true;
    btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');
    msjExito.classList.add('hidden');
    msjError.classList.add('hidden');

    const trackingCode = generarCodigoSeguimiento();

    const formData = {
      tracking_code: trackingCode,
      nombre: document.getElementById('nombre')?.value?.trim(),
      email: document.getElementById('email')?.value?.trim(),
      telefono: document.getElementById('telefono')?.value?.trim() || null,
      empresa: document.getElementById('empresa')?.value?.trim() || null,
      mensaje: document.getElementById('mensaje')?.value?.trim(),
      estado: 'Nueva',
    };

    try {
      const { data, error } = await supabaseClient
        .from('cotizaciones_entrantes')
        .insert([formData])
        .select('id, tracking_code, nombre, email, telefono, empresa, mensaje, created_at')
        .single();

      if (error) throw error;

      // Envía correo de confirmación al cliente y aviso interno a ventas.
      const { error: fnError } = await supabaseClient.functions.invoke('quote-email', {
        body: { type: 'confirmation', quote: data },
      });

      if (fnError) {
        console.warn('La solicitud fue guardada, pero falló el correo:', fnError);
      }

      msjExito.textContent = `¡Solicitud enviada con éxito! Tu código de seguimiento es ${data.tracking_code}. También lo enviamos a tu correo.`;
      msjExito.classList.remove('hidden');
      form.reset();
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      msjError.classList.remove('hidden');
    } finally {
      btnEnviar.innerHTML = textoOriginal;
      btnEnviar.disabled = false;
      btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  });
});
