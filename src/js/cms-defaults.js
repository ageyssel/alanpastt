(function () {
  'use strict';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildDefaults() {
    const catalog = window.CODIMAS_CATALOG || { categories: [], services: [], brands: [], company: {} };

    return {
      global: {
        logo_url: 'public/images/codimas-logo.svg',
        logo_negative_url: 'public/images/codimas-logo-negative.svg',
        favicon_url: 'public/images/codimas-icon.svg',
        company_name: 'Codimas SpA',
        legal_name: 'Comercializadora, Distribuidora de Materiales y Servicios',
        tagline: 'Productos, suministros y soluciones.',
        sales_email: 'ventas@codimas.cl',
        phone: '+56 9 3336 5549',
        whatsapp: '56933365549',
        topbar_left: 'Productos para profesionales y empresas',
        topbar_company: 'Venta empresas',
        topbar_contact: 'Contacto',
        footer_country: 'Chile · Productos, suministros y soluciones.',
        developer_credit: 'Sitio diseñado por Focus One SpA'
      },
      navigation: {
        products: 'Productos',
        categories: 'Categorías',
        companies: 'Empresas',
        services: 'Servicios',
        brands: 'Marcas',
        contact: 'Contacto',
        tracking: 'Seguimiento',
        quote: 'Solicitar cotización'
      },
      home: {
        hero: {
          eyebrow: 'Productos, suministros y soluciones',
          title_html: 'Todo para <strong>instalar, construir y mantener.</strong>',
          subtitle: 'Cotiza materiales técnicos para electricidad, ferretería, construcción, telecomunicaciones, seguridad, pisos y proyectos.',
          image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=88',
          primary_text: 'Explorar catálogo',
          primary_href: '#categorias',
          secondary_text: 'Solicitar cotización',
          secondary_href: 'cotizacion.html'
        },
        benefits: [
          { title: 'Cotización por volumen', text: 'Listados, obras y compras recurrentes.' },
          { title: 'Atención especializada', text: 'Productos, alternativas y requerimientos técnicos.' },
          { title: 'Seguimiento', text: 'Código único para revisar tu solicitud.' }
        ],
        categories: {
          eyebrow: 'Compra por categoría',
          title_html: 'Encuentra la <strong>línea correcta.</strong>'
        },
        promos: [
          {
            eyebrow: 'Proyectos y obras',
            title_html: 'Cotiza tu <strong>listado completo.</strong>',
            text: 'Envía productos, códigos, cantidades, marcas o especificaciones y centraliza el requerimiento.',
            image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=85',
            button_text: 'Enviar listado',
            button_href: 'cotizacion.html?tipo=listado'
          },
          {
            eyebrow: 'Codimas Empresas',
            title_html: 'Abastecimiento <strong>recurrente.</strong>',
            text: 'Compras periódicas para bodega, operación, mantención, contratistas y departamentos de compra.',
            image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=85',
            button_text: 'Ver empresas',
            button_href: '#empresas'
          }
        ],
        products: {
          eyebrow: 'Productos de referencia',
          title_html: 'Selección para <strong>cotizar.</strong>'
        },
        trust: [
          { title: 'Solicitud centralizada', text: 'Productos y servicios en un mismo requerimiento.' },
          { title: 'Código de seguimiento', text: 'Consulta el estado de cada solicitud.' },
          { title: 'Atención empresas', text: 'Cotizaciones por volumen y compras recurrentes.' },
          { title: 'Soporte comercial', text: 'Contacto directo para aclarar especificaciones.' }
        ],
        enterprise: {
          eyebrow: 'Soluciones para empresas',
          title_html: 'Desde una compra puntual hasta el <strong>abastecimiento de un proyecto.</strong>',
          text: 'Solicita cotización por volumen, compra recurrente, obra, reposición o requerimiento técnico.',
          image_url: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1300&q=85',
          primary_text: 'Cotizar como empresa',
          primary_href: 'cotizacion.html?tipo=empresa',
          secondary_text: 'Ver seguimiento',
          secondary_href: 'seguimiento.html'
        },
        services: {
          eyebrow: 'Servicios',
          title_html: 'Productos para el proyecto. <strong>Servicios para ejecutarlo.</strong>'
        },
        brands: {
          eyebrow: 'Marcas y alternativas',
          title_html: 'Trabajamos por <strong>requerimiento técnico.</strong>',
          text: 'La marca final, equivalencia y disponibilidad se confirman al momento de cotizar.'
        },
        contact: {
          eyebrow: 'Contacto comercial',
          title: '¿Tienes un requerimiento?',
          primary_text: 'Solicitar cotización',
          secondary_text: 'ventas@codimas.cl'
        }
      },
      quote: {
        hero_eyebrow: 'Solicitud comercial',
        hero_title_html: 'Cotiza <strong>productos, volumen o proyecto.</strong>',
        hero_text: 'Describe lo que necesitas o agrega productos desde el catálogo. Cada solicitud queda registrada con un código de seguimiento.',
        hero_image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1500&q=85',
        items_title: 'Productos agregados',
        form_eyebrow: 'Formulario',
        form_title_html: 'Datos del <strong>requerimiento.</strong>',
        submit_text: 'Enviar solicitud'
      },
      tracking: {
        hero_eyebrow: 'Seguimiento comercial',
        hero_title_html: 'Consulta el <strong>estado de tu solicitud.</strong>',
        hero_text: 'Ingresa el código recibido por correo y el email utilizado para revisar avances, respuestas y archivos asociados.',
        hero_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1500&q=85',
        search_eyebrow: 'Buscar solicitud',
        search_title_html: 'Código + <strong>correo.</strong>',
        button_text: 'Consultar estado'
      },
      catalog: {
        categories: clone(catalog.categories || []),
        services: clone(catalog.services || []),
        brands: clone(catalog.brands || [])
      }
    };
  }

  window.CODIMAS_CMS_DEFAULTS = buildDefaults;
})();