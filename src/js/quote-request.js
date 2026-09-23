document.addEventListener('DOMContentLoaded', () => {
  const utils = window.CODIMAS_UTILS;
  const itemsRoot = document.getElementById('quote-items-list');
  const emptyRoot = document.getElementById('quote-items-empty');
  const clearBtn = document.getElementById('clear-quote-items');
  const contextInput = document.getElementById('quote-context');
  const textarea = document.getElementById('mensaje');
  const categorySelect = document.getElementById('categoria-interes');

  function esc(value = '') {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      categoria: params.get('categoria') || '',
      producto: params.get('producto') || '',
      tipo: params.get('tipo') || '',
      servicio: params.get('servicio') || '',
      busqueda: params.get('busqueda') || ''
    };
  }

  async function populateCategories() {
    if (!categorySelect) return;
    let site = window.CODIMAS_CMS || null;
    try {
      if (window.CODIMAS_CMS_READY) site = await window.CODIMAS_CMS_READY;
    } catch (_) {}
    const categories = site?.catalog?.categories?.length
      ? site.catalog.categories
      : (window.CODIMAS_CATALOG?.categories || []);
    const placeholder = categorySelect.querySelector('option[value=""]')?.textContent || 'Seleccionar categoría si corresponde';
    categorySelect.innerHTML = '';
    const first = document.createElement('option');
    first.value = '';
    first.textContent = placeholder;
    categorySelect.appendChild(first);
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.title;
      option.textContent = category.title;
      categorySelect.appendChild(option);
    });
  }

  function buildContext(items) {
    const params = getParams();
    const lines = [];

    if (params.categoria) lines.push(`Categoría de interés: ${params.categoria}`);
    if (params.producto) lines.push(`Producto / línea consultada: ${params.producto}`);
    if (params.tipo) lines.push(`Tipo de solicitud: ${params.tipo}`);
    if (params.servicio) lines.push(`Servicio consultado: ${params.servicio}`);
    if (params.busqueda) lines.push(`Búsqueda realizada: ${params.busqueda}`);

    if (items.length) {
      lines.push('');
      lines.push('Productos agregados a la solicitud:');
      items.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.category || 'Categoría'} · ${item.name || 'Producto'} · Código ref. ${item.code || 'S/C'} · ${item.spec || ''}`);
      });
    }

    return lines.join('\n').trim();
  }

  function renderItems() {
    const items = utils?.getQuoteItems ? utils.getQuoteItems() : [];
    const context = buildContext(items);

    if (contextInput) contextInput.value = context;

    if (itemsRoot) {
      itemsRoot.innerHTML = items.map((item, index) => `
        <article class="border border-slate-200 bg-white p-4 grid md:grid-cols-[1fr_auto] gap-3 items-start">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.22em] text-codimas-blue">${esc(item.category || 'Producto')}</p>
            <h3 class="font-black text-lg mt-1">${esc(item.name || 'Producto sin nombre')}</h3>
            <p class="text-sm text-slate-500 font-bold mt-1">Código ref. ${esc(item.code || 'S/C')}</p>
            <p class="text-sm text-slate-600 mt-2">${esc(item.spec || '')}</p>
          </div>
          <button type="button" class="remove-quote-item text-xs font-black uppercase tracking-wide border border-slate-300 px-3 py-2 hover:bg-black hover:text-white" data-index="${index}">Quitar</button>
        </article>
      `).join('');
    }

    if (emptyRoot) emptyRoot.classList.toggle('hidden', items.length > 0);

    const params = getParams();
    if (categorySelect && params.categoria) {
      const exists = Array.from(categorySelect.options).some((option) => option.value === params.categoria);
      if (exists) categorySelect.value = params.categoria;
    }

    if (textarea && context && !textarea.value.trim()) {
      textarea.value = `Hola, necesito cotizar lo siguiente:\n\n${context}\n\nCantidad / medidas / comuna de entrega:`;
    }
  }

  document.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.remove-quote-item');
    if (!removeBtn || !utils) return;

    const index = Number(removeBtn.dataset.index);
    const items = utils.getQuoteItems();
    items.splice(index, 1);
    localStorage.setItem('codimasQuoteItems', JSON.stringify(items));
    renderItems();
  });

  clearBtn?.addEventListener('click', () => {
    utils?.clearQuoteItems?.();
    renderItems();
  });

  categorySelect?.addEventListener('change', () => {
    if (!textarea) return;
    const category = categorySelect.value;
    if (!category) return;
    if (!textarea.value.trim()) {
      textarea.value = `Hola, necesito cotizar productos de la categoría ${category}.\n\nDetalle del requerimiento:\nCantidad aproximada:\nComuna de entrega:`;
    }
  });

  window.addEventListener('codimas:quote-cleared', renderItems);
  (async () => {
    await populateCategories();
    renderItems();
  })();
});
