(function () {
  'use strict';

  function getSupabaseClient() {
    if (window.alanpasttSupabase) return window.alanpasttSupabase;

    const config = window.ALANPASTT_CONFIG || {};
    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('Falta configuración de Supabase. Revisa src/js/config.js');
      return null;
    }

    window.alanpasttSupabase = window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

    return window.alanpasttSupabase;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) element.textContent = value;
  }

  function setHTML(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) element.innerHTML = value;
  }

  function setHref(id, value) {
    const element = document.getElementById(id);
    if (element && value) element.href = value;
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buildWhatsAppUrl(number, message) {
    const cleanNumber = String(number || '').replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message || 'Hola Alanpastt, me gustaría solicitar una cotización.');
    return cleanNumber ? `https://wa.me/${cleanNumber}?text=${encodedMessage}` : '#contacto';
  }

  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid || !Array.isArray(products) || products.length === 0) return;

    grid.innerHTML = products.map((product) => `
      <article class="group cursor-pointer">
        <div class="relative overflow-hidden rounded-lg h-80 mb-6 shadow-xl border-b-8 border-alanpastt-amarillo bg-slate-100">
          <img
            src="${escapeHTML(product.image_url || 'public/images/logo.png')}"
            alt="${escapeHTML(product.image_alt || product.title)}"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          >
        </div>
        <h3 class="text-2xl font-black uppercase text-alanpastt-negro">${escapeHTML(product.title)}</h3>
        <p class="text-slate-600 mt-2 mb-4">${escapeHTML(product.description)}</p>
      </article>
    `).join('');
  }

  async function loadPublicContent() {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    try {
      const [contentResult, productsResult, contactResult] = await Promise.all([
        supabaseClient.from('site_content').select('key,value'),
        supabaseClient.from('products').select('title,description,image_url,image_alt,sort_order').eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabaseClient.from('contact_settings').select('*').eq('id', 1).single()
      ]);

      if (contentResult.error) throw contentResult.error;
      if (productsResult.error) throw productsResult.error;
      if (contactResult.error) throw contactResult.error;

      const content = Object.fromEntries((contentResult.data || []).map((row) => [row.key, row.value || {}]));
      const hero = content.hero || {};
      const productsSection = content.products_section || {};
      const contactSection = content.contact_section || {};
      const footer = content.footer || {};
      const contact = contactResult.data || {};

      document.title = 'Alanpastt | Soluciones de Goma para Seguridad y Construcción';

      setText('hero-badge', hero.badge);
      setHTML('hero-title', hero.title_html);
      setText('hero-subtitle', hero.subtitle);
      setText('btn-catalog', hero.primary_button_text);
      setText('btn-expert', hero.secondary_button_text);

      setText('products-title', productsSection.title);
      setText('products-subtitle', productsSection.subtitle);
      setHTML('contact-title', contactSection.title_html);
      setText('contact-subtitle', contactSection.subtitle);

      renderProducts(productsResult.data || []);

      const whatsappUrl = buildWhatsAppUrl(contact.whatsapp_number, contact.whatsapp_message);
      const salesEmailHref = contact.sales_email ? `mailto:${contact.sales_email}` : '#contacto';
      const contactEmailHref = contact.contact_email ? `mailto:${contact.contact_email}` : '#contacto';

      setText('sales-email-header', contact.sales_email);
      setHref('sales-email-header', salesEmailHref);
      setText('sales-email-contact', contact.sales_email);
      setHref('sales-email-contact', salesEmailHref);
      setText('contact-email', contact.contact_email);
      setHref('contact-email', contactEmailHref);
      setText('contact-whatsapp', contact.whatsapp_number ? `+${contact.whatsapp_number}` : 'WhatsApp');
      setHref('contact-whatsapp', whatsappUrl);
      setHref('hero-whatsapp', whatsappUrl);
      setHref('floating-whatsapp', whatsappUrl);

      setText('footer-year-brand', `© ${new Date().getFullYear()} ${footer.brand || 'Alanpastt'}`);
      setText('footer-text', contact.footer_text);
      setText('developer-label', footer.developer_label);
      setText('developer-name', footer.developer_name);
      setHref('developer-link', footer.developer_url);
    } catch (error) {
      console.error('No se pudo cargar contenido dinámico. Se mantiene contenido de respaldo.', error);
    }
  }

  document.addEventListener('DOMContentLoaded', loadPublicContent);
})();
