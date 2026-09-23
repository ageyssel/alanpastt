const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) { console.error('CMS VALIDATION FAILED:', message); process.exit(1); }
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
const catalog = sandbox.window.CODIMAS_CATALOG;

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
const coreMedia = [
  'global.logo_url', 'global.logo_negative_url', 'global.favicon_url',
  'home.hero.image_url', 'home.promos.0.image_url', 'home.promos.1.image_url',
  'home.enterprise.image_url', 'quote.hero_image_url', 'tracking.hero_image_url'
];
coreMedia.forEach(path => assert(allMedia.includes(path), 'Missing editable media field: ' + path));

assert(site.catalog.categories.length === catalog.categories.length, 'CMS does not contain every catalog category');
site.catalog.categories.forEach((category, ci) => {
  assert(Object.prototype.hasOwnProperty.call(category, 'image_url'), 'Category ' + ci + ' has no editable image_url');
  (category.featuredProducts || []).forEach((product, pi) => {
    assert(Object.prototype.hasOwnProperty.call(product, 'image_url'), 'Product ' + ci + '.' + pi + ' has no editable image_url');
  });
});
site.catalog.services.forEach((service, si) => {
  assert(Object.prototype.hasOwnProperty.call(service, 'image_url'), 'Service ' + si + ' has no editable image_url');
});
const productCount = site.catalog.categories.reduce((sum, category) => sum + (category.featuredProducts || []).length, 0);
const expectedMediaCount = coreMedia.length + site.catalog.categories.length + productCount + site.catalog.services.length;
assert(allMedia.length === expectedMediaCount, 'Editable media inventory mismatch: expected ' + expectedMediaCount + ', got ' + allMedia.length);

const editor = fs.readFileSync('admin/editor.html', 'utf8');
assert(editor.includes('data-tab="media"'), 'Admin media tab is missing');
assert(editor.includes('id="media-admin-grid"'), 'Admin media grid is missing');
assert(editor.includes('id="run-diagnostics"'), 'CMS diagnostics button is missing');
assert(editor.includes('id="diagnostics-result"'), 'CMS diagnostics result panel is missing');

const mediaManager = fs.readFileSync('admin/assets/cms-media.js', 'utf8');
['catalog.categories','featuredProducts','catalog.services','app().upload(file)','await app().saveAll()','data-media-upload','data-media-file'].forEach(needle => {
  assert(mediaManager.includes(needle), 'Media manager contract missing: ' + needle);
});
assert(!mediaManager.includes('$`.cms-media-file'), 'Media manager contains invalid upload selector');
assert(mediaManager.includes('find(el=>el.dataset.mediaFile===path)'), 'Media upload button is not wired to its matching file input');

const core = fs.readFileSync('admin/assets/cms-core.js', 'utf8');
['normalizeSite','const publicSb=',"publicSb.from('site_content')",'async function runDiagnostics()','storage.from(bucket).upload','storage.from(bucket).remove','codimas:cms-saved'].forEach(needle => {
  assert(core.includes(needle), 'CMS persistence/diagnostics contract missing: ' + needle);
});

const runtime = fs.readFileSync('src/js/cms-runtime.js', 'utf8');
['function applyMediaBindings',"$('[data-cms-media]'","$('[data-cms-background]'","$('[data-cms-favicon]'",'applyMediaBindings(site)','function migrateLegacyEmails'].forEach(needle => {
  assert(runtime.includes(needle), 'Public media binding missing: ' + needle);
});

const categoryPage = fs.readFileSync('src/js/category-page.js', 'utf8');
['site?.catalog?.categories','product.image_url','imageFor(category)','global.logo_url','global.logo_negative_url','categoria.html?slug='].forEach(needle => {
  assert(categoryPage.includes(needle), 'Category page CMS integration missing: ' + needle);
});

const home = fs.readFileSync('src/js/home.js', 'utf8');
['site?.catalog?.categories','site?.catalog?.services','product.image_url','service.image_url'].forEach(needle => {
  assert(home.includes(needle), 'Home CMS integration missing: ' + needle);
});

function validateStaticMedia(file, expectedBackgroundPath) {
  const html = fs.readFileSync(file, 'utf8');
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  imgs.forEach(tag => assert(tag.includes('data-cms-media='), file + ' contains static image not controlled by CMS: ' + tag.slice(0, 120)));
  const backgrounds = html.match(/<[^>]+background-image:[^>]+>/g) || [];
  backgrounds.forEach(tag => assert(tag.includes('data-cms-background='), file + ' contains static background image not controlled by CMS'));
  assert(html.includes('data-cms-favicon="global.favicon_url"'), file + ' favicon is not CMS-controlled');
  assert(html.includes('data-cms-background="' + expectedBackgroundPath + '"'), file + ' primary image binding is missing');
  assert(html.includes('cms-defaults.js?v=20260921-media-2'), file + ' does not load current CMS defaults');
  assert(html.includes('cms-runtime.js?v=20260921-media-2'), file + ' does not load current CMS runtime');
}
validateStaticMedia('index.html', 'home.hero.image_url');
validateStaticMedia('cotizacion.html', 'quote.hero_image_url');
validateStaticMedia('seguimiento.html', 'tracking.hero_image_url');

const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
['site_content_public_read','site_content_admin_manage','alanpastt_assets_public_read','alanpastt_assets_admin_insert','alanpastt_assets_admin_update','alanpastt_assets_admin_delete'].forEach(needle => {
  assert(schema.includes(needle), 'Supabase CMS/storage policy missing: ' + needle);
});

console.log('CMS media contract OK');
console.log('Editable media fields validated:', allMedia.length);
console.log('Categories validated:', site.catalog.categories.length);
console.log('Products with editable image slot:', productCount);
console.log('Services with editable image slot:', site.catalog.services.length);

/* Production dependency checks */
['cotizacion.html','seguimiento.html','admin/login.html','admin/dashboard.html','admin/solicitudes.html'].forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  assert(!html.includes('cdn.tailwindcss.com'), file + ' still loads Tailwind CDN in production');
});
const configJs = fs.readFileSync('src/js/config.js', 'utf8');
const adminJs = fs.readFileSync('admin/assets/admin.js', 'utf8');
const cmsCoreJs = fs.readFileSync('admin/assets/cms-core.js', 'utf8');
assert(configJs.includes('window.alanpasttSupabase = window.alanpasttSupabase || window.supabase.createClient'), 'Supabase singleton is missing from config.js');
assert(adminJs.includes('window.alanpasttSupabase ||'), 'Admin login does not reuse the shared Supabase client');
assert(cmsCoreJs.includes('window.alanpasttSupabase||'), 'CMS core does not reuse the shared Supabase client');
assert(cmsCoreJs.includes("storageKey:'codimas-public-anon'"), 'Public verification client is not isolated from admin auth storage');
console.log('Production dependency/auth client checks OK');


/* Legacy email/domain checks */
const textExtensions = new Set(['.html','.js','.ts','.sql','.md','.yml','.yaml','.toml','.txt','.sh']);
const pathApi = require('path');
function walk(dir, out = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    if (entry.name === '.git' || entry.name === 'node_modules') return;
    const full = pathApi.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (textExtensions.has(pathApi.extname(entry.name).toLowerCase())) out.push(full);
  });
  return out;
}
const legacyEmailFiles = walk('.')
  .filter(file => !file.endsWith(pathApi.join('supabase','email-domain-migration.sql')))
  .filter(file => /@alanpastt\.cl/i.test(fs.readFileSync(file, 'utf8')));
assert(legacyEmailFiles.length === 0, 'Legacy @alanpastt.cl email remains in: ' + legacyEmailFiles.join(', '));

const dashboardHtml = fs.readFileSync('admin/dashboard.html', 'utf8');
assert(dashboardHtml.includes('id="account-email"'), 'Admin account email editor is missing');
assert(dashboardHtml.includes('id="update-account-email"'), 'Admin account email update action is missing');
assert(adminJs.includes("auth.updateUser({ email: newEmail })"), 'Admin account email update flow is missing');

assert(schema.includes("'ventas@codimas.cl'"), 'Supabase schema does not use ventas@codimas.cl');
assert(schema.includes("'contacto@codimas.cl'"), 'Supabase schema does not use contacto@codimas.cl');
const quoteEmail = fs.readFileSync('supabase/functions/quote-email/index.ts', 'utf8');
assert(quoteEmail.includes("Codimas SpA <ventas@codimas.cl>"), 'Quote email sender default is not ventas@codimas.cl');
assert(cmsCoreJs.includes('function migrateLegacyEmails'), 'CMS does not migrate persisted legacy email values');
console.log('Legacy email/domain checks OK');
