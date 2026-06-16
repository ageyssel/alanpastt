(function () {
  'use strict';

  const config = window.ALANPASTT_CONFIG || {};
  const supabaseUrl = config.supabaseUrl || config.SUPABASE_URL;
  const supabaseAnonKey = config.supabaseAnonKey || config.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Configuración Supabase faltante:', config);
    throw new Error('Falta configurar Supabase URL o Supabase anon key en src/js/config.js');
  }

  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  const bucket = config.storageBucket || 'alanpastt-assets';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function setStatus(message, type = 'info') {
    const el = $('#status');
    if (!el) return;
    const styles = {
      info: 'bg-slate-100 text-slate-700 border-slate-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      error: 'bg-red-50 text-red-700 border-red-200'
    };
    el.className = `border rounded-lg px-4 py-3 text-sm font-bold ${styles[type] || styles.info}`;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `producto-${Date.now()}`;
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function getSessionOrRedirect() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error || !data.session) {
      window.location.href = 'login.html';
      return null;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('admin_profiles')
      .select('role')
      .eq('user_id', data.session.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== 'admin') {
      await supabaseClient.auth.signOut();
      window.location.href = 'login.html';
      return null;
    }

    return data.session;
  }

  async function initLogin() {
    const form = $('#login-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Validando acceso...', 'info');

      const email = $('#email').value.trim();
      const password = $('#password').value;

      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setStatus('Credenciales inválidas o usuario no autorizado.', 'error');
        return;
      }

      const { data: profile } = await supabaseClient
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'admin') {
        await supabaseClient.auth.signOut();
        setStatus('Este usuario existe, pero no tiene permiso de administrador.', 'error');
        return;
      }

      window.location.href = 'dashboard.html';
    });
  }

  async function initProtectedPage() {
    if (!$('[data-admin-page]')) return;
    const session = await getSessionOrRedirect();
    if (!session) return;

    const userEmail = $('#user-email');
    if (userEmail) userEmail.textContent = session.user.email;

    $$('#logout-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
      });
    });
  }

  async function uploadProductImage(file) {
    if (!file) return null;
    const extension = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function loadProducts() {
    const list = $('#products-list');
    if (!list) return;

    list.innerHTML = '<p class="text-slate-500 font-bold">Cargando productos...</p>';

    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      list.innerHTML = '<p class="text-red-600 font-bold">No se pudieron cargar los productos.</p>';
      return;
    }

    if (!data.length) {
      list.innerHTML = '<p class="text-slate-500 font-bold">No hay productos registrados.</p>';
      return;
    }

    list.innerHTML = data.map((product) => `
      <div class="admin-card bg-white rounded-xl p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div class="flex gap-4">
          <img src="${escapeHTML(product.image_url || '../public/images/logo.png')}" alt="${escapeHTML(product.image_alt || product.title)}" class="w-24 h-24 rounded-lg object-cover bg-slate-100">
          <div>
            <p class="text-xs font-black uppercase ${product.is_active ? 'text-green-600' : 'text-slate-400'}">${product.is_active ? 'Activo' : 'Oculto'} · Orden ${product.sort_order}</p>
            <h3 class="text-xl font-black text-slate-900">${escapeHTML(product.title)}</h3>
            <p class="text-slate-500 text-sm mt-1">${escapeHTML(product.description)}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="edit-product bg-slate-900 text-yellow-300 px-4 py-2 rounded-lg font-black" data-id="${product.id}">Editar</button>
          <button class="delete-product bg-red-600 text-white px-4 py-2 rounded-lg font-black" data-id="${product.id}">Eliminar</button>
        </div>
      </div>
    `).join('');

    $$('.edit-product').forEach((button) => {
      button.addEventListener('click', () => {
        const product = data.find((item) => item.id === button.dataset.id);
        if (!product) return;
        $('#product-id').value = product.id;
        $('#title').value = product.title || '';
        $('#description').value = product.description || '';
        $('#image-url').value = product.image_url || '';
        $('#image-alt').value = product.image_alt || '';
        $('#sort-order').value = product.sort_order || 0;
        $('#is-active').checked = !!product.is_active;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    $$('.delete-product').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
        const { error: deleteError } = await supabaseClient.from('products').delete().eq('id', button.dataset.id);
        if (deleteError) {
          setStatus('No se pudo eliminar el producto.', 'error');
          return;
        }
        setStatus('Producto eliminado correctamente.', 'success');
        await loadProducts();
      });
    });
  }

  async function initProductsPage() {
    const form = $('#product-form');
    if (!form) return;
    await getSessionOrRedirect();
    await loadProducts();

    $('#clear-form').addEventListener('click', () => {
      form.reset();
      $('#product-id').value = '';
      $('#sort-order').value = '0';
      $('#is-active').checked = true;
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Guardando producto...', 'info');

      const id = $('#product-id').value || null;
      const file = $('#image-file').files[0];
      let imageUrl = $('#image-url').value.trim();

      try {
        const uploadedUrl = await uploadProductImage(file);
        if (uploadedUrl) imageUrl = uploadedUrl;

        const payload = {
          title: $('#title').value.trim(),
          description: $('#description').value.trim(),
          image_url: imageUrl || null,
          image_alt: $('#image-alt').value.trim() || $('#title').value.trim(),
          sort_order: Number($('#sort-order').value || 0),
          is_active: $('#is-active').checked
        };

        if (!payload.title || !payload.description) {
          setStatus('Título y descripción son obligatorios.', 'error');
          return;
        }

        let result;
        if (id) {
          result = await supabaseClient.from('products').update(payload).eq('id', id);
        } else {
          payload.slug = `${slugify(payload.title)}-${Date.now()}`;
          result = await supabaseClient.from('products').insert([payload]);
        }

        if (result.error) throw result.error;

        form.reset();
        $('#product-id').value = '';
        $('#is-active').checked = true;
        setStatus('Producto guardado correctamente.', 'success');
        await loadProducts();
      } catch (error) {
        console.error(error);
        setStatus(`No se pudo guardar: ${error.message || 'error desconocido'}`, 'error');
      }
    });
  }

  async function initContentPage() {
    const form = $('#content-form');
    if (!form) return;
    await getSessionOrRedirect();

    const { data, error } = await supabaseClient.from('site_content').select('key,value');
    if (error) {
      setStatus('No se pudo cargar el contenido.', 'error');
      return;
    }

    const content = Object.fromEntries((data || []).map((row) => [row.key, row.value || {}]));
    $('#hero-badge').value = content.hero?.badge || '';
    $('#hero-title-html').value = content.hero?.title_html || '';
    $('#hero-subtitle').value = content.hero?.subtitle || '';
    $('#hero-primary').value = content.hero?.primary_button_text || '';
    $('#hero-secondary').value = content.hero?.secondary_button_text || '';
    $('#products-title').value = content.products_section?.title || '';
    $('#products-subtitle').value = content.products_section?.subtitle || '';
    $('#contact-title-html').value = content.contact_section?.title_html || '';
    $('#contact-subtitle').value = content.contact_section?.subtitle || '';
    $('#footer-brand').value = content.footer?.brand || '';
    $('#developer-label').value = content.footer?.developer_label || '';
    $('#developer-name').value = content.footer?.developer_name || '';
    $('#developer-url').value = content.footer?.developer_url || '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Guardando contenido...', 'info');

      const rows = [
        {
          key: 'hero',
          value: {
            badge: $('#hero-badge').value.trim(),
            title_html: $('#hero-title-html').value.trim(),
            subtitle: $('#hero-subtitle').value.trim(),
            primary_button_text: $('#hero-primary').value.trim(),
            secondary_button_text: $('#hero-secondary').value.trim()
          }
        },
        {
          key: 'products_section',
          value: {
            title: $('#products-title').value.trim(),
            subtitle: $('#products-subtitle').value.trim()
          }
        },
        {
          key: 'contact_section',
          value: {
            title_html: $('#contact-title-html').value.trim(),
            subtitle: $('#contact-subtitle').value.trim()
          }
        },
        {
          key: 'footer',
          value: {
            brand: $('#footer-brand').value.trim(),
            developer_label: $('#developer-label').value.trim(),
            developer_name: $('#developer-name').value.trim(),
            developer_url: $('#developer-url').value.trim()
          }
        }
      ];

      const { error: saveError } = await supabaseClient.from('site_content').upsert(rows, { onConflict: 'key' });
      if (saveError) {
        setStatus(`No se pudo guardar: ${saveError.message}`, 'error');
        return;
      }
      setStatus('Contenido guardado correctamente.', 'success');
    });
  }

  async function initContactPage() {
    const form = $('#contact-form');
    if (!form) return;
    await getSessionOrRedirect();

    const { data, error } = await supabaseClient.from('contact_settings').select('*').eq('id', 1).single();
    if (error) {
      setStatus('No se pudo cargar la configuración de contacto.', 'error');
      return;
    }

    $('#sales-email').value = data.sales_email || '';
    $('#contact-email').value = data.contact_email || '';
    $('#whatsapp-number').value = data.whatsapp_number || '';
    $('#whatsapp-message').value = data.whatsapp_message || '';
    $('#footer-text').value = data.footer_text || '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Guardando contacto...', 'info');

      const payload = {
        id: 1,
        sales_email: $('#sales-email').value.trim(),
        contact_email: $('#contact-email').value.trim(),
        whatsapp_number: $('#whatsapp-number').value.replace(/\D/g, ''),
        whatsapp_message: $('#whatsapp-message').value.trim(),
        footer_text: $('#footer-text').value.trim()
      };

      const { error: saveError } = await supabaseClient.from('contact_settings').upsert([payload], { onConflict: 'id' });
      if (saveError) {
        setStatus(`No se pudo guardar: ${saveError.message}`, 'error');
        return;
      }
      setStatus('Datos de contacto guardados correctamente.', 'success');
    });
  }

  async function initDashboard() {
    const container = $('#cotizaciones-list');
    if (!container) return;
    await getSessionOrRedirect();

    const { data, error } = await supabaseClient
      .from('cotizaciones_entrantes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      container.innerHTML = '<p class="text-red-600 font-bold">No se pudieron cargar las solicitudes.</p>';
      return;
    }

    if (!data.length) {
      container.innerHTML = '<p class="text-slate-500 font-bold">Todavía no hay solicitudes registradas.</p>';
      return;
    }

    container.innerHTML = data.map((item) => `
      <div class="border border-slate-200 rounded-xl p-4 bg-white">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-black text-slate-900">${escapeHTML(item.nombre)}</h3>
          <span class="text-xs font-black bg-yellow-100 text-yellow-800 px-2 py-1 rounded">${escapeHTML(item.estado)}</span>
        </div>
        <p class="text-sm text-slate-500 mt-1">${escapeHTML(item.email)} ${item.telefono ? '· ' + escapeHTML(item.telefono) : ''}</p>
        <p class="text-slate-700 mt-2">${escapeHTML(item.mensaje)}</p>
        <p class="text-xs text-slate-400 mt-2">${new Date(item.created_at).toLocaleString('es-CL')}</p>
      </div>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await initLogin();
    await initProtectedPage();
    await initProductsPage();
    await initContentPage();
    await initContactPage();
    await initDashboard();
  });
})();
