const supabaseClient = window.alanpasttSupabase;

const form = document.getElementById('tracking-form');
const codeInput = document.getElementById('tracking-code');
const emailInput = document.getElementById('tracking-email');
const btn = document.getElementById('tracking-btn');
const alertBox = document.getElementById('tracking-alert');
const result = document.getElementById('tracking-result');

function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `mt-6 p-4 rounded font-bold ${
    type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
  }`;
  alertBox.classList.remove('hidden');
}

function hideAlert() {
  alertBox.classList.add('hidden');
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderTracking(data) {
  const quote = data.quote;
  const responses = data.responses || [];
  const attachments = data.attachments || [];

  document.getElementById('result-code').textContent = quote.tracking_code;
  document.getElementById('result-status').textContent = quote.estado;
  document.getElementById('result-date').textContent = formatDate(quote.created_at);
  document.getElementById('result-message').textContent = quote.mensaje || '';

  document.getElementById('result-responses').innerHTML = responses.length
    ? responses.map(item => `
        <article class="bg-slate-100 rounded-2xl p-5 border border-slate-200">
          <div class="font-black text-black">${escapeHtml(item.subject)}</div>
          <div class="text-xs text-slate-500 mt-1 mb-3">${formatDate(item.created_at)}</div>
          <p class="whitespace-pre-line leading-relaxed">${escapeHtml(item.body)}</p>
        </article>
      `).join('')
    : '<p class="bg-slate-100 rounded-xl p-4 text-slate-500 font-bold">Aún no hay respuestas registradas.</p>';

  document.getElementById('result-attachments').innerHTML = attachments.length
    ? attachments.map(file => `
        <div class="bg-slate-100 rounded-xl p-4 border border-slate-200">
          <div class="font-black">${escapeHtml(file.file_name)}</div>
          <div class="text-xs text-slate-500">${formatDate(file.created_at)}</div>
          <p class="text-xs text-slate-500 mt-2">Si necesitas descargar este archivo, solicita el enlace respondiendo al correo de Alanpastt.</p>
        </div>
      `).join('')
    : '<p class="bg-slate-100 rounded-xl p-4 text-slate-500 font-bold">Sin archivos visibles para esta solicitud.</p>';

  result.classList.remove('hidden');
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get('codigo');
  const email = params.get('email');

  if (codigo) codeInput.value = codigo;
  if (email) emailInput.value = email;

  if (codigo && email) {
    form.requestSubmit();
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideAlert();
  result.classList.add('hidden');

  const code = codeInput.value.trim().toUpperCase();
  const email = emailInput.value.trim().toLowerCase();

  if (!code || !email) {
    showAlert('Ingresa el código de seguimiento y el correo electrónico.');
    return;
  }

  const original = btn.textContent;
  btn.textContent = 'Consultando...';
  btn.disabled = true;

  try {
    const { data, error } = await supabaseClient.rpc('get_quote_tracking', {
      p_tracking_code: code,
      p_email: email
    });

    if (error) throw error;

    if (!data?.found) {
      showAlert('No encontramos una solicitud con esos datos. Revisa el código y el correo ingresado.');
      return;
    }

    renderTracking(data);
  } catch (error) {
    console.error(error);
    showAlert('No se pudo consultar la solicitud. Intenta nuevamente.');
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
});

readParams();
