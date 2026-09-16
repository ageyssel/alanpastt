document.addEventListener('DOMContentLoaded', async () => {
  const fallbackCatalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  if (!fallbackCatalog || !utils) return;

  let site = window.CODIMAS_CMS || null;
  try { if (window.CODIMAS_CMS_READY) site = await window.CODIMAS_CMS_READY; } catch (_) {}

  const catalog = {
    ...fallbackCatalog,
    categories: site?.catalog?.categories?.length ? site.catalog.categories : fallbackCatalog.categories,
    services: site?.catalog?.services?.length ? site.catalog.services : fallbackCatalog.services,
    brands: site?.catalog?.brands?.length ? site.catalog.brands : fallbackCatalog.brands
  };

  const defaultImages = {
    'conductores-electricos': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=82',
    'modulos-placas-citofonia': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=82',
    'cajas-gabinetes-protecciones': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=82',
    'canalizacion-bandejas-portaconductores': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=82',
    'enchufes-iluminacion': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=900&q=82',
    'fijaciones-sujeciones': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=82',
    'herramientas-equipos-seguridad': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=82',
    'embalaje-suministros': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=82',
    'sellantes-adhesivos-pinturas-aerosoles': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=82',
    'mallas-cercos-alambres': 'https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?auto=format&fit=crop&w=900&q=82',
    'gasfiteria-fitting-jardineria': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=900&q=82',
    'revestimientos-muros-fachadas': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=82',
    'pisos-soluciones-exteriores': 'public/images/piso_goma.jpg'
  };

  const categoryHref = (category) => `categorias/categoria.html?slug=${encodeURIComponent(category.slug)}`;
  const getCategory = (slug) => catalog.categories.find((item) => item.slug === slug);
  const getImage = (itemOrSlug) => {
    const item = typeof itemOrSlug === 'string' ? getCategory(itemOrSlug) : itemOrSlug;
    const slug = typeof itemOrSlug === 'string' ? itemOrSlug : itemOrSlug?.slug;
    return item?.image_url || defaultImages[slug] || 'public/images/codimas-category.svg';
  };

  const megaGrid = document.querySelector('#mega-menu .codimas-mega-grid');
  if (megaGrid) {
    const groups = [...new Set(catalog.categories.map((item) => item.world).filter(Boolean))].slice(0, 4);
    megaGrid.innerHTML = `
      <div><p class="codimas-mega-title">Catálogo Codimas</p><p>Encuentra la línea correcta y solicita una cotización con cantidades, medidas, códigos o especificaciones.</p><a href="cotizacion.html" class="codimas-btn codimas-btn-primary">Enviar requerimiento</a></div>
      ${groups.map((world) => `<div><h3>${world}</h3>${catalog.categories.filter(c => c.world === world).slice(0, 7).map(c => `<a href="${categoryHref(c)}">${c.title}</a>`).join('')}</div>`).join('')}
    `;
  }

  const rail = document.getElementById('category-rail');
  if (rail) {
    rail.innerHTML = catalog.categories.slice(0, 8).map((category) => `
      <a href="${categoryHref(category)}" class="codimas-category-pill">
        <span class="codimas-category-pill-media" style="background-image:url('${getImage(category)}')"></span>
        <strong>${category.title}</strong>
      </a>`).join('');
  }

  const categoriesGrid = document.getElementById('categories-grid');
  if (categoriesGrid) {
    categoriesGrid.innerHTML = catalog.categories.map((category) => `
      <a href="${categoryHref(category)}" class="codimas-feature-category">
        <img src="${getImage(category)}" alt="${category.title}" loading="lazy">
        <div class="codimas-feature-category-copy"><h3>${category.title}</h3><span>Explorar categoría →</span></div>
      </a>`).join('');
  }

  const featuredGrid = document.getElementById('featured-products-grid');
  if (featuredGrid) {
    const featured = catalog.categories.flatMap((category) =>
      (category.featuredProducts || []).slice(0, 1).map((product) => ({ ...product, category: category.title, slug: category.slug, image_url: product.image_url || category.image_url }))
    ).slice(0, 8);
    featuredGrid.innerHTML = featured.map((product) => `
      <article class="codimas-product-card">
        <div class="codimas-product-image"><img src="${product.image_url || getImage(product.slug)}" alt="${product.name}" loading="lazy"></div>
        <div class="codimas-product-meta"><div class="category">${product.category}</div><h3>${product.name}</h3><p>${product.spec || ''}</p><div class="code">Código ref. ${product.code || 'S/C'}</div></div>
        <button class="quote-add-btn codimas-btn codimas-btn-dark" data-name="${product.name}" data-code="${product.code || ''}" data-category="${product.category}" data-spec="${product.spec || ''}">Agregar a cotización</button>
      </article>`).join('');
  }

  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    servicesGrid.innerHTML = catalog.services.map((service, index) => `
      <article class="codimas-service-card">
        ${service.image_url ? `<img src="${service.image_url}" alt="${service.title}" style="width:100%;aspect-ratio:16/9;object-fit:cover;margin-bottom:18px">` : ''}
        <span class="num">${String(index + 1).padStart(2, '0')}</span><h3>${service.title}</h3><p>${service.text || ''}</p><a href="cotizacion.html?servicio=${encodeURIComponent(service.title)}">Solicitar cotización →</a>
      </article>`).join('');
  }

  const brandsGrid = document.getElementById('brands-grid');
  if (brandsGrid) brandsGrid.innerHTML = catalog.brands.map((brand) => `<div class="codimas-brand">${typeof brand === 'string' ? brand : brand.name}</div>`).join('');

  function searchCatalog(query) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return [];
    return catalog.categories.filter((category) => {
      const productText = (category.featuredProducts || []).map((p) => `${p.name} ${p.brand} ${p.code} ${p.spec}`).join(' ');
      const haystack = `${category.title} ${category.world} ${category.short || ''} ${category.description || ''} ${(category.subcategories || []).join(' ')} ${productText}`.toLowerCase();
      return haystack.includes(needle);
    });
  }

  function wireSearch(formId, inputId, resultsId) {
    const form = document.getElementById(formId), input = document.getElementById(inputId), results = document.getElementById(resultsId);
    if (!form || !input || !results) return;
    function render(query) {
      const clean = query.trim();
      if (!clean) { results.innerHTML = ''; results.classList.add('hidden'); return; }
      const matches = searchCatalog(clean).slice(0, 8);
      results.classList.remove('hidden');
      results.innerHTML = matches.length ? matches.map((category) => `<a href="${categoryHref(category)}"><strong style="display:block;font-size:13px;font-weight:600">${category.title}</strong><span style="display:block;margin-top:4px;color:#6c7076;font-size:12px">${category.short || ''}</span></a>`).join('') : `<div style="padding:16px;font-size:13px;color:#6c7076">No encontramos coincidencias. Puedes describir el requerimiento en una solicitud de cotización.</div>`;
    }
    input.addEventListener('input', (event) => render(event.target.value));
    form.addEventListener('submit', (event) => { event.preventDefault(); const query = input.value.trim(); const first = searchCatalog(query)[0]; window.location.href = first ? categoryHref(first) : `cotizacion.html?busqueda=${encodeURIComponent(query)}`; });
  }

  wireSearch('catalog-search-form', 'catalog-search-input', 'catalog-search-results');
  wireSearch('catalog-search-form-mobile', 'catalog-search-input-mobile', 'catalog-search-results-mobile');

  const megaToggle = document.getElementById('mega-toggle'), megaMenu = document.getElementById('mega-menu');
  megaToggle?.addEventListener('click', () => { const open = megaMenu?.classList.toggle('is-open'); megaToggle.setAttribute('aria-expanded', String(Boolean(open))); });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (megaMenu && megaToggle && !megaMenu.contains(target) && !megaToggle.contains(target)) { megaMenu.classList.remove('is-open'); megaToggle.setAttribute('aria-expanded', 'false'); }
    const button = target.closest?.('.quote-add-btn');
    if (!button) return;
    const item = { name: button.dataset.name, code: button.dataset.code, category: button.dataset.category, spec: button.dataset.spec };
    const list = utils.addQuoteItem(item); button.textContent = `Agregado (${list.length})`; button.classList.remove('codimas-btn-dark'); button.classList.add('codimas-btn-primary'); setTimeout(() => { window.location.href = 'cotizacion.html'; }, 380);
  });
});