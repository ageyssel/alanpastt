const supabaseClient = window.alanpasttSupabase;

let currentUser = null;
let requests = [];
let selectedRequest = null;
let selectedAttachmentIds = new Set();

const els = {
  alert: document.getElementById('alert'),
  list: document.getElementById('requests-list'),
  search: document.getElementById('search-input'),
  empty: document.getElementById('empty-state'),
  panel: document.getElementById('detail-panel'),
  code: document.getElementById('detail-code'),
  name: document.getElementById('detail-name'),
  meta: document.getElementById('detail-meta'),
  message: document.getElementById('detail-message'),
  status: document.getElementById('status-select'),
  notes: document.getElementById('internal-notes'),
  file: document.getElementById('file-input'),
  attachments: document.getElementById('attachments-list'),
  responses: document.getElementById('responses-list'),
  subject: document.getElementById('response-subject'),
  body: document.getElementById('response-body'),
};

function showAlert(message, type = 'success') {
  els.alert.textContent = message;
  els.alert.className = `mb-6 p-4 rounded font-bold ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
  els.alert.classList.remove('hidden');
  setTimeout(() => els.alert.classList.add('hidden'), 5000);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function requireAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) window.location.href = 'login.html';
  currentUser = session.user;
}

function requestCard(item) {
  const active = selectedRequest?.id === item.id;
  return `
    <button data-id="${item.id}" class="request-card w-full text-left p-4 rounded-xl border ${active ? 'border-black bg-yellow-50' : 'border-slate-200 hover:border-alanpastt-amarillo'} transition-all">
      <div class="flex items-center justify-between gap-2">
        <span class="font-black text-xs uppercase tracking-widest text-alanpastt-acento">${item.tracking_code}</span>
        <span class="text-[10px] font-black uppercase px-2 py-1 rounded ${item.estado === 'Nueva' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}">${item.estado}</span>
      </div>
      <div class="font-black text-lg mt-1 truncate">${item.nombre}</div>
      <div class="text-sm text-slate-500 truncate">${item.email}</div>
      <div class="text-xs text-slate-400 mt-2">${formatDate(item.created_at)}</div>
    </button>`;
}

function renderList(data = requests) {
  if (!data.length) {
    els.list.innerHTML = '<p class="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl">No hay solicitudes para mostrar.</p>';
    return;
  }

  els.list.innerHTML = data.map(requestCard).join('');
  document.querySelectorAll('.request-card').forEach(btn => {
    btn.addEventListener('click', () => selectRequest(btn.dataset.id));
  });
}

async function loadRequests() {
  const { data, error } = await supabaseClient
    .from('cotizaciones_entrantes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    showAlert('No se pudieron cargar las solicitudes. Revisa RLS/admin_profiles.', 'error');
    return;
  }

  requests = data || [];
  renderList();
}

async function selectRequest(id) {
  selectedRequest = requests.find(r => r.id === id);
  selectedAttachmentIds.clear();
  if (!selectedRequest) return;

  els.empty.classList.add('hidden');
  els.panel.classList.remove('hidden');
  renderList();

  els.code.textContent = selectedRequest.tracking_code;
  els.name.textContent = selectedRequest.nombre;
  els.meta.textContent = `${selectedRequest.email}${selectedRequest.telefono ? ' · ' + selectedRequest.telefono : ''} · ${formatDate(selectedRequest.created_at)}`;
  els.message.textContent = selectedRequest.mensaje || '';
  els.status.value = selectedRequest.estado || 'Nueva';
  els.notes.value = selectedRequest.internal_notes || '';
  els.subject.value = `Respuesta a tu solicitud ${selectedRequest.tracking_code}`;
  els.body.value = `Hola ${selectedRequest.nombre},\n\nGracias por contactar a Alanpastt. Revisamos tu solicitud y te compartimos la siguiente respuesta:\n\n`;

  await Promise.all([loadAttachments(), loadResponses()]);
}

async function updateQuote(fields) {
  if (!selectedRequest) return;
  const { error } = await supabaseClient
    .from('cotizaciones_entrantes')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', selectedRequest.id);

  if (error) throw error;
  Object.assign(selectedRequest, fields);
  requests = requests.map(r => r.id === selectedRequest.id ? selectedRequest : r);
  renderList();
}

async function loadAttachments() {
  const { data, error } = await supabaseClient
    .from('quote_attachments')
    .select('*')
    .eq('quote_id', selectedRequest.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    els.attachments.innerHTML = '<p class="text-red-600 text-sm font-bold">No se pudieron cargar adjuntos.</p>';
    return;
  }

  if (!data?.length) {
    els.attachments.innerHTML = '<p class="text-slate-500 text-sm">Sin archivos adjuntos.</p>';
    return;
  }

  els.attachments.innerHTML = data.map(file => `
    <label class="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded border">
      <span class="min-w-0">
        <span class="block font-bold truncate">${file.file_name}</span>
        <span class="block text-xs text-slate-500">${formatDate(file.created_at)}</span>
      </span>
      <input type="checkbox" class="attachment-check h-5 w-5" value="${file.id}" ${selectedAttachmentIds.has(file.id) ? 'checked' : ''}>
    </label>
  `).join('');

  document.querySelectorAll('.attachment-check').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) selectedAttachmentIds.add(input.value);
      else selectedAttachmentIds.delete(input.value);
    });
  });
}

async function loadResponses() {
  const { data, error } = await supabaseClient
    .from('quote_responses')
    .select('*')
    .eq('quote_id', selectedRequest.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    els.responses.innerHTML = '<p class="text-red-600 text-sm font-bold">No se pudo cargar historial.</p>';
    return;
  }

  if (!data?.length) {
    els.responses.innerHTML = '<p class="text-slate-500 text-sm">Sin respuestas enviadas.</p>';
    return;
  }

  els.responses.innerHTML = data.map(item => `
    <article class="bg-slate-50 border rounded-xl p-4">
      <div class="font-black">${item.subject}</div>
      <div class="text-xs text-slate-500 mb-2">${formatDate(item.created_at)} · ${item.sent_to}</div>
      <p class="text-sm whitespace-pre-line line-clamp-4">${item.body}</p>
    </article>
  `).join('');
}

async function uploadFile() {
  if (!selectedRequest || !els.file.files.length) return showAlert('Selecciona un archivo.', 'error');
  const file = els.file.files[0];
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${selectedRequest.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('quote-attachments')
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabaseClient.from('quote_attachments').insert({
    quote_id: selectedRequest.id,
    file_name: file.name,
    file_path: path,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: currentUser.id,
  });

  if (dbError) throw dbError;
  els.file.value = '';
  showAlert('Archivo adjuntado correctamente.');
  await loadAttachments();
}

async function sendResponse() {
  if (!selectedRequest) return;
  const subject = els.subject.value.trim();
  const body = els.body.value.trim();
  if (!subject || !body) return showAlert('Completa asunto y mensaje.', 'error');

  const { data: { session } } = await supabaseClient.auth.getSession();
  const { data, error } = await supabaseClient.functions.invoke('quote-email', {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: {
      type: 'response',
      quote_id: selectedRequest.id,
      subject,
      body,
      attachment_ids: Array.from(selectedAttachmentIds),
    },
  });

  if (error || data?.error) throw error || new Error(data.error);

  await updateQuote({ estado: 'Respondida', last_response_at: new Date().toISOString() });
  showAlert('Respuesta enviada correctamente.');
  await loadResponses();
}

document.getElementById('refresh-btn').addEventListener('click', loadRequests);
document.getElementById('save-status-btn').addEventListener('click', async () => {
  try {
    await updateQuote({ estado: els.status.value });
    showAlert('Estado actualizado.');
  } catch (error) {
    console.error(error); showAlert('No se pudo actualizar el estado.', 'error');
  }
});
document.getElementById('save-notes-btn').addEventListener('click', async () => {
  try {
    await updateQuote({ internal_notes: els.notes.value });
    showAlert('Notas guardadas.');
  } catch (error) {
    console.error(error); showAlert('No se pudieron guardar las notas.', 'error');
  }
});
document.getElementById('upload-file-btn').addEventListener('click', async () => {
  try { await uploadFile(); } catch (error) { console.error(error); showAlert('No se pudo subir el archivo.', 'error'); }
});
document.getElementById('send-response-btn').addEventListener('click', async () => {
  try { await sendResponse(); } catch (error) { console.error(error); showAlert('No se pudo enviar la respuesta.', 'error'); }
});
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
});
els.search.addEventListener('input', () => {
  const term = els.search.value.toLowerCase().trim();
  const filtered = requests.filter(r => [r.nombre, r.email, r.tracking_code, r.estado].join(' ').toLowerCase().includes(term));
  renderList(filtered);
});

(async () => {
  await requireAuth();
  await loadRequests();
})();
