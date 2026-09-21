const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) {
    console.error('CMS VALIDATION FAILED:', message);
    process.exit(1);
  }
}

const sandbox = {
  window: {
    CODIMAS_CATALOG: {
      categories: [{
        number: '01',
        slug: 'test-category',
        title: 'Categoría prueba',
        world: 'Prueba',
        image_url: 'https://example.com/category.jpg',
        featuredProducts: [{ name: 'Producto prueba', image_url: 'https://example.com/product.jpg' }]
      }],
      services: [{ title: 'Servicio prueba', text: 'Texto', image_url: 'https://example.com/service.jpg' }],
      brands: ['Marca prueba']
    }
  },
  console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/js/cms-defaults.js', 'utf8'), sandbox);
const site = sandbox.window.CODIMAS_CMS_DEFAULTS();

const requiredMedia = [
  'global.logo_url',
  'global.logo_negative_url',
  'global.favicon_url',
  'home.hero.image_url',
  'home.promos.0.image_url',
  'home.promos.1.image_url',
  'home.enterprise.image_url',
  'quote.hero_image_url',
  'tracking.hero_image_url',
  'catalog.categories.0.image_url',
  'catalog.categories.0.featuredProducts.0.image_url',
  'catalog.services.0.image_url'
];

function get(path) {
  return path.split('.').reduce((value, key) => value && value[key], site);
}

requiredMedia.forEach((path) => assert(get(path) !== undefined, `Missing editable media field: ${path}`));

const editor = fs.readFileSync('admin/editor.html', 'utf8');
assert(editor.includes('data-tab="media"'), 'Admin media tab is missing');
assert(editor.includes('id="media-admin-grid"'), 'Admin media grid is missing');

const mediaManager = fs.readFileSync('admin/assets/cms-media.js', 'utf8');
['catalog.categories', 'featuredProducts', 'catalog.services', 'app().upload', 'app().saveAll'].forEach((needle) => {
  assert(mediaManager.includes(needle), `Media manager contract missing: ${needle}`);
});

const core = fs.readFileSync('admin/assets/cms-core.js', 'utf8');
assert(core.includes("select('value').eq('key','cms_site').maybeSingle()"), 'CMS save verification readback is missing');
assert(core.includes('codimas:cms-saved'), 'CMS save confirmation event is missing');

const categoryPage = fs.readFileSync('src/js/category-page.js', 'utf8');
['resolveAsset', 'site?.category_page', 'product.image_url', 'imageFor(category)', 'categoria.html?slug='].forEach((needle) => {
  assert(categoryPage.includes(needle), `Category page CMS integration missing: ${needle}`);
});

const home = fs.readFileSync('src/js/home.js', 'utf8');
['site?.catalog?.categories', 'site?.catalog?.services', 'categoryHref', 'product.image_url', 'service.image_url'].forEach((needle) => {
  assert(home.includes(needle), `Home CMS integration missing: ${needle}`);
});

['index.html', 'cotizacion.html', 'seguimiento.html'].forEach((file) => {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('cms-defaults.js'), `${file} does not load CMS defaults`);
  assert(html.includes('cms-runtime.js'), `${file} does not load CMS runtime`);
});

const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
[
  'site_content_public_read',
  'site_content_admin_manage',
  'alanpastt_assets_public_read',
  'alanpastt_assets_admin_insert',
  'alanpastt_assets_admin_update',
  'alanpastt_assets_admin_delete'
].forEach((needle) => assert(schema.includes(needle), `Supabase CMS/storage policy missing: ${needle}`));

console.log('CMS contract OK');
console.log('Editable media fields validated:', requiredMedia.length);
