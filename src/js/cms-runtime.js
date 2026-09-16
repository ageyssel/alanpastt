(function () {
  'use strict';

  function isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function deepMerge(base, override) {
    if (!isObject(base)) return override === undefined ? base : override;
    const output = { ...base };
    if (!isObject(override)) return output;
    Object.keys(override).forEach((key) => {
      if (Array.isArray(override[key])) output[key] = override[key];
      else if (isObject(override[key]) && isObject(base[key])) output[key] = deepMerge(base[key], override[key]);
      else if (override[key] !== undefined && override[key] !== null) output[key] = override[key];
    });
    return output;
  }

  function qs(selector, root = document) { return root.querySelector(selector); }
  function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
  function setText(selector, value, root = document) { const el = qs(selector, root); if (el && value !== undefined) el.textContent = value; }
  function setHTML(selector, value, root = document) { const el = qs(selector, root); if (el && value !== undefined) el.innerHTML = value; }
  function setHref(selector, value, root = document) { const el = qs(selector, root); if (el && value) el.setAttribute('href', value); }
  function setImage(selector, value, root = document) { const el = qs(selector, root); if (el && value) el.setAttribute('src', value); }
  function setBackground(selector, value, root = document) { const el = qs(selector, root); if (el && value) el.style.backgroundImage = `url("${String(value).replaceAll('"', '\\"')}")`; }

  function applyGlobal(site, root = document) {
    const g = site.global || {};
    qsa('.codimas-logo', root).forEach((img) => { if (g.logo_url) img.src = g.logo_url; });
    qsa('.codimas-footer-logo', root).forEach((img) => { if (g.logo_negative_url) img.src = g.logo_negative_url; });

    const favicon = qs('link[rel*="icon"]', root);
    if (favicon && g.favicon_url) favicon.href = g.favicon_url;

    qsa('a[href^="mailto:"]', root).forEach((link) => {
      if (g.sales_email) {
        link.href = `mailto:${g.sales_email}`;
        if ((link.textContent || '').includes('@')) link.textContent = g.sales_email;
      }
    });
    qsa('a[href^="tel:"]', root).forEach((link) => {
      if (g.phone) {
        link.href = `tel:${g.phone.replace(/[^+\d]/g, '')}`;
        if ((link.textContent || '').trim().startsWith('+')) link.textContent = g.phone;
      }
    });

    const footerBottom = qs('.codimas-footer-bottom', root);
    if (footerBottom && g.developer_credit) {
      let credit = footerBottom.querySelector('.codimas-focusone-credit');
      if (!credit) {
        credit = document.createElement('span');
        credit.className = 'codimas-focusone-credit';
        footerBottom.appendChild(credit);
      }
      credit.textContent = g.developer_credit;
    }
  }

  function applyHome(site) {
    const home = site.home || {};
    const hero = home.hero || {};
    setText('.codimas-hero-copy .codimas-eyebrow', hero.eyebrow);
    setHTML('.codimas-hero-title', hero.title_html);
    setText('.codimas-hero-copy .codimas-copy', hero.subtitle);
    setBackground('.codimas-hero-image', hero.image_url);
    const heroButtons = qsa('.codimas-hero-copy .codimas-hero-actions a');
    if (heroButtons[0]) { heroButtons[0].textContent = hero.primary_text || heroButtons[0].textContent; if (hero.primary_href) heroButtons[0].href = hero.primary_href; }
    if (heroButtons[1]) { heroButtons[1].textContent = hero.secondary_text || heroButtons[1].textContent; if (hero.secondary_href) heroButtons[1].href = hero.secondary_href; }

    qsa('.codimas-benefit-mini').forEach((item, index) => {
      const benefit = home.benefits?.[index];
      if (!benefit) return;
      setText('strong', benefit.title, item);
      setText('span', benefit.text, item);
    });

    const sections = qsa('.codimas-section-head');
    const categoriesHead = sections[0];
    if (categoriesHead) { setText('.codimas-eyebrow', home.categories?.eyebrow, categoriesHead); setHTML('.codimas-section-title', home.categories?.title_html, categoriesHead); }
    const productsHead = sections[1];
    if (productsHead) { setText('.codimas-eyebrow', home.products?.eyebrow, productsHead); setHTML('.codimas-section-title', home.products?.title_html, productsHead); }

    qsa('.codimas-promo').forEach((promoNode, index) => {
      const promo = home.promos?.[index];
      if (!promo) return;
      const image = promoNode.querySelector('img'); if (image && promo.image_url) image.src = promo.image_url;
      setText('.codimas-eyebrow', promo.eyebrow, promoNode);
      setHTML('h3', promo.title_html, promoNode);
      const paragraphs = qsa('.codimas-promo-copy > p', promoNode); if (paragraphs[1] && promo.text !== undefined) paragraphs[1].textContent = promo.text;
      const button = promoNode.querySelector('.codimas-btn'); if (button) { if (promo.button_text) button.textContent = promo.button_text; if (promo.button_href) button.href = promo.button_href; }
    });

    qsa('.codimas-trust-item').forEach((item, index) => {
      const trust = home.trust?.[index];
      if (!trust) return;
      setText('strong', trust.title, item); setText('span', trust.text, item);
    });

    const enterprise = qs('.codimas-enterprise-cta');
    if (enterprise && home.enterprise) {
      const image = enterprise.querySelector('img'); if (image && home.enterprise.image_url) image.src = home.enterprise.image_url;
      setText('.codimas-eyebrow', home.enterprise.eyebrow, enterprise);
      setHTML('h2', home.enterprise.title_html, enterprise);
      setText('.codimas-copy', home.enterprise.text, enterprise);
      const buttons = qsa('.codimas-btn', enterprise);
      if (buttons[0]) { if (home.enterprise.primary_text) buttons[0].textContent = home.enterprise.primary_text; if (home.enterprise.primary_href) buttons[0].href = home.enterprise.primary_href; }
      if (buttons[1]) { if (home.enterprise.secondary_text) buttons[1].textContent = home.enterprise.secondary_text; if (home.enterprise.secondary_href) buttons[1].href = home.enterprise.secondary_href; }
    }

    const services = qs('#servicios');
    if (services && home.services) { setText('.codimas-eyebrow', home.services.eyebrow, services); setHTML('.codimas-section-title', home.services.title_html, services); }
    const brands = qs('#marcas');
    if (brands && home.brands) { setText('.codimas-eyebrow', home.brands.eyebrow, brands); setHTML('.codimas-section-title', home.brands.title_html, brands); setText('.codimas-copy', home.brands.text, brands); }
    const contact = qs('#contacto');
    if (contact && home.contact) {
      setText('.codimas-eyebrow', home.contact.eyebrow, contact);
      setText('.codimas-section-title', home.contact.title, contact);
      const buttons = qsa('.codimas-btn', contact);
      if (buttons[0] && home.contact.primary_text) buttons[0].textContent = home.contact.primary_text;
      if (buttons[1] && home.contact.secondary_text) buttons[1].textContent = home.contact.secondary_text;
    }
  }

  function applyQuote(site) {
    const quote = site.quote || {};
    const hero = qs('.codimas-page-hero');
    if (hero) {
      setText('.codimas-eyebrow', quote.hero_eyebrow, hero);
      setHTML('h1', quote.hero_title_html, hero);
      setText('.codimas-copy', quote.hero_text, hero);
      setBackground('.codimas-page-hero-media', quote.hero_image_url, hero);
    }
    const items = qs('.codimas-quote-layout aside .codimas-panel');
    if (items) setText('h2', quote.items_title, items);
    const formPanel = qs('.codimas-quote-layout > section.codimas-panel');
    if (formPanel) { setText('.codimas-eyebrow', quote.form_eyebrow, formPanel); setHTML('.codimas-section-title', quote.form_title_html, formPanel); }
    const submit = qs('#btn-enviar'); if (submit && quote.submit_text) submit.textContent = quote.submit_text;
  }

  function applyTracking(site) {
    const tracking = site.tracking || {};
    const hero = qs('.codimas-page-hero');
    if (hero) {
      setText('.codimas-eyebrow', tracking.hero_eyebrow, hero);
      setHTML('h1', tracking.hero_title_html, hero);
      setText('.codimas-copy', tracking.hero_text, hero);
      setBackground('.codimas-page-hero-media', tracking.hero_image_url, hero);
    }
    const searchPanel = qs('.tracking-layout aside.codimas-panel');
    if (searchPanel) { setText('.codimas-eyebrow', tracking.search_eyebrow, searchPanel); setHTML('.codimas-section-title', tracking.search_title_html, searchPanel); }
    const button = qs('#tracking-btn'); if (button && tracking.button_text) button.textContent = tracking.button_text;
  }

  async function loadSite() {
    const defaults = window.CODIMAS_CMS_DEFAULTS ? window.CODIMAS_CMS_DEFAULTS() : {};
    const client = window.alanpasttSupabase;
    let site = defaults;

    if (client) {
      try {
        const { data, error } = await client.from('site_content').select('value').eq('key', 'cms_site').maybeSingle();
        if (!error && data?.value) site = deepMerge(defaults, data.value);

        const { data: contact } = await client.from('contact_settings').select('*').eq('id', 1).maybeSingle();
        if (contact) {
          site.global = site.global || {};
          site.global.sales_email = contact.sales_email || site.global.sales_email;
          site.global.phone = contact.whatsapp_number ? `+${contact.whatsapp_number}` : site.global.phone;
          site.global.whatsapp = contact.whatsapp_number || site.global.whatsapp;
        }
      } catch (error) {
        console.warn('CMS público: usando contenido local por error de carga.', error);
      }
    }

    window.CODIMAS_CMS = site;
    applyGlobal(site);

    const path = (location.pathname || '').toLowerCase();
    if (path.endsWith('/cotizacion.html') || path.endsWith('cotizacion.html')) applyQuote(site);
    else if (path.endsWith('/seguimiento.html') || path.endsWith('seguimiento.html')) applyTracking(site);
    else if (!path.includes('/categorias/') && !path.includes('/admin/')) applyHome(site);

    window.dispatchEvent(new CustomEvent('codimas:cms-ready', { detail: site }));
    return site;
  }

  window.CODIMAS_CMS_API = { deepMerge, applyGlobal, applyHome, applyQuote, applyTracking };
  window.CODIMAS_CMS_READY = loadSite();
})();