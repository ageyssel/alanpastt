window.CODIMAS_CATALOG = {
  company: {
    name: 'Codimas SpA',
    legal: 'Comercializadora, Distribuidora de Materiales y Servicios',
    tagline: 'Productos, suministros y soluciones.',
    email: 'ventas@codimas.cl',
    phone: '+56 9 3336 5549',
    whatsapp: '56933365549'
  },
  productWorlds: [
    {
      title: 'Electricidad',
      text: 'Conductores, protecciones, tableros, mecanismos, canalización e iluminación para instalaciones residenciales, comerciales e industriales.',
      links: ['conductores-electricos', 'modulos-placas-citofonia', 'cajas-gabinetes-protecciones', 'canalizacion-bandejas-portaconductores', 'enchufes-iluminacion']
    },
    {
      title: 'Ferretería técnica',
      text: 'Fijaciones, herramientas, adhesivos, aerosoles, mallas, cercos, alambres y suministros para mantenimiento y ejecución.',
      links: ['fijaciones-sujeciones', 'herramientas-equipos-seguridad', 'sellantes-adhesivos-pinturas-aerosoles', 'mallas-cercos-alambres']
    },
    {
      title: 'Construcción y terminaciones',
      text: 'Revestimientos, muros, fachadas, pisos, soluciones exteriores, gasfitería, fitting, jardinería y materiales complementarios.',
      links: ['revestimientos-muros-fachadas', 'pisos-soluciones-exteriores', 'gasfiteria-fitting-jardineria', 'embalaje-suministros']
    }
  ],
  categories: [
    {
      number: '01',
      slug: 'conductores-electricos',
      title: 'Conductores Eléctricos',
      world: 'Electricidad',
      short: 'Cables y conductores para instalaciones residenciales, comerciales e industriales.',
      description: 'Línea de conductores para distribución, alimentación, canalización eléctrica, proyectos industriales y obras de instalación.',
      quoteHint: 'Indica sección, color, tipo de conductor, cantidad de metros o rollos y norma requerida.',
      applications: ['Instalaciones domiciliarias', 'Tableros y alimentación', 'Obras comerciales', 'Canalizaciones industriales'],
      subcategories: ['Alambre NYA H07V-U', 'Conductores libres de halógenos H07Z1-K', 'Conductores RZ1', 'Conductores RVK', 'Conductores monopolares', 'Conductores multipolares', 'Cable de cobre desnudo', 'Conductores preensamblados'],
      featuredProducts: [
        { name: 'Alambre NYA 1.5 mm²', brand: 'Covisa / Madeco', code: 'D05040650', spec: 'Colores azul, blanco, negro, rojo y verde', unit: 'metro / rollo' },
        { name: 'Cable libre de halógenos H07Z1-K 2.5 mm²', brand: 'Covisa / Madeco', code: 'D05500300', spec: 'Uso en instalaciones con exigencia LSZH', unit: 'metro / rollo' },
        { name: 'Conductor RZ1 multipolar', brand: 'Covisa / Madeco', code: 'D05500010', spec: 'Configuraciones 3x1.5, 3x2.5, 4x2.5 y superiores', unit: 'metro' },
        { name: 'Conductor RVK multipolar', brand: 'Covisa / Madeco', code: 'D05489750', spec: 'Cable flexible para alimentación y fuerza', unit: 'metro' }
      ]
    },
    {
      number: '02',
      slug: 'modulos-placas-citofonia',
      title: 'Módulos, Placas y Citofonía',
      world: 'Electricidad',
      short: 'Mecanismos, placas, tomas, interruptores, accesorios y citofonía.',
      description: 'Soluciones para terminaciones eléctricas, control, conectividad de datos y comunicación en viviendas, oficinas y edificios.',
      quoteHint: 'Indica línea, color, cantidad de módulos, tipo de toma o interruptor y terminación requerida.',
      applications: ['Vivienda', 'Oficinas', 'Edificios', 'Reposición y mantención'],
      subcategories: ['Placas modulares', 'Interruptores', 'Tomas de corriente', 'Tomas RJ45 y RJ11', 'Tomas TV', 'Dimmers', 'Zumbadores', 'Citofonía y videoporteros'],
      featuredProducts: [
        { name: 'Nobile placa 1 módulo con soporte', brand: 'Bticino', code: 'A78050018', spec: 'Terminaciones blanco, negro, perla y terra', unit: 'unidad' },
        { name: 'Nobile interruptor 9/12 10A 250 VAC', brand: 'Bticino', code: 'A78070005', spec: 'Formato modular blanco o antracita', unit: 'unidad' },
        { name: 'Nobile toma corriente 10/16A 250 VAC', brand: 'Bticino', code: 'A78070025', spec: 'Uso residencial y comercial', unit: 'unidad' },
        { name: 'Nobile toma datos RJ45 Cat.6', brand: 'Bticino', code: 'A78070040', spec: 'Conectividad estructurada', unit: 'unidad' }
      ]
    },
    {
      number: '03',
      slug: 'cajas-gabinetes-protecciones',
      title: 'Cajas, Gabinetes y Protecciones',
      world: 'Electricidad',
      short: 'Tableros, cajas, gabinetes y elementos de protección eléctrica.',
      description: 'Componentes para montaje, distribución, protección, resguardo y control de instalaciones eléctricas.',
      quoteHint: 'Indica medidas, material, grado de protección, cantidad de módulos, amperaje y aplicación.',
      applications: ['Tableros eléctricos', 'Montaje industrial', 'Protección de circuitos', 'Distribución de energía'],
      subcategories: ['Cajas de derivación', 'Gabinetes metálicos', 'Tableros eléctricos', 'Automáticos', 'Diferenciales', 'Fusibles', 'Canal DIN', 'Protección y control'],
      featuredProducts: [
        { name: 'Gabinete metálico mural', brand: 'Consultar marca', code: 'COT-GAB-MET', spec: 'Distintas medidas y aplicaciones', unit: 'unidad' },
        { name: 'Interruptor automático modular', brand: 'Consultar marca', code: 'COT-AUT-MOD', spec: 'Curvas y amperajes según proyecto', unit: 'unidad' },
        { name: 'Interruptor diferencial', brand: 'Consultar marca', code: 'COT-DIF', spec: 'Protección diferencial para tablero', unit: 'unidad' },
        { name: 'Caja de derivación', brand: 'Consultar marca', code: 'COT-CAJA-DER', spec: 'Uso interior o exterior', unit: 'unidad' }
      ]
    },
    {
      number: '04',
      slug: 'canalizacion-bandejas-portaconductores',
      title: 'Canalización, Bandejas y Portaconductores',
      world: 'Electricidad',
      short: 'Sistemas para ordenar, proteger y distribuir conductores.',
      description: 'Canalización eléctrica para obras, industria, edificios y proyectos que requieren trazado ordenado, seguro y mantenible.',
      quoteHint: 'Indica tipo de canalización, largo, diámetro, material, accesorios y condiciones de instalación.',
      applications: ['Canalización eléctrica', 'Bandejas portaconductores', 'Instalaciones a la vista', 'Proyectos industriales'],
      subcategories: ['Tubos y cañerías', 'Bandejas', 'Escalerillas', 'Canaletas', 'Coplas', 'Curvas', 'Abrazaderas', 'Accesorios de montaje'],
      featuredProducts: [
        { name: 'Bandeja portaconductor', brand: 'Consultar marca', code: 'COT-BANDEJA', spec: 'Tramos y accesorios según trazado', unit: 'tramo' },
        { name: 'Tubo conduit', brand: 'Consultar marca', code: 'COT-CONDUIT', spec: 'PVC o metálico según instalación', unit: 'tira' },
        { name: 'Canaleta técnica', brand: 'Consultar marca', code: 'COT-CANALETA', spec: 'Distribución eléctrica y datos', unit: 'tira' },
        { name: 'Accesorios de canalización', brand: 'Consultar marca', code: 'COT-ACC-CAN', spec: 'Coplas, curvas, uniones y fijaciones', unit: 'unidad' }
      ]
    },
    {
      number: '05',
      slug: 'enchufes-iluminacion',
      title: 'Enchufes e Iluminación',
      world: 'Electricidad',
      short: 'Enchufes, tomas, luminarias y componentes de iluminación.',
      description: 'Productos para energización, puntos de uso e iluminación técnica para espacios residenciales, comerciales y operacionales.',
      quoteHint: 'Indica potencia, formato, temperatura de color, tensión, grado IP y cantidad requerida.',
      applications: ['Iluminación interior', 'Iluminación exterior', 'Puntos eléctricos', 'Locales y oficinas'],
      subcategories: ['Enchufes', 'Tomas industriales', 'Luminarias LED', 'Focos', 'Paneles', 'Ampolletas', 'Sensores', 'Accesorios'],
      featuredProducts: [
        { name: 'Luminaria LED', brand: 'Consultar marca', code: 'COT-LED', spec: 'Potencia y temperatura de color según proyecto', unit: 'unidad' },
        { name: 'Enchufe modular', brand: 'Consultar marca', code: 'COT-ENCH-MOD', spec: 'Formato residencial o comercial', unit: 'unidad' },
        { name: 'Toma industrial', brand: 'Consultar marca', code: 'COT-TOMA-IND', spec: 'Amperaje y polos según requerimiento', unit: 'unidad' },
        { name: 'Foco exterior', brand: 'Consultar marca', code: 'COT-FOCO-EXT', spec: 'IP y flujo luminoso según zona', unit: 'unidad' }
      ]
    },
    {
      number: '06',
      slug: 'fijaciones-sujeciones',
      title: 'Fijaciones y Sujeciones',
      world: 'Ferretería técnica',
      short: 'Anclajes, pernos, tornillos, abrazaderas y elementos de sujeción.',
      description: 'Insumos de fijación para montaje, construcción, mantención industrial, estructuras livianas y terminaciones.',
      quoteHint: 'Indica medida, material, diámetro, largo, tipo de cabeza, aplicación y cantidad.',
      applications: ['Montaje', 'Construcción', 'Mantenimiento', 'Fijación de canalización'],
      subcategories: ['Pernos', 'Tornillos', 'Tarugos', 'Anclajes', 'Abrazaderas', 'Tuercas', 'Golillas', 'Remaches'],
      featuredProducts: [
        { name: 'Perno hexagonal', brand: 'Consultar marca', code: 'COT-PERNO-HEX', spec: 'Distintas medidas y grados', unit: 'unidad / caja' },
        { name: 'Tornillo autoperforante', brand: 'Consultar marca', code: 'COT-TORN-AUTO', spec: 'Para metal, madera o fibrocemento', unit: 'caja' },
        { name: 'Anclaje mecánico', brand: 'Consultar marca', code: 'COT-ANCLAJE', spec: 'Aplicación en hormigón y estructura', unit: 'unidad' },
        { name: 'Abrazadera de fijación', brand: 'Consultar marca', code: 'COT-ABRAZ', spec: 'Canalización, tubería y montaje', unit: 'unidad' }
      ]
    },
    {
      number: '07',
      slug: 'herramientas-equipos-seguridad',
      title: 'Herramientas, Equipos y Seguridad',
      world: 'Ferretería técnica',
      short: 'Herramientas manuales, equipos, EPP y seguridad operacional.',
      description: 'Herramientas y equipamiento para ejecución, mantenimiento, instalación y trabajo seguro en terreno.',
      quoteHint: 'Indica herramienta, uso, marca preferida, cantidad y condiciones de trabajo.',
      applications: ['Instaladores', 'Maestros', 'Bodegas', 'Mantención industrial'],
      subcategories: ['Herramientas manuales', 'Herramientas eléctricas', 'Medición', 'Corte', 'EPP', 'Guantes', 'Lentes', 'Equipos de seguridad'],
      featuredProducts: [
        { name: 'Herramientas manuales', brand: 'Consultar marca', code: 'COT-HERR-MAN', spec: 'Alicates, destornilladores, llaves y set técnico', unit: 'unidad / set' },
        { name: 'Elementos de protección personal', brand: 'Consultar marca', code: 'COT-EPP', spec: 'Guantes, lentes, cascos y seguridad', unit: 'unidad' },
        { name: 'Equipos de medición', brand: 'Consultar marca', code: 'COT-MED', spec: 'Multímetros, detectores y medición técnica', unit: 'unidad' },
        { name: 'Herramientas de corte', brand: 'Consultar marca', code: 'COT-CORTE', spec: 'Discos, hojas y accesorios', unit: 'unidad / caja' }
      ]
    },
    {
      number: '08',
      slug: 'embalaje-suministros',
      title: 'Embalaje y Suministros',
      world: 'Operación',
      short: 'Insumos para logística, protección, operación y abastecimiento.',
      description: 'Productos de apoyo para despacho, bodega, almacenamiento, embalaje, rotulación y continuidad operacional.',
      quoteHint: 'Indica tipo de suministro, medidas, uso, cantidad y frecuencia de compra.',
      applications: ['Bodega', 'Despacho', 'Logística', 'Abastecimiento recurrente'],
      subcategories: ['Cintas', 'Film', 'Cajas', 'Etiquetado', 'Bolsas', 'Suministros de bodega', 'Protección de carga', 'Consumibles'],
      featuredProducts: [
        { name: 'Cinta de embalaje', brand: 'Consultar marca', code: 'COT-CINTA', spec: 'Transparente, café o impresa', unit: 'rollo' },
        { name: 'Film stretch', brand: 'Consultar marca', code: 'COT-FILM', spec: 'Manual o industrial', unit: 'rollo' },
        { name: 'Suministros de bodega', brand: 'Consultar marca', code: 'COT-BODEGA', spec: 'Operación y reposición', unit: 'según producto' },
        { name: 'Protección de carga', brand: 'Consultar marca', code: 'COT-PROT-CARGA', spec: 'Embalaje y transporte', unit: 'unidad' }
      ]
    },
    {
      number: '09',
      slug: 'sellantes-adhesivos-pinturas-aerosoles',
      title: 'Sellantes, Adhesivos, Pinturas y Aerosoles',
      world: 'Ferretería técnica',
      short: 'Químicos, sellos, adhesivos, pinturas técnicas y aerosoles.',
      description: 'Línea para terminaciones, mantención, instalación, reparación, sellado y protección de superficies.',
      quoteHint: 'Indica superficie, uso, color, presentación, rendimiento y cantidad.',
      applications: ['Terminaciones', 'Mantención', 'Reparación', 'Instalaciones'],
      subcategories: ['Siliconas', 'Sellantes', 'Adhesivos', 'Espumas', 'Pinturas', 'Aerosoles', 'Lubricantes', 'Químicos técnicos'],
      featuredProducts: [
        { name: 'Sellante multipropósito', brand: 'Consultar marca', code: 'COT-SELLANTE', spec: 'Interior o exterior según aplicación', unit: 'cartucho' },
        { name: 'Adhesivo de montaje', brand: 'Consultar marca', code: 'COT-ADH-MONT', spec: 'Alta adherencia', unit: 'cartucho' },
        { name: 'Pintura técnica', brand: 'Consultar marca', code: 'COT-PINT', spec: 'Color y rendimiento según superficie', unit: 'galón / lata' },
        { name: 'Aerosol técnico', brand: 'Consultar marca', code: 'COT-AEROSOL', spec: 'Pintura, limpieza o lubricación', unit: 'unidad' }
      ]
    },
    {
      number: '10',
      slug: 'mallas-cercos-alambres',
      title: 'Mallas, Cercos y Alambres',
      world: 'Construcción',
      short: 'Cierre perimetral, mallas, alambres y soluciones de protección.',
      description: 'Soluciones para delimitación, protección, seguridad perimetral, obras, parcelas, bodegas y recintos industriales.',
      quoteHint: 'Indica metros lineales, altura, tipo de malla, calibre, postes y accesorios requeridos.',
      applications: ['Cierres perimetrales', 'Obras', 'Bodegas', 'Terrenos e industria'],
      subcategories: ['Mallas', 'Cercos', 'Alambres', 'Postes', 'Tensores', 'Grapas', 'Alambre de púas', 'Accesorios de instalación'],
      featuredProducts: [
        { name: 'Malla perimetral', brand: 'Consultar marca', code: 'COT-MALLA', spec: 'Altura y calibre según proyecto', unit: 'rollo / metro' },
        { name: 'Alambre galvanizado', brand: 'Consultar marca', code: 'COT-ALAMBRE-GALV', spec: 'Distintos calibres', unit: 'rollo' },
        { name: 'Poste para cerco', brand: 'Consultar marca', code: 'COT-POSTE', spec: 'Metal o madera según instalación', unit: 'unidad' },
        { name: 'Accesorios para cierre', brand: 'Consultar marca', code: 'COT-ACC-CIERRE', spec: 'Tensores, grapas y fijaciones', unit: 'unidad' }
      ]
    },
    {
      number: '11',
      slug: 'gasfiteria-fitting-jardineria',
      title: 'Gasfitería, Fitting y Jardinería',
      world: 'Construcción',
      short: 'Fittings, conexiones, riego, gasfitería y apoyo a jardinería.',
      description: 'Materiales para instalaciones sanitarias, conexiones, mantención, riego y proyectos complementarios de obra.',
      quoteHint: 'Indica diámetro, material, presión, uso, cantidad y tipo de instalación.',
      applications: ['Gasfitería', 'Riego', 'Mantención', 'Obras menores'],
      subcategories: ['Fittings', 'Conexiones', 'Válvulas', 'Mangueras', 'Riego', 'Sanitarios', 'Herramientas de jardín', 'Accesorios'],
      featuredProducts: [
        { name: 'Fitting de conexión', brand: 'Consultar marca', code: 'COT-FITTING', spec: 'PVC, PPR, cobre u otro material', unit: 'unidad' },
        { name: 'Válvula de paso', brand: 'Consultar marca', code: 'COT-VALVULA', spec: 'Medida y material según uso', unit: 'unidad' },
        { name: 'Accesorios de riego', brand: 'Consultar marca', code: 'COT-RIEGO', spec: 'Mangueras, conectores y control', unit: 'unidad' },
        { name: 'Insumos de gasfitería', brand: 'Consultar marca', code: 'COT-GASF', spec: 'Instalación y mantención', unit: 'según producto' }
      ]
    },
    {
      number: '12',
      slug: 'revestimientos-muros-fachadas',
      title: 'Revestimientos, Muros y Fachadas',
      world: 'Construcción',
      short: 'Terminaciones, revestimientos, muros, fachadas y superficies.',
      description: 'Soluciones de terminación para espacios interiores, exteriores, fachadas, muros técnicos y proyectos comerciales.',
      quoteHint: 'Indica m², tipo de superficie, terminación, color, ubicación y condiciones de instalación.',
      applications: ['Terminaciones', 'Fachadas', 'Muros interiores', 'Espacios comerciales'],
      subcategories: ['Revestimientos', 'Paneles', 'Muros', 'Fachadas', 'Terminaciones', 'Perfiles', 'Adhesivos', 'Accesorios'],
      featuredProducts: [
        { name: 'Revestimiento para muro', brand: 'Consultar marca', code: 'COT-REV-MURO', spec: 'Interior o exterior', unit: 'm²' },
        { name: 'Panel de terminación', brand: 'Consultar marca', code: 'COT-PANEL', spec: 'Formato y espesor según proyecto', unit: 'unidad / m²' },
        { name: 'Accesorios de instalación', brand: 'Consultar marca', code: 'COT-ACC-REV', spec: 'Perfiles, adhesivos y fijaciones', unit: 'según producto' },
        { name: 'Solución de fachada', brand: 'Consultar marca', code: 'COT-FACHADA', spec: 'Sistema según aplicación', unit: 'proyecto' }
      ]
    },
    {
      number: '13',
      slug: 'pisos-soluciones-exteriores',
      title: 'Pisos y Soluciones Exteriores',
      world: 'Construcción',
      short: 'Pisos técnicos, caucho, soluciones exteriores y superficies de uso intenso.',
      description: 'Línea para pisos, caucho, superficies antideslizantes, exteriores, circulación, seguridad y operación en terreno.',
      quoteHint: 'Indica m², espesor, uso, tránsito, color, formato y si requiere instalación.',
      applications: ['Pisos antideslizantes', 'Exteriores', 'Seguridad', 'Tránsito peatonal o industrial'],
      subcategories: ['Pisos de goma', 'Gradas de goma', 'Palmetas', 'Pisos antideslizantes', 'Soluciones exteriores', 'Superficies técnicas', 'Accesorios', 'Instalación'],
      featuredProducts: [
        { name: 'Piso de goma antideslizante', brand: 'Consultar marca', code: 'COT-PISO-GOMA', spec: 'Formato y espesor según uso', unit: 'm²' },
        { name: 'Grada de goma', brand: 'Consultar marca', code: 'COT-GRADA-GOMA', spec: 'Seguridad y terminación para escalas', unit: 'metro / unidad' },
        { name: 'Palmeta exterior', brand: 'Consultar marca', code: 'COT-PALMETA', spec: 'Superficie de alto tránsito', unit: 'm²' },
        { name: 'Instalación de piso técnico', brand: 'Servicio Codimas', code: 'COT-SERV-PISO', spec: 'Evaluación según superficie', unit: 'proyecto' }
      ]
    }
  ],
  services: [
    { title: 'Instalaciones eléctricas', text: 'Ejecución, mantención, canalización y apoyo técnico para proyectos residenciales, comerciales y empresas.' },
    { title: 'Obras menores y terminaciones', text: 'Soluciones complementarias para construcción, revestimientos, pisos, muros y mantención.' },
    { title: 'Telecomunicaciones y redes', text: 'Canalización, puntos de datos, conectividad y soporte para infraestructura técnica.' },
    { title: 'Abastecimiento B2B', text: 'Cotización por volumen, compras recurrentes, productos técnicos y coordinación logística.' }
  ],
  brands: ['Bticino', 'Covisa', 'Madeco', 'Legrand', 'Schneider Electric', '3M', 'Sika', 'Bosch', 'Stanley', 'Genérico técnico según disponibilidad']
};

window.CODIMAS_UTILS = {
  getCategory(slug) {
    return window.CODIMAS_CATALOG.categories.find((category) => category.slug === slug);
  },
  searchCatalog(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return window.CODIMAS_CATALOG.categories.filter((category) => {
      const haystack = [
        category.title,
        category.world,
        category.short,
        category.description,
        ...(category.subcategories || []),
        ...(category.featuredProducts || []).flatMap((product) => [product.name, product.brand, product.code, product.spec])
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  },
  addQuoteItem(item) {
    const key = 'codimasQuoteItems';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const exists = current.some((saved) => saved.code === item.code && saved.name === item.name);
    const next = exists ? current : [...current, { ...item, addedAt: new Date().toISOString() }];
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  },
  getQuoteItems() {
    return JSON.parse(localStorage.getItem('codimasQuoteItems') || '[]');
  },
  clearQuoteItems() {
    localStorage.removeItem('codimasQuoteItems');
  },
  quoteUrl(params = {}) {
    const url = new URL('/cotizacion.html', window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    return url.pathname + url.search;
  }
};
