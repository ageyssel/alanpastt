(function () {
  const catalog = window.CODIMAS_CATALOG;
  const grid = document.getElementById('categories-grid');
  const count = document.getElementById('category-count');

  if (!catalog || !grid) return;
  if (count) count.textContent = catalog.categories.length;

  function escapeHTML(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  grid.innerHTML = catalog.categories.map((category) => `
    <a href="categorias/${category.slug}.html" class="group block rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div class="relative h-44 bg-slate-950 overflow-hidden">
        <img src="public/images/codimas-category.svg" alt="${escapeHTML(category.title)}" class="w-full h-full object-cover opacity-95 group-hover:scale-105 transition-transform duration-500">
        <div class="absolute top-4 left-4 bg-codimas-yellow text-black font-black px-3 py-2 rounded-lg">${category.number}</div>
        <div class="absolute bottom-4 left-4 right-4">
          <p class="text-white/70 text-[10px] font-black uppercase tracking-[0.25em]">Codimas SpA</p>
        </div>
      </div>
      <div class="p-6">
        <h3 class="text-xl font-black uppercase tracking-tight text-black">${escapeHTML(category.title)}</h3>
        <p class="text-slate-600 mt-2 leading-relaxed">${escapeHTML(category.description)}</p>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-4">${escapeHTML(category.types.slice(0, 4).join(' · '))}</p>
        <span class="inline-flex mt-5 text-codimas-blue font-black uppercase text-sm group-hover:translate-x-1 transition-transform">Ver categoría →</span>
      </div>
    </a>
  `).join('');
})();
