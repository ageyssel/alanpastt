document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[href*="style.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../src/css/style.css?v=20260909-editorial-1';
    document.head.appendChild(link);
  }

  const slug = document.body.dataset.category;
  const catalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  const category = utils?.getCategory(slug);
  const root = document.getElementById('category-root');

  if (!root || !category || !catalog) {
    if (root) root.innerHTML = '<main style="padding:40px;font-family:Helvetica,Arial,sans-serif">Categoría no encontrada.</main>';
    return;
  }

  const imageMap = {
    'conductores-electricos': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1500&q=85',
    'modulos-placas-citofonia': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1500&q=85',
    'cajas-gabinetes-protecciones': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=85',
    'canalizacion-bandejas-portaconductores': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1500&q=85',
    'enchufes-iluminacion': 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&w=1500&q=85',
    'fijaciones-sujeciones': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1500&q=85',
    'herramientas-equipos-seguridad': 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1500&q=85',
    'embalaje-suministros': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1500&q=85',
    'sellantes-adhesivos-pinturas-aerosoles': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1500&q=85',
    'mallas-cercos-alambres': 'https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?auto=format&fit=crop&w=1500&q=85',
    'gasfiteria-fitting-jardineria': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1500&q=85',
    'revestimientos-muros-fachadas': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1500&q=85',
    'pisos-soluciones-exteriores': '../public/images/piso_goma.jpg'
  };

  const heroImage = imageMap[category.slug] || '../public/images/codimas-category.svg';
  const related = catalog.categories.filter((item) => item.slug !== category.slug && item.world === category.world).slice(0, 4);

  root.innerHTML = `
    <header class="codimas-main-header">
      <div class="codimas-topbar">
        <div class="codimas-shell">
          <div class="codimas-topbar-links"><span class="hide-mobile">Productos para profesionales y empresas</span><a href="../index.html#empresas">Venta empresas</a></div>
          <div class="codimas-topbar-links"><a href="../seguimiento.html">Seguimiento</a><a class="hide-mobile" href="mailto:ventas@codimas.cl">ventas@codimas.cl</a></div>
        </div>
      </div>
      <div class="codimas-shell codimas-header-main" style="grid-template-columns:minmax(180px,250px) 1fr auto">
        <a href="../index.html"><img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="codimas-logo"></a>
        <div></div>
        <div class="codimas-header-actions"><a class="codimas-header-action optional" href="../index.html#categorias">Categorías</a><a class="codimas-btn codimas-btn-dark" href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}">Solicitar cotización</a></div>
      </div>
      <div class="codimas-navbar">
        <div class="codimas-shell codimas-navrow">
          <a href="../index.html#categorias">Productos</a>
          <a href="../index.html#empresas">Empresas</a>
          <a href="../index.html#servicios">Servicios</a>
          <a href="../index.html#marcas">Marcas</a>
          <a href="../index.html#contacto">Contacto</a>
        </div>
      </div>
    </header>

    <main>
      <div class="codimas-breadcrumb"><div class="codimas-shell"><a href="../index.html">Inicio</a> &nbsp;/&nbsp; <a href="../index.html#categorias">Categorías</a> &nbsp;/&nbsp; <strong>${category.title}</strong></div></div>

      <section class="codimas-page-hero">
        <div class="codimas-shell codimas-page-hero-grid">
          <div class="codimas-page-hero-copy">
            <p class="codimas-eyebrow">${category.world} · ${category.number}</p>
            <h1 class="codimas-heading" style="font-size:clamp(52px,6vw,94px);margin-top:18px">${category.title}</h1>
            <p class="codimas-copy" style="margin-top:24px;max-width:680px">${category.description}</p>
            <div class="codimas-hero-actions">
              <a href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}" class="codimas-btn codimas-btn-dark">Cotizar esta categoría</a>
              <a href="#productos" class="codimas-btn codimas-btn-outline">Ver referencias</a>
            </div>
          </div>
          <div class="codimas-page-hero-media" style="background-image:url('${heroImage}')"></div>
        </div>
      </section>

      <section class="codimas-section">
        <div class="codimas-shell">
          <div class="codimas-section-head">
            <div><p class="codimas-eyebrow">Subcategorías</p><h2 class="codimas-section-title">Encuentra la <strong>especificación correcta.</strong></h2></div>
            <p class="codimas-copy" style="max-width:520px;font-size:15px">${category.quoteHint}</p>
          </div>
          <div class="codimas-subcategory-grid">
            ${category.subcategories.map((item) => `<a class="codimas-subcategory-link" href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}&producto=${encodeURIComponent(item)}"><span>${item}</span><span>→</span></a>`).join('')}
          </div>
        </div>
      </section>

      <section id="productos" class="codimas-section" style="background:#f4f4f1">
        <div class="codimas-shell">
          <div class="codimas-section-head">
            <div><p class="codimas-eyebrow">Productos de referencia</p><h2 class="codimas-section-title">Selecciona y <strong>agrega a cotización.</strong></h2></div>
          </div>
          <div class="codimas-feature-categories">
            ${category.featuredProducts.map((product) => `
              <article class="codimas-product-card">
                <div class="codimas-product-image"><img src="${heroImage}" alt="${product.name}" loading="lazy"></div>
                <div class="codimas-product-meta">
                  <div class="category">${product.brand}</div>
                  <h3>${product.name}</h3>
                  <p>${product.spec}</p>
                  <div class="code">Código ref. ${product.code} · Unidad ${product.unit}</div>
                </div>
                <button class="quote-add-btn codimas-btn codimas-btn-dark" data-name="${product.name}" data-code="${product.code}" data-category="${category.title}" data-spec="${product.spec}">Agregar a cotización</button>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="codimas-section">
        <div class="codimas-shell">
          <div class="codimas-section-head">
            <div><p class="codimas-eyebrow">Aplicaciones</p><h2 class="codimas-section-title">Pensado para <strong>uso profesional.</strong></h2></div>
          </div>
          <div class="codimas-trust-strip">
            ${category.applications.map((item) => `<div class="codimas-trust-item"><strong>${item}</strong><span>Disponible para evaluar dentro de tu solicitud.</span></div>`).join('')}
          </div>
        </div>
      </section>

      ${related.length ? `
      <section class="codimas-section" style="background:#f4f4f1">
        <div class="codimas-shell">
          <div class="codimas-section-head"><div><p class="codimas-eyebrow">También puede interesarte</p><h2 class="codimas-section-title">Categorías <strong>relacionadas.</strong></h2></div><a class="codimas-link-arrow" href="../index.html#categorias">Ver todas →</a></div>
          <div class="codimas-feature-categories">
            ${related.map((item) => `<a class="codimas-feature-category" href="${item.slug}.html"><img src="${imageMap[item.slug] || '../public/images/codimas-category.svg'}" alt="${item.title}" loading="lazy"><div class="codimas-feature-category-copy"><h3>${item.title}</h3><span>Explorar →</span></div></a>`).join('')}
          </div>
        </div>
      </section>` : ''}

      <section class="codimas-section-compact" style="background:#ffd200">
        <div class="codimas-shell" style="display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap">
          <div><p class="codimas-eyebrow" style="color:#0b0b0d">Cotización</p><h2 class="codimas-section-title" style="margin-top:8px">¿Necesitas esta categoría?</h2></div>
          <a class="codimas-btn codimas-btn-dark" href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}">Enviar solicitud</a>
        </div>
      </section>
    </main>

    <footer class="codimas-footer">
      <div class="codimas-shell">
        <div class="codimas-footer-grid">
          <div><img src="../public/images/codimas-logo-negative.svg" alt="Codimas SpA" class="codimas-footer-logo"><p>Productos, suministros y soluciones.</p></div>
          <div><h3>Productos</h3><a href="../index.html#categorias">Categorías</a><a href="../cotizacion.html">Solicitar cotización</a></div>
          <div><h3>Empresas</h3><a href="../index.html#empresas">Abastecimiento</a><a href="../index.html#servicios">Servicios</a></div>
          <div><h3>Ayuda</h3><a href="../seguimiento.html">Seguimiento</a><a href="../index.html#contacto">Contacto</a></div>
          <div><h3>Contacto</h3><a href="mailto:ventas@codimas.cl">ventas@codimas.cl</a><a href="tel:+56933365549">+56 9 3336 5549</a></div>
        </div>
        <div class="codimas-footer-bottom"><span>© 2026 Codimas SpA.</span><span>Chile · Productos, suministros y soluciones.</span><span class="codimas-focusone-credit">Sitio diseñado por Focus One SpA</span></div>
      </div>
    </footer>
  `;

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.quote-add-btn');
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
    setTimeout(() => { window.location.href = '../cotizacion.html'; }, 380);
  });
});