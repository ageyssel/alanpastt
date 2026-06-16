(function () {
  'use strict';

  function getSupabaseClient() {
    if (window.alanpasttSupabase) return window.alanpasttSupabase;

    const config = window.ALANPASTT_CONFIG || {};
    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('Falta configuración de Supabase. Revisa src/js/config.js');
      return null;
    }

    window.alanpasttSupabase = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    return window.alanpasttSupabase;
  }

  function showMessage(element, message) {
    if (!element) return;
    element.textContent = message;
    element.classList.remove('hidden');
  }

  function hideMessage(element) {
    if (!element) return;
    element.classList.add('hidden');
  }

  function createStatusMessage(id, className, text, form) {
    let element = document.getElementById(id);
    if (!element && form) {
      element = document.createElement('div');
      element.id = id;
      element.className = className;
      element.textContent = text;
      form.parentNode.appendChild(element);
    }
    return element;
  }

  function initHeaderShrink() {
    const header = document.getElementById('main-header');
    const logo = document.getElementById('header-logo');
    if (!header || !logo) return;

    const updateHeader = () => {
      if (window.scrollY > 50) {
        header.style.height = '96px';
        logo.style.height = '80px';
        header.classList.add('shadow-2xl');
      } else {
        header.style.height = '192px';
        logo.style.height = '160px';
        header.classList.remove('shadow-2xl');
      }
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  function initQuoteForm() {
    const supabaseClient = getSupabaseClient();
    const form = document.getElementById('form-cotizacion');
    const btnEnviar = document.getElementById('btn-enviar');

    if (!form || !btnEnviar || !supabaseClient) return;

    const msjExito = createStatusMessage(
      'mensaje-exito',
      'hidden mt-6 bg-green-600 text-white font-black p-4 rounded text-center',
      'Solicitud enviada con éxito. Te contactaremos pronto.',
      form
    );

    const msjError = createStatusMessage(
      'mensaje-error',
      'hidden mt-6 bg-red-600 text-white font-black p-4 rounded text-center',
      'Hubo un error al enviar. Intenta nuevamente.',
      form
    );

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      hideMessage(msjExito);
      hideMessage(msjError);

      const formData = {
        nombre: document.getElementById('nombre')?.value?.trim(),
        email: document.getElementById('email')?.value?.trim(),
        telefono: document.getElementById('telefono')?.value?.trim() || null,
        empresa: document.getElementById('empresa')?.value?.trim() || null,
        mensaje: document.getElementById('mensaje')?.value?.trim(),
        estado: 'Nueva'
      };

      if (!formData.nombre || !formData.email || !formData.mensaje) {
        showMessage(msjError, 'Completa nombre, email y mensaje antes de enviar.');
        return;
      }

      const originalText = btnEnviar.textContent;
      btnEnviar.textContent = 'Enviando...';
      btnEnviar.disabled = true;
      btnEnviar.classList.add('opacity-75', 'cursor-not-allowed');

      try {
        const { error } = await supabaseClient
          .from('cotizaciones_entrantes')
          .insert([formData]);

        if (error) throw error;

        form.reset();
        showMessage(msjExito, 'Solicitud enviada con éxito. Te contactaremos pronto.');
      } catch (error) {
        console.error('Error al enviar cotización:', error);
        showMessage(msjError, 'No se pudo enviar la solicitud. Intenta nuevamente o escríbenos por WhatsApp.');
      } finally {
        btnEnviar.textContent = originalText;
        btnEnviar.disabled = false;
        btnEnviar.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHeaderShrink();
    initQuoteForm();
  });
})();
