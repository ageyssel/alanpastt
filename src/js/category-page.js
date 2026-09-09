document.addEventListener('DOMContentLoaded', () => {
  const slug = document.body.dataset.category;
  const catalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  const category = utils?.getCategory(slug);
  const root = document.getElementById('category-root');

  if (!root || !category || !catalog) {
    if (root) root.innerHTML = '<main class="p-10 font-bold">Categoría no encontrada.</main>';
    return;
  }

  const related = catalog.categories
    .filter((item) => item.slug !== category.slug && item.world === category.world)
    .slice(0, 4);

  root.innerHTML = `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div class="codimas-shell py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <a href="../index.html" class="flex items-center gap-4">
          <img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="h-16 w-auto">
        </a>
        <nav class="flex flex-wrap items-center gap-5 text-sm font-black uppercase tracking-wide">
          <a href="../index.html#categorias" class="hover:text-codimas-blue">Categorías</a>
          <a href="../index.html#empresas" class="hover:text-codimas-blue">Empresas</a>
          <a href="../index.html#servicios" class="hover:text-codimas-blue">Servicios</a>
          <a href="../seguimiento.html" class="hover:text-codimas-blue">Seguimiento</a>
          <a href="../cotizacion.html" class="codimas-btn codimas-btn-dark text-xs">Solicitar cotización</a>
        </nav>
      </div>
    </header>

    <main>
      <section class="codimas-technical-panel text-white">
        <div class="codimas-shell py-16 md:py-24 grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-end">
          <div>
            <div class="flex items-center gap-4 mb-8">
              <span class="bg-codimas-yellow text-black px-4 py-2 font-black text-xl">${category.number}</span>
              <span class="text-xs font-black tracking-[0.32em] uppercase text-codimas-yellow">${category.world}</span>
            </div>
            <h1 class="codimas-heading text-5xl md:text-7xl uppercase">${category.title}</h1>
            <p class="text-xl text-slate-300 font-medium leading-relaxed mt-7 max-w-3xl">${category.description}</p>
            <div class="flex flex-col sm:flex-row gap-4 mt-10">
              <a href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}" class="codimas-btn codimas-btn-primary">Cotizar esta categoría</a>
              <a href="#productos" class="codimas-btn codimas-btn-outline text-white">Ver productos de referencia</a>
            </div>
          </div>
          <div class="bg-white text-black p-7 md:p-9">
            <p class="text-xs font-black uppercase tracking-[0.28em] text-codimas-blue">Para cotizar mejor</p>
            <h2 class="text-3xl font-black tracking-tight mt-4">Información recomendada</h2>
            <p class="text-slate-600 font-semibold leading-relaxed mt-4">${category.quoteHint}</p>
            <div class="codimas-rule mt-8"></div>
          </div>
        </div>
      </section>

      <section class="bg-white border-b border-slate-200">
        <div class="codimas-shell py-5 text-sm font-bold text-slate-500">
          <a href="../index.html" class="hover:text-codimas-blue">Inicio</a>
          <span class="mx-2">/</span>
          <a href="../index.html#categorias" class="hover:text-codimas-blue">Categorías</a>
          <span class="mx-2">/</span>
          <span class="text-slate-900">${category.title}</span>
        </div>
      </section>

      <section class="codimas-section bg-slate-50">
        <div class="codimas-shell grid lg:grid-cols-[.75fr_1.25fr] gap-12">
          <div>
            <p class="codimas-label">Subcategorías</p>
            <h2 class="codimas-heading text-4xl md:text-5xl mt-5">Líneas disponibles para cotizar.</h2>
            <p class="text-slate-500 font-semibold leading-relaxed mt-6">El catálogo se presenta como referencia comercial. La disponibilidad, marca, unidad y precio se confirman mediante cotización.</p>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            ${category.subcategories.map((item) => `
              <a href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}&producto=${encodeURIComponent(item)}" class="bg-white border border-slate-200 p-5 font-black hover:border-codimas-blue hover:text-codimas-blue transition-colors flex items-center justify-between gap-4">
                <span>${item}</span><span>→</span>
              </a>
            `).join('')}
          </div>
        </div>
      </section>

      <section id="productos" class="codimas-section bg-white">
        <div class="codimas-shell">
          <div class="max-w-3xl mb-12">
            <p class="codimas-label">Productos de referencia</p>
            <h2 class="codimas-heading text-4xl md:text-5xl mt-5">Solicita cotización por producto, código o requerimiento.</h2>
          </div>
          <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            ${category.featuredProducts.map((product) => `
              <article class="codimas-card p-5 flex flex-col">
                <div class="aspect-square bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
                  <img src="../public/images/codimas-category.svg" alt="${product.name}" class="w-28 opacity-80">
                </div>
                <p class="text-[11px] font-black uppercase tracking-[0.22em] text-codimas-blue">${product.brand}</p>
                <h3 class="text-xl font-black leading-tight mt-2">${product.name}</h3>
                <p class="text-sm text-slate-500 font-bold mt-2">Código ref. ${product.code}</p>
                <p class="text-sm text-slate-600 mt-3 flex-1">${product.spec}</p>
                <p class="text-xs font-black uppercase tracking-wide mt-4 text-slate-400">Unidad: ${product.unit}</p>
                <button class="quote-add-btn codimas-btn codimas-btn-dark text-xs mt-5" data-name="${product.name}" data-code="${product.code}" data-category="${category.title}" data-spec="${product.spec}">Agregar a cotización</button>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="codimas-section bg-slate-950 text-white">
        <div class="codimas-shell grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.28em] text-codimas-yellow">Aplicaciones</p>
            <h2 class="codimas-heading text-4xl md:text-6xl mt-5">Pensado para compra técnica y proyectos.</h2>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            ${category.applications.map((item) => `<div class="border border-white/10 bg-white/5 p-5 font-black">${item}</div>`).join('')}
          </div>
        </div>
      </section>

      <section class="codimas-section bg-white">
        <div class="codimas-shell">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p class="codimas-label">Relacionadas</p>
              <h2 class="codimas-heading text-4xl md:text-5xl mt-5">Otras categorías del mismo mundo.</h2>
            </div>
            <a href="../index.html#categorias" class="codimas-btn codimas-btn-outline">Ver todas</a>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            ${related.map((item) => `
              <a href="${item.slug}.html" class="codimas-card p-6 block">
                <span class="text-2xl font-black text-codimas-blue">${item.number}</span>
                <h3 class="text-xl font-black mt-5 leading-tight">${item.title}</h3>
                <p class="text-sm text-slate-500 font-semibold mt-3">${item.short}</p>
              </a>
            `).join('')}
          </div>
        </div>
      </section>
    </main>

    <footer class="relative bg-black text-gray-400 py-16 border-t border-gray-900">
      <div class="codimas-shell flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div>
          <img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="h-20 bg-white p-3">
          <p class="text-sm mt-5">Comercializadora, Distribuidora de Materiales y Servicios.</p>
        </div>
        <div class="text-sm md:text-right">
          <p class="font-black text-white">ventas@codimas.cl</p>
          <p class="mt-1">Solicitudes, proyectos y abastecimiento.</p>
        </div>
      </div>
      <a href="../admin/login.html" class="absolute left-4 bottom-4 md:left-8 md:bottom-6 text-[10px] uppercase tracking-widest text-gray-600 hover:text-codimas-yellow">Acceso Equipo</a>
    </footer>
  `;

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.quote-add-btn');
    if (!button) return;
    const item = {
      name: button.dataset.name,
      code: button.dataset.code,
      category: button.dataset.category,
      spec: button.dataset.spec
    };
    const list = utils.addQuoteItem(item);
    button.textContent = `Agregado (${list.length})`;
    button.classList.remove('codimas-btn-dark');
    button.classList.add('codimas-btn-primary');
    setTimeout(() => {
      window.location.href = '../cotizacion.html';
    }, 450);
  });
});
