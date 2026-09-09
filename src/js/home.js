document.addEventListener('DOMContentLoaded', () => {
  const catalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  if (!catalog || !utils) return;

  const imageMap = {
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

  const getImage = (slug) => imageMap[slug] || 'public/images/codimas-category.svg';

  const rail = document.getElementById('category-rail');
  if (rail) {
    const railCategories = catalog.categories.slice(0, 8);
    rail.innerHTML = railCategories.map((category) => `
      <a href="categorias/${category.slug}.html" class="codimas-category-pill">
        <span class="codimas-category-pill-media" style="background-image:url('${getImage(category.slug)}')"></span>
        <strong>${category.title}</strong>
      </a>
    `).join('');
  }

  const featuredSlugs = [
    'conductores-electricos',
    'fijaciones-sujeciones',
    'herramientas-equipos-seguridad',
    'pisos-soluciones-exteriores'
  ];

  const categoriesGrid = document.getElementById('categories-grid');
  if (categoriesGrid) {
    const selected = featuredSlugs.map((slug) => utils.getCategory(slug)).filter(Boolean);
    categoriesGrid.innerHTML = selected.map((category) => `
      <a href="categorias/${category.slug}.html" class="codimas-feature-category">
        <img src="${getImage(category.slug)}" alt="${category.title}" loading="lazy">
        <div class="codimas-feature-category-copy">
          <h3>${category.title}</h3>
          <span>Explorar categoría →</span>
        </div>
      </a>
    `).join('');
  }

  const featuredGrid = document.getElementById('featured-products-grid');
  if (featuredGrid) {
    const featured = catalog.categories.flatMap((category) =>
      category.featuredProducts.slice(0, 1).map((product) => ({
        ...product,
        category: category.title,
        slug: category.slug
      }))
    ).slice(0, 6);

    featuredGrid.innerHTML = featured.map((product) => `
      <article class="codimas-product-card">
        <div class="codimas-product-image">
          <img src="${getImage(product.slug)}" alt="${product.name}" loading="lazy">
        </div>
        <div class="codimas-product-meta">
          <div class="category">${product.category}</div>
          <h3>${product.name}</h3>
          <p>${product.spec}</p>
          <div class="code">Código ref. ${product.code}</div>
        </div>
        <button class="quote-add-btn codimas-btn codimas-btn-dark" data-name="${product.name}" data-code="${product.code}" data-category="${product.category}" data-spec="${product.spec}">Agregar a cotización</button>
      </article>
    `).join('');
  }

  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    servicesGrid.innerHTML = catalog.services.map((service, index) => `
      <article class="codimas-service-card">
        <span class="num">${String(index + 1).padStart(2, '0')}</span>
        <h3>${service.title}</h3>
        <p>${service.text}</p>
        <a href="cotizacion.html?servicio=${encodeURIComponent(service.title)}">Solicitar cotización →</a>
      </article>
    `).join('');
  }

  const brandsGrid = document.getElementById('brands-grid');
  if (brandsGrid) {
    brandsGrid.innerHTML = catalog.brands.map((brand) => `<div class="codimas-brand">${brand}</div>`).join('');
  }

  function wireSearch(formId, inputId, resultsId) {
    const form = document.getElementById(formId);
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    if (!form || !input || !results) return;

    function render(query) {
      const clean = query.trim();
      if (!clean) {
        results.innerHTML = '';
        results.classList.add('hidden');
        return;
      }

      const matches = utils.searchCatalog(clean).slice(0, 8);
      results.classList.remove('hidden');
      results.innerHTML = matches.length
        ? matches.map((category) => `
            <a href="categorias/${category.slug}.html">
              <strong style="display:block;font-size:13px;font-weight:600">${category.title}</strong>
              <span style="display:block;margin-top:4px;color:#6c7076;font-size:12px">${category.short}</span>
            </a>
          `).join('')
        : `<div style="padding:16px;font-size:13px;color:#6c7076">No encontramos coincidencias. Puedes describir el requerimiento en una solicitud de cotización.</div>`;
    }

    input.addEventListener('input', (event) => render(event.target.value));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = input.value.trim();
      const first = utils.searchCatalog(query)[0];
      window.location.href = first
        ? `categorias/${first.slug}.html`
        : `cotizacion.html?busqueda=${encodeURIComponent(query)}`;
    });
  }

  wireSearch('catalog-search-form', 'catalog-search-input', 'catalog-search-results');
  wireSearch('catalog-search-form-mobile', 'catalog-search-input-mobile', 'catalog-search-results-mobile');

  const megaToggle = document.getElementById('mega-toggle');
  const megaMenu = document.getElementById('mega-menu');
  megaToggle?.addEventListener('click', () => {
    const open = megaMenu?.classList.toggle('is-open');
    megaToggle.setAttribute('aria-expanded', String(Boolean(open)));
  });

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (megaMenu && megaToggle && !megaMenu.contains(target) && !megaToggle.contains(target)) {
      megaMenu.classList.remove('is-open');
      megaToggle.setAttribute('aria-expanded', 'false');
    }

    const button = target.closest?.('.quote-add-btn');
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
    setTimeout(() => { window.location.href = 'cotizacion.html'; }, 380);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const footerBottom = document.querySelector('.codimas-footer-bottom');
  if (!footerBottom || footerBottom.querySelector('.codimas-focusone-credit')) return;

  const credit = document.createElement('span');
  credit.className = 'codimas-focusone-credit';
  credit.textContent = 'Sitio diseñado por Focus One SpA';
  footerBottom.appendChild(credit);
});