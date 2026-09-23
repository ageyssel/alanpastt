(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const assetUrl = (value) => typeof value === 'string' && value.startsWith('public/') ? `/${value}` : value;

  function migrateLegacyEmails(value) {
    if (typeof value === 'string') return value.replace(/([A-Z0-9._%+-]+)@alanpastt\.cl/gi, '$1@codimas.cl');
    if (Array.isArray(value)) return value.map(migrateLegacyEmails);
    if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, migrateLegacyEmails(item)]));
    return value;
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

  function setText(selector, value, root = document) {
    const element = $(selector, root);
    if (element && value !== undefined) element.textContent = value;
  }

  function setHTML(selector, value, root = document) {
    const element = $(selector, root);
    if (element && value !== undefined) element.innerHTML = value;
  }

  function setBackground(selector, value, root = document) {
    const element = $(selector, root);
    if (element && value) element.style.backgroundImage = `url("${String(value).replaceAll('"', '\\"')}")`;
  }

  function getPathValue(obj, path) {
    return String(path || '').split('.').reduce((value, key) => value?.[key], obj);
  }

  function applyMediaBindings(site, root = document) {
    $$('[data-cms-media]', root).forEach((element) => {
      const value = getPathValue(site, element.dataset.cmsMedia);
      if (value) element.setAttribute('src', assetUrl(value));
    });
    $$('[data-cms-background]', root).forEach((element) => {
      const value = getPathValue(site, element.dataset.cmsBackground);
      if (value) element.style.backgroundImage = `url("${String(assetUrl(value)).replaceAll('"', '\\\"')}")`;
    });
    $$('[data-cms-favicon]', root).forEach((element) => {
      const value = getPathValue(site, element.dataset.cmsFavicon);
      if (value) element.setAttribute('href', assetUrl(value));
    });
  }

  function applyGlobal(site, root = document) {
    const global = site.global || {};
    const navigation = site.navigation || {};

    $$('.codimas-logo', root).forEach((image) => {
      if (global.logo_url) image.src = assetUrl(global.logo_url);
    });
    $$('.codimas-footer-logo', root).forEach((image) => {
      if (global.logo_negative_url) image.src = assetUrl(global.logo_negative_url);
    });

    const favicon = $('link[rel*="icon"]', root);
    if (favicon && global.favicon_url) favicon.href = assetUrl(global.favicon_url);

    const topbar = $('.codimas-topbar', root);
    if (topbar) {
      const intro = $('.hide-mobile', topbar);
      if (intro && global.topbar_left) intro.textContent = global.topbar_left;
      const company = $('a[href*="#empresas"]', topbar);
      if (company && global.topbar_company) company.textContent = global.topbar_company;
      const contact = $('a[href*="#contacto"]', topbar);
      if (contact && global.topbar_contact) contact.textContent = global.topbar_contact;
      const tracking = $('a[href*="seguimiento.html"]', topbar);
      if (tracking && navigation.tracking) tracking.textContent = navigation.tracking;
      const admin = $('a[href*="admin/login.html"]', topbar);
      if (admin && navigation.admin) admin.textContent = navigation.admin;
    }

    $$('a[href^="mailto:"]', root).forEach((link) => {
      if (link.hasAttribute('data-codimas-contact-email')) return;
      if (!global.sales_email) return;
      link.href = `mailto:${global.sales_email}`;
      if ((link.textContent || '').includes('@')) link.textContent = global.sales_email;
    });
    $$('[data-codimas-contact-email]', root).forEach((link) => {
      if (!global.contact_email) return;
      link.href = `mailto:${global.contact_email}`;
      link.textContent = global.contact_email;
    });

    $$('a[href^="tel:"]', root).forEach((link) => {
      if (!global.phone) return;
      link.href = `tel:${global.phone.replace(/[^+\d]/g, '')}`;
      if ((link.textContent || '').trim().startsWith('+')) link.textContent = global.phone;
    });

    const nav = $('.codimas-navrow', root);
    if (nav) {
      const mappings = [
        ['button', navigation.products],
        ['a[href*="#categorias"]', navigation.categories],
        ['a[href*="#empresas"]', navigation.companies],
        ['a[href*="#servicios"]', navigation.services],
        ['a[href*="#marcas"]', navigation.brands],
        ['a[href*="#contacto"]', navigation.contact]
      ];
      mappings.forEach(([selector, value]) => {
        const element = $(selector, nav);
        if (element && value) element.textContent = value;
      });
    }

    $$('.codimas-header-actions a[href*="cotizacion.html"]', root).forEach((link) => {
      if (navigation.quote) link.textContent = navigation.quote;
    });
    $$('a[href*="admin/login.html"]', root).forEach((link) => {
      if (navigation.admin) link.textContent = navigation.admin;
    });

    const footer = $('.codimas-footer', root);
    if (footer) {
      const columns = $$('.codimas-footer-grid > div', footer);
      if (columns[0]) {
        const paragraphs = $$('p', columns[0]);
        if (paragraphs[0] && global.legal_name) paragraphs[0].textContent = global.legal_name;
        if (paragraphs[1] && global.tagline) paragraphs[1].textContent = global.tagline;
        if (paragraphs.length === 1 && global.tagline) paragraphs[0].textContent = global.tagline;
      }

      const footerTitles = [
        global.footer_products_title,
        global.footer_companies_title,
        global.footer_help_title,
        global.footer_contact_title
      ];
      columns.slice(1, 5).forEach((column, index) => {
        const heading = $('h3', column);
        if (heading && footerTitles[index]) heading.textContent = footerTitles[index];
      });

      const footerBottom = $('.codimas-footer-bottom', footer);
      if (footerBottom) {
        const spans = $$('span', footerBottom);
        if (spans[1] && global.footer_country) spans[1].textContent = global.footer_country;
        let credit = $('.codimas-focusone-credit', footerBottom);
        if (!credit) {
          credit = document.createElement('span');
          credit.className = 'codimas-focusone-credit';
          footerBottom.appendChild(credit);
        }
        credit.textContent = global.developer_credit || 'Sitio diseñado por Focus One SpA';
      }
    }
  }

  function applyHome(site) {
    const home = site.home || {};
    const hero = home.hero || {};

    setText('.codimas-hero-copy .codimas-eyebrow', hero.eyebrow);
    setHTML('.codimas-hero-title', hero.title_html);
    setText('.codimas-hero-copy .codimas-copy', hero.subtitle);
    setBackground('.codimas-hero-image', hero.image_url);

    const heroButtons = $$('.codimas-hero-copy .codimas-hero-actions a');
    if (heroButtons[0]) {
      if (hero.primary_text) heroButtons[0].textContent = hero.primary_text;
      if (hero.primary_href) heroButtons[0].href = hero.primary_href;
    }
    if (heroButtons[1]) {
      if (hero.secondary_text) heroButtons[1].textContent = hero.secondary_text;
      if (hero.secondary_href) heroButtons[1].href = hero.secondary_href;
    }

    $$('.codimas-benefit-mini').forEach((node, index) => {
      const item = home.benefits?.[index];
      if (!item) return;
      setText('strong', item.title, node);
      setText('span', item.text, node);
    });

    const sectionHeads = $$('.codimas-section-head');
    if (sectionHeads[0]) {
      setText('.codimas-eyebrow', home.categories?.eyebrow, sectionHeads[0]);
      setHTML('.codimas-section-title', home.categories?.title_html, sectionHeads[0]);
      setText('.codimas-link-arrow', home.categories?.link_text, sectionHeads[0]);
    }
    if (sectionHeads[1]) {
      setText('.codimas-eyebrow', home.products?.eyebrow, sectionHeads[1]);
      setHTML('.codimas-section-title', home.products?.title_html, sectionHeads[1]);
      setText('.codimas-link-arrow', home.products?.link_text, sectionHeads[1]);
    }

    $$('.codimas-promo').forEach((node, index) => {
      const promo = home.promos?.[index];
      if (!promo) return;
      const image = $('img', node);
      if (image && promo.image_url) image.src = promo.image_url;
      setText('.codimas-eyebrow', promo.eyebrow, node);
      setHTML('h3', promo.title_html, node);
      const paragraphs = $$('.codimas-promo-copy > p', node);
      if (paragraphs[1] && promo.text !== undefined) paragraphs[1].textContent = promo.text;
      const button = $('.codimas-btn', node);
      if (button) {
        if (promo.button_text) button.textContent = promo.button_text;
        if (promo.button_href) button.href = promo.button_href;
      }
    });

    $$('.codimas-trust-item').forEach((node, index) => {
      const item = home.trust?.[index];
      if (!item) return;
      setText('strong', item.title, node);
      setText('span', item.text, node);
    });

    const enterprise = $('.codimas-enterprise-cta');
    if (enterprise && home.enterprise) {
      const image = $('img', enterprise);
      if (image && home.enterprise.image_url) image.src = home.enterprise.image_url;
      setText('.codimas-eyebrow', home.enterprise.eyebrow, enterprise);
      setHTML('h2', home.enterprise.title_html, enterprise);
      setText('.codimas-copy', home.enterprise.text, enterprise);
      const buttons = $$('.codimas-btn', enterprise);
      if (buttons[0]) {
        if (home.enterprise.primary_text) buttons[0].textContent = home.enterprise.primary_text;
        if (home.enterprise.primary_href) buttons[0].href = home.enterprise.primary_href;
      }
      if (buttons[1]) {
        if (home.enterprise.secondary_text) buttons[1].textContent = home.enterprise.secondary_text;
        if (home.enterprise.secondary_href) buttons[1].href = home.enterprise.secondary_href;
      }
    }

    const services = $('#servicios');
    if (services && home.services) {
      setText('.codimas-eyebrow', home.services.eyebrow, services);
      setHTML('.codimas-section-title', home.services.title_html, services);
    }

    const brands = $('#marcas');
    if (brands && home.brands) {
      setText('.codimas-eyebrow', home.brands.eyebrow, brands);
      setHTML('.codimas-section-title', home.brands.title_html, brands);
      setText('.codimas-copy', home.brands.text, brands);
    }

    const contact = $('#contacto');
    if (contact && home.contact) {
      setText('.codimas-eyebrow', home.contact.eyebrow, contact);
      setText('.codimas-section-title', home.contact.title, contact);
      const buttons = $$('.codimas-btn', contact);
      if (buttons[0] && home.contact.primary_text) buttons[0].textContent = home.contact.primary_text;
      if (buttons[1]) {
        const isMail = (buttons[1].getAttribute('href') || '').startsWith('mailto:');
        if (isMail && site.global?.sales_email) {
          buttons[1].href = `mailto:${site.global.sales_email}`;
          const configured = String(home.contact.secondary_text || '').trim();
          buttons[1].textContent = configured && !configured.includes('@') ? configured : site.global.sales_email;
        } else if (home.contact.secondary_text) {
          buttons[1].textContent = home.contact.secondary_text;
        }
      }
    }
  }

  function applyQuote(site) {
    const quote = site.quote || {};
    const hero = $('.codimas-page-hero');
    if (hero) {
      setText('.codimas-eyebrow', quote.hero_eyebrow, hero);
      setHTML('h1', quote.hero_title_html, hero);
      setText('.codimas-copy', quote.hero_text, hero);
      setBackground('.codimas-page-hero-media', quote.hero_image_url, hero);
    }

    const breadcrumb = $('.codimas-breadcrumb');
    if (breadcrumb) {
      const link = $('a', breadcrumb);
      const current = $('strong', breadcrumb);
      if (link && quote.breadcrumb_home) link.textContent = quote.breadcrumb_home;
      if (current && quote.breadcrumb_current) current.textContent = quote.breadcrumb_current;
    }

    const aside = $('.codimas-quote-layout aside');
    if (aside) {
      const cards = $$('.codimas-panel', aside);
      const itemsCard = cards[0];
      const helpCard = cards[1];
      if (itemsCard) {
        setText('.codimas-eyebrow', quote.items_eyebrow, itemsCard);
        setText('h2', quote.items_title, itemsCard);
        const clear = $('#clear-quote-items');
        const empty = $('#quote-items-empty');
        if (clear && quote.clear_text) clear.textContent = quote.clear_text;
        if (empty && quote.empty_text) empty.textContent = quote.empty_text;
      }
      if (helpCard) {
        setText('.codimas-eyebrow', quote.help_eyebrow, helpCard);
        const rows = $$('.codimas-panel-body > div > div', helpCard);
        rows.forEach((row, index) => {
          const item = quote.help_items?.[index];
          if (!item) return;
          const strong = $('strong', row);
          if (strong) strong.textContent = item.title;
          const textNode = Array.from(row.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          if (textNode) textNode.textContent = item.text;
        });
      }
    }

    const formPanel = $('.codimas-quote-layout > section.codimas-panel');
    if (formPanel) {
      setText('.codimas-eyebrow', quote.form_eyebrow, formPanel);
      setHTML('.codimas-section-title', quote.form_title_html, formPanel);
    }

    const fields = [
      ['#nombre', quote.name_label, quote.name_placeholder],
      ['#empresa', quote.company_label, quote.company_placeholder],
      ['#email', quote.email_label, quote.email_placeholder],
      ['#telefono', quote.phone_label, quote.phone_placeholder],
      ['#categoria-interes', quote.category_label, quote.category_placeholder],
      ['#mensaje', quote.detail_label, quote.detail_placeholder]
    ];
    fields.forEach(([selector, label, placeholder]) => {
      const field = $(selector);
      if (!field) return;
      const fieldLabel = field.closest('div')?.querySelector('label');
      if (fieldLabel && label) fieldLabel.textContent = label;
      if (field.tagName === 'SELECT') {
        const option = field.querySelector('option[value=""]');
        if (option && placeholder) option.textContent = placeholder;
      } else if (placeholder) {
        field.placeholder = placeholder;
      }
    });

    const submit = $('#btn-enviar');
    if (submit && quote.submit_text) submit.textContent = quote.submit_text;
    const form = $('#form-cotizacion');
    if (form && quote.footer_hint) {
      const paragraphs = $$('p', form);
      const last = paragraphs[paragraphs.length - 1];
      if (last) last.textContent = quote.footer_hint;
    }
  }

  function applyTracking(site) {
    const tracking = site.tracking || {};
    const hero = $('.codimas-page-hero');
    if (hero) {
      setText('.codimas-eyebrow', tracking.hero_eyebrow, hero);
      setHTML('h1', tracking.hero_title_html, hero);
      setText('.codimas-copy', tracking.hero_text, hero);
      setBackground('.codimas-page-hero-media', tracking.hero_image_url, hero);
    }

    const breadcrumb = $('.codimas-breadcrumb');
    if (breadcrumb) {
      const link = $('a', breadcrumb);
      const current = $('strong', breadcrumb);
      if (link && tracking.breadcrumb_home) link.textContent = tracking.breadcrumb_home;
      if (current && tracking.breadcrumb_current) current.textContent = tracking.breadcrumb_current;
    }

    const searchPanel = $('.tracking-layout aside.codimas-panel');
    if (searchPanel) {
      setText('.codimas-eyebrow', tracking.search_eyebrow, searchPanel);
      setHTML('.codimas-section-title', tracking.search_title_html, searchPanel);
      const code = $('#tracking-code');
      const email = $('#tracking-email');
      if (code) {
        const label = code.closest('div')?.querySelector('label');
        if (label && tracking.code_label) label.textContent = tracking.code_label;
        if (tracking.code_placeholder) code.placeholder = tracking.code_placeholder;
      }
      if (email) {
        const label = email.closest('div')?.querySelector('label');
        if (label && tracking.email_label) label.textContent = tracking.email_label;
        if (tracking.email_placeholder) email.placeholder = tracking.email_placeholder;
      }
    }

    const button = $('#tracking-btn');
    if (button && tracking.button_text) button.textContent = tracking.button_text;

    const result = $('#tracking-result');
    if (result) {
      setText('.codimas-eyebrow', tracking.result_eyebrow, result);
      setHTML('.codimas-section-title', tracking.result_title_html, result);
      const headings = $$('h3.text-xs', result);
      [tracking.request_label, tracking.responses_label, tracking.attachments_label].forEach((value, index) => {
        if (headings[index] && value) headings[index].textContent = value;
      });
      const summary = $('aside', result);
      if (summary) {
        const labels = $$('p.text-xs', summary);
        if (labels[0] && tracking.result_code) labels[0].textContent = tracking.result_code;
        if (labels[1] && tracking.result_status) labels[1].textContent = tracking.result_status;
        if (labels[2] && tracking.result_date) labels[2].textContent = tracking.result_date;
      }
    }
  }

  async function loadSite() {
    const defaults = window.CODIMAS_CMS_DEFAULTS ? window.CODIMAS_CMS_DEFAULTS() : {};
    const client = window.alanpasttSupabase;
    let site = defaults;

    if (client) {
      try {
        const [{ data: contentData, error: contentError }, { data: contactData, error: contactError }] = await Promise.all([
          client.from('site_content').select('value').eq('key', 'cms_site').maybeSingle(),
          client.from('contact_settings').select('sales_email,contact_email,whatsapp_number,whatsapp_message,footer_text').eq('id', 1).maybeSingle()
        ]);
        if (!contentError && contentData?.value) site = migrateLegacyEmails(deepMerge(defaults, contentData.value));
        if (!contactError && contactData) {
          site.global = site.global || {};
          if (contactData.sales_email) site.global.sales_email = contactData.sales_email;
          if (contactData.contact_email) site.global.contact_email = contactData.contact_email;
          if (contactData.whatsapp_number) {
            site.global.whatsapp = String(contactData.whatsapp_number).replace(/\D/g, '');
            site.global.phone = '+' + site.global.whatsapp;
          }
          if (contactData.whatsapp_message) site.global.whatsapp_message = contactData.whatsapp_message;
          if (contactData.footer_text) site.global.tagline = contactData.footer_text;
        }
      } catch (error) {
        console.warn('CMS público: usando contenido local.', error);
      }
    }

    site = migrateLegacyEmails(site);
    site.global = site.global || {};
    ['logo_url', 'logo_negative_url', 'favicon_url'].forEach((key) => {
      if (site.global[key]) site.global[key] = assetUrl(site.global[key]);
    });

    window.CODIMAS_CMS = site;
    applyGlobal(site);
    applyMediaBindings(site);

    const path = (location.pathname || '').toLowerCase();
    if (path.endsWith('cotizacion.html')) applyQuote(site);
    else if (path.endsWith('seguimiento.html')) applyTracking(site);
    else if (!path.includes('/categorias/') && !path.includes('/admin/')) applyHome(site);

    window.dispatchEvent(new CustomEvent('codimas:cms-ready', { detail: site }));
    return site;
  }

  window.CODIMAS_CMS_API = { deepMerge, migrateLegacyEmails, applyGlobal, applyMediaBindings, applyHome, applyQuote, applyTracking };
  window.CODIMAS_CMS_READY = loadSite();
})();