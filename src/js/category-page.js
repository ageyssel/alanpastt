async function ensureCategoryCMS() {
  const load = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  if (!window.supabase) await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  if (!window.ALANPASTT_CONFIG) await load('../src/js/config.js');
  if (!window.CODIMAS_CMS_DEFAULTS) await load('../src/js/cms-defaults.js?v=20260923-audit-2');
  if (!window.CODIMAS_CMS_READY) await load('../src/js/cms-runtime.js?v=20260923-audit-2');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.querySelector('link[href*="style.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../src/css/style.css?v=20260921-cms-media';
    document.head.appendChild(link);
  }

  try {
    await ensureCategoryCMS();
  } catch (error) {
    console.warn('No se pudo cargar CMS en categoría, usando contenido local.', error);
  }

  const fallbackCatalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  const root = document.getElementById('category-root');
  if (!root || !fallbackCatalog || !utils) return;

  let site = window.CODIMAS_CMS || null;
  try {
    if (window.CODIMAS_CMS_READY) site = await window.CODIMAS_CMS_READY;
  } catch (_) {}

  const params = new URLSearchParams(window.location.search);
  const slug = document.body.dataset.category || params.get('slug') || '';
  const categories = site?.catalog?.categories?.length ? site.catalog.categories : fallbackCatalog.categories;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    root.innerHTML = '<main style="padding:40px;font-family:Helvetica,Arial,sans-serif">Categoría no encontrada.</main>';
    return;
  }

  const defaultImages = {
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
    'pisos-soluciones-exteriores': 'public/images/piso_goma.jpg'
  };

  const esc = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const resolveAsset = (url) => {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^(https?:|data:|blob:|\/\/)/i.test(value) || value.startsWith('/')) return value;
    if (value.startsWith('../')) return value;
    return '../' + value.replace(/^\.\//, '');
  };

  const imageFor = (item) => resolveAsset(item?.image_url || defaultImages[item?.slug] || 'public/images/codimas-category.svg');
  const categoryHref = (item) => `categoria.html?slug=${encodeURIComponent(item.slug)}`;
  const heroImage = imageFor(category);
  const related = categories.filter((item) => item.slug !== category.slug && item.world === category.world).slice(0, 4);
  const global = site?.global || {};
  const nav = site?.navigation || {};
  const ui = site?.category_page || {};

  const quoteUrl = `../cotizacion.html?categoria=${encodeURIComponent(category.title)}`;

  root.innerHTML = `
    <header class="codimas-main-header">
      <div class="codimas-topbar"><div class="codimas-shell"><div class="codimas-topbar-links"><span class="hide-mobile">${esc(global.topbar_left || 'Productos para profesionales y empresas')}</span><a href="../index.html#empresas">${esc(global.topbar_company || 'Venta empresas')}</a></div><div class="codimas-topbar-links"><a href="../seguimiento.html">${esc(nav.tracking || 'Seguimiento')}</a><a class="hide-mobile" href="mailto:${esc(global.sales_email || 'ventas@codimas.cl')}">${esc(global.sales_email || 'ventas@codimas.cl')}</a><a href="../admin/login.html">${esc(nav.admin || 'Administración')}</a></div></div></div>
      <div class="codimas-shell codimas-header-main" style="grid-template-columns:minmax(180px,250px) 1fr auto"><a href="../index.html"><img src="${resolveAsset(global.logo_url || 'public/images/codimas-logo.svg')}" alt="${esc(global.company_name || 'Codimas SpA')}" class="codimas-logo"></a><div></div><div class="codimas-header-actions"><a class="codimas-header-action optional" href="../index.html#categorias">${esc(nav.categories || 'Categorías')}</a><a class="codimas-btn codimas-btn-dark" href="${quoteUrl}">${esc(nav.quote || 'Solicitar cotización')}</a></div></div>
      <div class="codimas-navbar"><div class="codimas-shell codimas-navrow"><a href="../index.html#categorias">${esc(nav.products || 'Productos')}</a><a href="../index.html#empresas">${esc(nav.companies || 'Empresas')}</a><a href="../index.html#servicios">${esc(nav.services || 'Servicios')}</a><a href="../index.html#marcas">${esc(nav.brands || 'Marcas')}</a><a href="../index.html#contacto">${esc(nav.contact || 'Contacto')}</a></div></div>
    </header>

    <main>
      <div class="codimas-breadcrumb"><div class="codimas-shell"><a href="../index.html">${esc(ui.breadcrumb_home || 'Inicio')}</a> &nbsp;/&nbsp; <a href="../index.html#categorias">${esc(ui.breadcrumb_categories || 'Categorías')}</a> &nbsp;/&nbsp; <strong>${esc(category.title)}</strong></div></div>
      <section class="codimas-page-hero"><div class="codimas-shell codimas-page-hero-grid"><div class="codimas-page-hero-copy"><p class="codimas-eyebrow">${esc(category.world)} · ${esc(category.number || '')}</p><h1 class="codimas-heading" style="font-size:clamp(52px,6vw,94px);margin-top:18px">${esc(category.title)}</h1><p class="codimas-copy" style="margin-top:24px;max-width:680px">${esc(category.description || '')}</p><div class="codimas-hero-actions"><a href="${quoteUrl}" class="codimas-btn codimas-btn-dark">${esc(ui.quote_button || 'Cotizar esta categoría')}</a><a href="#productos" class="codimas-btn codimas-btn-outline">${esc(ui.references_button || 'Ver referencias')}</a></div></div><div class="codimas-page-hero-media" style="background-image:url('${heroImage}')"></div></div></section>

      <section class="codimas-section"><div class="codimas-shell"><div class="codimas-section-head"><div><p class="codimas-eyebrow">${esc(ui.subcategories_eyebrow || 'Subcategorías')}</p><h2 class="codimas-section-title">${ui.subcategories_title_html || 'Encuentra la <strong>especificación correcta.</strong>'}</h2></div><p class="codimas-copy" style="max-width:520px;font-size:15px">${esc(category.quoteHint || '')}</p></div><div class="codimas-subcategory-grid">${(category.subcategories || []).map((item) => `<a class="codimas-subcategory-link" href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}&producto=${encodeURIComponent(item)}"><span>${esc(item)}</span><span>→</span></a>`).join('')}</div></div></section>

      <section id="productos" class="codimas-section" style="background:#f4f4f1"><div class="codimas-shell"><div class="codimas-section-head"><div><p class="codimas-eyebrow">${esc(ui.products_eyebrow || 'Productos de referencia')}</p><h2 class="codimas-section-title">${ui.products_title_html || 'Selecciona y <strong>agrega a cotización.</strong>'}</h2></div></div><div class="codimas-feature-categories">${(category.featuredProducts || []).map((product) => `<article class="codimas-product-card"><div class="codimas-product-image"><img src="${resolveAsset(product.image_url) || heroImage}" alt="${esc(product.name)}" loading="lazy"></div><div class="codimas-product-meta"><div class="category">${esc(product.brand || '')}</div><h3>${esc(product.name)}</h3><p>${esc(product.spec || '')}</p><div class="code">Código ref. ${esc(product.code || 'S/C')} · Unidad ${esc(product.unit || 'consultar')}</div></div><button class="quote-add-btn codimas-btn codimas-btn-dark" data-name="${esc(product.name)}" data-code="${esc(product.code || '')}" data-category="${esc(category.title)}" data-spec="${esc(product.spec || '')}">${esc(ui.product_button || 'Agregar a cotización')}</button></article>`).join('')}</div></div></section>

      <section class="codimas-section"><div class="codimas-shell"><div class="codimas-section-head"><div><p class="codimas-eyebrow">${esc(ui.applications_eyebrow || 'Aplicaciones')}</p><h2 class="codimas-section-title">${ui.applications_title_html || 'Pensado para <strong>uso profesional.</strong>'}</h2></div></div><div class="codimas-trust-strip">${(category.applications || []).map((item) => `<div class="codimas-trust-item"><strong>${esc(item)}</strong><span>${esc(ui.application_text || 'Disponible para evaluar dentro de tu solicitud.')}</span></div>`).join('')}</div></div></section>

      ${related.length ? `<section class="codimas-section" style="background:#f4f4f1"><div class="codimas-shell"><div class="codimas-section-head"><div><p class="codimas-eyebrow">${esc(ui.related_eyebrow || 'También puede interesarte')}</p><h2 class="codimas-section-title">${ui.related_title_html || 'Categorías <strong>relacionadas.</strong>'}</h2></div><a class="codimas-link-arrow" href="../index.html#categorias">${esc(ui.related_link || 'Ver todas →')}</a></div><div class="codimas-feature-categories">${related.map((item) => `<a class="codimas-feature-category" href="${categoryHref(item)}"><img src="${imageFor(item)}" alt="${esc(item.title)}" loading="lazy"><div class="codimas-feature-category-copy"><h3>${esc(item.title)}</h3><span>${esc(ui.related_item_link || 'Explorar →')}</span></div></a>`).join('')}</div></div></section>` : ''}

      <section class="codimas-section-compact" style="background:#ffd200"><div class="codimas-shell" style="display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap"><div><p class="codimas-eyebrow" style="color:#0b0b0d">${esc(ui.cta_eyebrow || 'Cotización')}</p><h2 class="codimas-section-title" style="margin-top:8px">${esc(ui.cta_title || '¿Necesitas esta categoría?')}</h2></div><a class="codimas-btn codimas-btn-dark" href="${quoteUrl}">${esc(ui.cta_button || 'Enviar solicitud')}</a></div></section>
    </main>

    <footer class="codimas-footer"><div class="codimas-shell"><div class="codimas-footer-grid"><div><img src="${resolveAsset(global.logo_negative_url || 'public/images/codimas-logo-negative.svg')}" alt="${esc(global.company_name || 'Codimas SpA')}" class="codimas-footer-logo"><p>${esc(global.legal_name || 'Comercializadora, Distribuidora de Materiales y Servicios')}</p><p>${esc(global.tagline || 'Productos, suministros y soluciones.')}</p></div><div><h3>${esc(global.footer_products_title || 'Productos')}</h3><a href="../index.html#categorias">${esc(nav.categories || 'Categorías')}</a><a href="../cotizacion.html">${esc(nav.quote || 'Solicitar cotización')}</a></div><div><h3>${esc(global.footer_companies_title || 'Empresas')}</h3><a href="../index.html#empresas">${esc(global.topbar_company || 'Abastecimiento')}</a><a href="../index.html#servicios">${esc(nav.services || 'Servicios')}</a></div><div><h3>${esc(global.footer_help_title || 'Ayuda')}</h3><a href="../seguimiento.html">${esc(nav.tracking || 'Seguimiento')}</a><a href="../index.html#contacto">${esc(nav.contact || 'Contacto')}</a></div><div><h3>${esc(global.footer_contact_title || 'Contacto')}</h3><a href="mailto:${esc(global.sales_email || 'ventas@codimas.cl')}">${esc(global.sales_email || 'ventas@codimas.cl')}</a><a data-codimas-contact-email href="mailto:${esc(global.contact_email || 'contacto@codimas.cl')}">${esc(global.contact_email || 'contacto@codimas.cl')}</a><a href="tel:${esc((global.phone || '+56933365549').replace(/[^+\d]/g,''))}">${esc(global.phone || '+56 9 3336 5549')}</a><a href="../admin/login.html">${esc(nav.admin || 'Administración')}</a></div></div><div class="codimas-footer-bottom"><span>© 2026 ${esc(global.company_name || 'Codimas SpA')}.</span><span>${esc(global.footer_country || 'Chile · Productos, suministros y soluciones.')}</span><span class="codimas-focusone-credit">${esc(global.developer_credit || 'Sitio diseñado por Focus One SpA')}</span></div></div></footer>
  `;

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.quote-add-btn');
    if (!button) return;
    const item = { name: button.dataset.name, code: button.dataset.code, category: button.dataset.category, spec: button.dataset.spec };
    const list = utils.addQuoteItem(item);
    button.textContent = `Agregado (${list.length})`;
    button.classList.remove('codimas-btn-dark');
    button.classList.add('codimas-btn-primary');
    setTimeout(() => { window.location.href = '../cotizacion.html'; }, 380);
  });
});
