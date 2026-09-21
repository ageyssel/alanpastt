const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) {
    console.error('CMS VALIDATION FAILED:', message);
    process.exit(1);
  }
}

const sandbox = {
  window: {},
  localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  URL,
  console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/js/catalog-data.js', 'utf8'), sandbox);
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

function collectMedia(value, path = '', out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectMedia(item, path ? path + '.' + index : String(index), out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, val]) => {
      const next = path ? path + '.' + key : key;
      if (/^(image_url|hero_image_url|logo_url|logo_negative_url|favicon_url)$/.test(key)) out.push(next);
      else collectMedia(val, next, out);
    });
  }
  return out;
}
const allMedia = collectMedia(site);
site.catalog.categories.forEach((category, ci) => {
  assert(Object.prototype.hasOwnProperty.call(category, 'image_url'), 'Category ' + ci + ' has no editable image_url');
  (category.featuredProducts || []).forEach((product, pi) => {
    assert(Object.prototype.hasOwnProperty.call(product, 'image_url'), 'Product ' + ci + '.' + pi + ' has no editable image_url');
  });
});
site.catalog.services.forEach((service, si) => assert(Object.prototype.hasOwnProperty.call(service, 'image_url'), 'Service ' + si + ' has no editable image_url'));
const expectedMediaCount = requiredMedia.length + site.catalog.categories.length + site.catalog.categories.reduce((sum, category) => sum + (category.featuredProducts || []).length, 0) + site.catalog.services.length;
assert(allMedia.length === expectedMediaCount, 'Editable media inventory mismatch: expected ' + expectedMediaCount + ', got ' + allMedia.length);

const editor = fs.readFileSync('admin/editor.html', 'utf8');
assert(editor.includes('data-tab="media"'), 'Admin media tab is missing');
assert(editor.includes('id="media-admin-grid"'), 'Admin media grid is missing');
assert(editor.includes('id="run-diagnostics"'), 'CMS diagnostics button is missing');
assert(editor.includes('id="diagnostics-result"'), 'CMS diagnostics result panel is missing');

const mediaManager = fs.readFileSync('admin/assets/cms-media.js', 'utf8');
['catalog.categories', 'featuredProducts', 'catalog.services', 'app().upload(file)', 'await app().saveAll()', 'data-media-upload', 'data-media-file'].forEach((needle) => {
  assert(mediaManager.includes(needle), `Media manager contract missing: ${needle}`);
});
assert(!mediaManager.includes('const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) {
    console.error('CMS VALIDATION FAILED:', message);
    process.exit(1);
  }
}

const sandbox = {
  window: {},
  localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  URL,
  console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/js/catalog-data.js', 'utf8'), sandbox);
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

function collectMedia(value, path = '', out = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectMedia(item, path ? path + '.' + index : String(index), out));
    return out;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, val]) => {
      const next = path ? path + '.' + key : key;
      if (/^(image_url|hero_image_url|logo_url|logo_negative_url|favicon_url)$/.test(key)) out.push(next);
      else collectMedia(val, next, out);
    });
  }
  return out;
}
const allMedia = collectMedia(site);
site.catalog.categories.forEach((category, ci) => {
  assert(Object.prototype.hasOwnProperty.call(category, 'image_url'), 'Category ' + ci + ' has no editable image_url');
  (category.featuredProducts || []).forEach((product, pi) => {
    assert(Object.prototype.hasOwnProperty.call(product, 'image_url'), 'Product ' + ci + '.' + pi + ' has no editable image_url');
  });
});
site.catalog.services.forEach((service, si) => assert(Object.prototype.hasOwnProperty.call(service, 'image_url'), 'Service ' + si + ' has no editable image_url'));
const expectedMediaCount = requiredMedia.length + site.catalog.categories.length + site.catalog.categories.reduce((sum, category) => sum + (category.featuredProducts || []).length, 0) + site.catalog.services.length;
assert(allMedia.length === expectedMediaCount, 'Editable media inventory mismatch: expected ' + expectedMediaCount + ', got ' + allMedia.length);

const editor = fs.readFileSync('admin/editor.html', 'utf8');
assert(editor.includes('data-tab="media"'), 'Admin media tab is missing');
assert(editor.includes('id="media-admin-grid"'), 'Admin media grid is missing');
assert(editor.includes('id="run-diagnostics"'), 'CMS diagnostics button is missing');
assert(editor.includes('id="diagnostics-result"'), 'CMS diagnostics result panel is missing');

const mediaManager = fs.readFileSync('admin/assets/cms-media.js', 'utf8');
['catalog.categories', 'featuredProducts', 'catalog.services', 'app().upload(file)', 'await app().saveAll()', 'data-media-upload', 'data-media-file'].forEach((needle) => {
  assert(mediaManager.includes(needle), `Media manager contract missing: ${needle}`);
.cms-media-file'), 'Media manager contains invalid upload selector');
assert(mediaManager.includes('find(el=>el.dataset.mediaFile===path)'), 'Media upload button is not wired to its matching file input');

const core = fs.readFileSync('admin/assets/cms-core.js', 'utf8');
assert(core.includes("select('value').eq('key','cms_site').maybeSingle()"), 'CMS save verification readback is missing');
assert(core.includes('codimas:cms-saved'), 'CMS save confirmation event is missing');
assert(core.includes('normalizeSite'), 'Existing CMS records are not normalized to the complete media model');
assert(core.includes('const publicSb='), 'Anonymous/public verification client is missing');
assert(core.includes("publicSb.from('site_content')"), 'Public CMS readback verification is missing');
assert(core.includes('async function runDiagnostics()'), 'CMS end-to-end diagnostics are missing');
assert(core.includes('storage.from(bucket).upload'), 'Storage upload diagnostic is missing');
assert(core.includes('storage.from(bucket).remove'), 'Storage cleanup diagnostic is missing');

const runtime = fs.readFileSync('src/js/cms-runtime.js', 'utf8');
['function applyMediaBindings', '[data-cms-media]', '[data-cms-background]', '[data-cms-favicon]', 'applyMediaBindings(site)'].forEach((needle) => {
  assert(runtime.includes(needle), `Public media binding missing: ${needle}`);
});

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

function validateStaticMedia(file, expectedBackgroundPath) {
  const html = fs.readFileSync(file, 'utf8');
  const imgs = html.match(/<img\\b[^>]*>/g) || [];
  imgs.forEach((tag) => assert(tag.includes('data-cms-media='), file + ' contains a static image not controlled by CMS'));
  const backgrounds = html.match(/<[^>]+background-image:[^>]+>/g) || [];
  backgrounds.forEach((tag) => assert(tag.includes('data-cms-background='), file + ' contains a static background image not controlled by CMS'));
  assert(html.includes('data-cms-favicon="global.favicon_url"'), file + ' favicon is not CMS-controlled');
  assert(html.includes('data-cms-background="' + expectedBackgroundPath + '"'), file + ' main image binding is missing');
  assert(html.includes('cms-defaults.js?v=20260921-media-2'), file + ' is not loading current CMS defaults');
  assert(html.includes('cms-runtime.js?v=20260921-media-2'), file + ' is not loading current CMS runtime');
}
validateStaticMedia('index.html', 'home.hero.image_url');
validateStaticMedia('cotizacion.html', 'quote.hero_image_url');
validateStaticMedia('seguimiento.html', 'tracking.hero_image_url');

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
console.log('Editable media fields validated:', allMedia.length);
console.log('Categories validated:', site.catalog.categories.length);
console.log('Products with editable image slot:', site.catalog.categories.reduce((sum, category) => sum + (category.featuredProducts || []).length, 0));
console.log('Services with editable image slot:', site.catalog.services.length);
