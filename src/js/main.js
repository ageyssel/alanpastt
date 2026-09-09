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
  return `COD-${y}${m}${d}-${random}`;
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

function getQuoteContext() {
  const hidden = document.getElementById('quote-context');
  const fromHidden = hidden?.value?.trim();
  if (fromHidden) return fromHidden;

  try {
    const items = JSON.parse(localStorage.getItem('codimasQuoteItems') || '[]');
    if (!Array.isArray(items) || items.length === 0) return '';
    return [
      'Productos agregados a la solicitud:',
      ...items.map((item, index) => `${index + 1}. ${item.category || 'Categoría'} · ${item.name || 'Producto'} · Código ref. ${item.code || 'S/C'} · ${item.spec || ''}`)
    ].join('\n');
  } catch (_) {
    return '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cotizacion');
  const btnEnviar = document.getElementById('btn-enviar');

  const msjExito = ensureMessage(
    form,
    'mensaje-exito',
    'hidden mt-6 bg-emerald-600 text-white font-black p-4 text-center',
    'Solicitud enviada con éxito. Revisa tu correo para ver el código de seguimiento.'
  );

  const msjError = ensureMessage(
    form,
    'mensaje-error',
    'hidden mt-6 bg-red-600 text-white font-black p-4 text-center',
    'Hubo un error al enviar. Intenta nuevamente.'
  );

  if (!form || !btnEnviar) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.innerHTML = 'Enviando solicitud...';
    btnEnviar.disabled = true;
    btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');
    msjExito.classList.add('hidden');
    msjError.classList.add('hidden');

    const trackingCode = generarCodigoSeguimiento();
    const quoteContext = getQuoteContext();
    const mensajeBase = document.getElementById('mensaje')?.value?.trim() || '';
    const mensajeCompleto = quoteContext ? `${mensajeBase}\n\n${quoteContext}`.trim() : mensajeBase;

    const formData = {
      tracking_code: trackingCode,
      nombre: document.getElementById('nombre')?.value?.trim(),
      email: document.getElementById('email')?.value?.trim(),
      telefono: document.getElementById('telefono')?.value?.trim() || null,
      empresa: document.getElementById('empresa')?.value?.trim() || null,
      mensaje: mensajeCompleto,
      estado: 'Nueva',
    };

    try {
      const { data, error } = await supabaseClient
        .from('cotizaciones_entrantes')
        .insert([formData])
        .select('id, tracking_code, nombre, email, telefono, empresa, mensaje, created_at')
        .single();

      if (error) throw error;

      const { error: fnError } = await supabaseClient.functions.invoke('quote-email', {
        body: { type: 'confirmation', quote: data },
      });

      if (fnError) {
        console.warn('La solicitud fue guardada, pero falló el correo:', fnError);
      }

      localStorage.removeItem('codimasQuoteItems');

      msjExito.innerHTML = `Solicitud enviada correctamente. Tu código de seguimiento es <strong>${data.tracking_code}</strong>. <br><a href="seguimiento.html?codigo=${encodeURIComponent(data.tracking_code)}&email=${encodeURIComponent(data.email)}" class="underline font-black">Hacer seguimiento</a>`;
      msjExito.classList.remove('hidden');
      form.reset();
      window.dispatchEvent(new Event('codimas:quote-cleared'));
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
