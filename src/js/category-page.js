(function () {
  const catalog = window.CODIMAS_CATALOG;
  const slug = document.body.dataset.category;
  const category = catalog?.categories?.find((item) => item.slug === slug);
  const root = document.getElementById('category-root');

  function escapeHTML(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  if (!root) return;

  if (!category) {
    document.title = 'Categoría no encontrada | Codimas SpA';
    root.innerHTML = `<main class="min-h-screen flex items-center justify-center p-6"><div class="max-w-xl bg-white rounded-3xl shadow-xl p-10 text-center"><h1 class="text-3xl font-black uppercase">Categoría no encontrada</h1><p class="text-slate-500 mt-3">Vuelve al catálogo para revisar las líneas disponibles.</p><a href="../index.html#categorias" class="inline-flex mt-6 bg-black text-codimas-yellow px-6 py-3 rounded-xl font-black uppercase">Volver</a></div></main>`;
    return;
  }

  document.title = `${category.title} | Codimas SpA`;

  const types = category.types.map((item) => `<li class="flex items-start gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"><span class="mt-1 h-3 w-3 rounded-full bg-codimas-yellow shrink-0"></span><span class="font-bold text-slate-800">${escapeHTML(item)}</span></li>`).join('');
  const products = category.products.map((item) => `<li class="rounded-2xl bg-slate-950 text-white p-5 border-l-8 border-codimas-yellow"><span class="font-black uppercase tracking-tight">${escapeHTML(item)}</span></li>`).join('');

  root.innerHTML = `
    <header class="bg-white border-b-4 border-codimas-yellow sticky top-0 z-50 shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <a href="../index.html" class="flex items-center gap-4"><img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="h-16 md:h-20 w-auto object-contain"></a>
        <nav class="flex flex-wrap items-center gap-4 font-black uppercase text-sm"><a href="../index.html#categorias" class="hover:text-codimas-blue">Categorías</a><a href="../seguimiento.html" class="hover:text-codimas-blue">Seguimiento</a><a href="../index.html#contacto" class="bg-black text-codimas-yellow px-5 py-3 rounded-xl">Cotizar</a></nav>
      </div>
    </header>

    <main>
      <section class="relative overflow-hidden bg-slate-950 text-white">
        <div class="absolute inset-0 opacity-20"><img src="../public/images/codimas-category.svg" alt="" class="w-full h-full object-cover"></div>
        <div class="relative max-w-7xl mx-auto px-4 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex bg-codimas-yellow text-black px-4 py-2 font-black uppercase tracking-[0.25em] text-xs">${category.number}</div>
            <h1 class="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none mt-6">${escapeHTML(category.title)}</h1>
            <p class="text-xl text-slate-300 mt-6 leading-relaxed">${escapeHTML(category.description)}</p>
            <p class="text-sm text-codimas-yellow font-black uppercase tracking-[0.25em] mt-6">${escapeHTML(category.range)}</p>
            <div class="flex flex-col sm:flex-row gap-4 mt-10"><a href="../index.html#contacto" class="bg-codimas-yellow text-black px-8 py-4 rounded-xl font-black uppercase text-center">Solicitar cotización</a><a href="../index.html#categorias" class="border-2 border-white px-8 py-4 rounded-xl font-black uppercase text-center hover:bg-white hover:text-black transition">Volver al catálogo</a></div>
          </div>
          <div class="bg-white rounded-[2rem] p-8 shadow-2xl"><img src="../public/images/codimas-category.svg" alt="${escapeHTML(category.title)}" class="w-full rounded-2xl"></div>
        </div>
      </section>

      <section class="py-20 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4">
          <div class="grid lg:grid-cols-12 gap-10">
            <div class="lg:col-span-7"><p class="text-codimas-blue font-black uppercase tracking-[0.25em] text-xs mb-3">Tipos de productos</p><h2 class="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8">Líneas disponibles</h2><ul class="grid sm:grid-cols-2 gap-4">${types}</ul></div>
            <aside class="lg:col-span-5"><div class="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 sticky top-28"><p class="text-codimas-blue font-black uppercase tracking-[0.25em] text-xs mb-3">Referencias del catálogo</p><h3 class="text-3xl font-black uppercase tracking-tight mb-6">Productos destacados</h3><ul class="space-y-3">${products}</ul><a href="../index.html#contacto" class="mt-8 flex items-center justify-center bg-black text-codimas-yellow py-4 rounded-xl font-black uppercase">Cotizar esta categoría</a></div></aside>
          </div>
        </div>
      </section>
    </main>

    <footer class="relative bg-black text-slate-400 py-16"><div class="max-w-7xl mx-auto px-4 text-center"><img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="h-24 bg-white rounded-2xl p-4 mx-auto"><p class="font-bold text-white uppercase tracking-widest mt-8">© 2026 Codimas SpA</p><p class="text-sm mt-1">Comercializadora, Distribuidora de Materiales y Servicios.</p></div><a href="../admin/login.html" class="absolute left-4 bottom-4 md:left-8 md:bottom-8 inline-flex items-center justify-center border border-gray-700 text-gray-500 hover:text-codimas-yellow hover:border-codimas-yellow px-4 py-2 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors">Acceso Equipo</a></footer>`;
})();
