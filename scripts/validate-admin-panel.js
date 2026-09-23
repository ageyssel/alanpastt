const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error('ADMIN VALIDATION FAILED:', message);
    process.exit(1);
  }
}

const read = (file) => fs.readFileSync(file, 'utf8');
const login = read('admin/login.html');
const dashboard = read('admin/dashboard.html');
const editor = read('admin/editor.html');
const solicitudes = read('admin/solicitudes.html');
const adminJs = read('admin/assets/admin.js');
const cmsCore = read('admin/assets/cms-core.js');
const cmsCatalog = read('admin/assets/cms-catalog.js');
const cmsMedia = read('admin/assets/cms-media.js');
const solicitudesJs = read('admin/assets/solicitudes.js');
const runtime = read('src/js/cms-runtime.js');
const quoteRequest = read('src/js/quote-request.js');
const schema = read('supabase/schema.sql');
const quoteSql = read('supabase/quote-management.sql');
const trackingSql = read('supabase/tracking-public.sql');
const quoteEmail = read('supabase/functions/quote-email/index.ts');

// Authentication and page wiring
assert(login.indexOf('src/js/config.js') < login.indexOf('assets/admin.js'), 'Login must load Supabase config before admin.js');
assert(dashboard.includes('data-admin-page'), 'Dashboard is not protected by admin bootstrap');
assert(dashboard.includes('id="user-email"'), 'Dashboard user identity is missing');
assert(dashboard.includes('id="logout-btn"'), 'Dashboard logout control is missing');
assert(editor.includes('data-admin-page'), 'Editor is not marked as protected');
assert(editor.includes('id="save-all"'), 'Editor global save button is missing');
assert(editor.includes('id="run-diagnostics"'), 'Editor system verification button is missing');
assert(solicitudes.indexOf('src/js/config.js') < solicitudes.indexOf('assets/solicitudes.js'), 'Solicitudes must load config before its controller');
assert(adminJs.includes("from('admin_profiles')"), 'Admin bootstrap does not validate admin_profiles');
assert(solicitudesJs.includes("from('admin_profiles')"), 'Solicitudes does not validate admin role');

// Editor coverage
['general','inicio','media','cotizacion','seguimiento','catalogo','servicios','contacto','respaldo'].forEach(tab => {
  assert(editor.includes('data-tab="' + tab + '"'), 'Missing editor tab: ' + tab);
  assert(editor.includes('data-panel="' + tab + '"'), 'Missing editor panel: ' + tab);
});
['editor-global','editor-navigation','editor-home','media-admin-grid','editor-quote','editor-tracking','categories-admin-list','category-products-editor','services-admin-list','brands-editor','contact-sales-email','contact-email','contact-whatsapp','contact-whatsapp-message','contact-footer','raw-json'].forEach(id => {
  assert(editor.includes('id="' + id + '"'), 'Missing editor control: ' + id);
});

// Global save must really persist all open editors and verify public readback
assert(cmsCore.includes("window.dispatchEvent(new CustomEvent('codimas:before-save'))"), 'Global save does not flush open drafts');
assert(cmsCore.includes("from('site_content').upsert"), 'Global save does not persist site_content');
assert(cmsCore.includes("from('contact_settings').upsert"), 'Global save does not persist contact_settings');
assert(cmsCore.includes("publicSb.from('site_content')"), 'Global save does not verify public site_content');
assert(cmsCore.includes("publicSb.from('contact_settings')"), 'Global save does not verify public contact settings');
assert(cmsCatalog.includes("window.addEventListener('codimas:before-save',flushOpenDrafts)"), 'Open catalog/service drafts are not flushed');
assert(cmsCatalog.includes('async function saveCategory()'), 'Category save is not asynchronous/persistent');
assert(cmsCatalog.includes('async function saveService()'), 'Service save is not asynchronous/persistent');
assert((cmsCatalog.match(/await app\(\)\.saveAll\(\)/g) || []).length >= 4, 'Category/service create/update/delete actions are not all persisted');
assert(cmsCatalog.includes('Ya existe otra categoría con ese slug'), 'Duplicate category slugs are not blocked');

// Media management
assert(cmsMedia.includes('app().upload(file)'), 'Central media manager does not upload files');
assert(cmsMedia.includes('await app().saveAll()'), 'Central media manager does not persist after upload');
assert(cmsCore.includes('async function optimizeImage'), 'Image optimization is missing');
assert(cmsCore.includes('async function assertAdminSession'), 'Image upload does not validate admin session');
assert(cmsCore.includes("storage.from(bucket).upload"), 'CMS image Storage upload is missing');

// Public runtime must reflect edited content
assert(runtime.includes("client.from('site_content')"), 'Public site does not read CMS content');
assert(runtime.includes("client.from('contact_settings')"), 'Public site does not read contact settings');
assert(runtime.includes('applyMediaBindings(site)'), 'Public site does not apply media changes');
assert(runtime.includes('applyGlobal(site)'), 'Public site does not apply global changes');
assert(runtime.includes('applyHome(site)'), 'Public home does not apply CMS changes');
assert(runtime.includes('applyQuote(site)'), 'Quote page does not apply CMS changes');
assert(runtime.includes('applyTracking(site)'), 'Tracking page does not apply CMS changes');
assert(runtime.includes('data-codimas-contact-email'), 'General contact email is not independently applied');

// Quote context generated from every public CTA/search route
['categoria','producto','tipo','servicio','busqueda'].forEach(param => {
  assert(quoteRequest.includes("params.get('" + param + "')"), 'Quote parameter is lost: ' + param);
});

// Solicitudes: every referenced static control must exist
const requestIds = [...solicitudesJs.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
[...new Set(requestIds)].forEach(id => {
  assert(solicitudes.includes('id="' + id + '"'), 'Solicitudes JS references missing HTML id: ' + id);
});
assert(solicitudesJs.includes("from('cotizaciones_entrantes')"), 'Requests list/update wiring missing');
assert(solicitudesJs.includes("from('quote_attachments')"), 'Attachment metadata wiring missing');
assert(solicitudesJs.includes("storage.from('quote-attachments').upload"), 'Private attachment upload wiring missing');
assert(solicitudesJs.includes("from('quote_responses')"), 'Response history wiring missing');
assert(solicitudesJs.includes("functions.invoke('quote-email'"), 'Customer response email invocation missing');

// Allowed statuses must match UI and SQL constraints
const statuses = ['Nueva','En revisión','Cotizando','Respondida','Cerrada'];
statuses.forEach(status => {
  assert(solicitudes.includes('<option>' + status + '</option>'), 'Solicitudes UI missing state: ' + status);
  assert(schema.includes("'" + status + "'"), 'Canonical schema missing state: ' + status);
  assert(quoteSql.includes("'" + status + "'"), 'Quote migration missing state: ' + status);
});

// Database/RLS contracts required by the admin
['admin_profiles','site_content','contact_settings','cotizaciones_entrantes'].forEach(table => {
  assert(schema.includes('public.' + table), 'Canonical schema missing table: ' + table);
});
['quote_attachments','quote_responses'].forEach(table => {
  assert(quoteSql.includes('public.' + table), 'Quote management SQL missing table: ' + table);
});
assert(trackingSql.includes('get_quote_tracking'), 'Public tracking RPC is missing');
assert(trackingSql.includes('security definer'), 'Public tracking RPC is not security-definer protected');

// Reversible live diagnostics must cover every internal module except sending a real email
['runQuoteModuleDiagnostics','cotizaciones_entrantes','quote_responses','quote_attachments','quote-attachments','get_quote_tracking'].forEach(needle => {
  assert(cmsCore.includes(needle), 'Live diagnostics missing module: ' + needle);
});

// Transactional email function contracts
assert(quoteEmail.includes("payload.type === 'confirmation'"), 'Confirmation email flow is missing');
assert(quoteEmail.includes("payload.type === 'response'"), 'Admin response email flow is missing');
assert(quoteEmail.includes('assertAdmin(req'), 'Response flow is not admin-authorized');
assert(quoteEmail.includes('ventas@codimas.cl'), 'Transactional mail is not configured for Codimas sales');
assert(!quoteEmail.includes('ventas@alanpastt.cl'), 'Transactional mail still references legacy sales domain');

// Production HTML should not load Tailwind CDN
const htmlFiles = [];
function walk(dir) {
  fs.readdirSync(dir, {withFileTypes:true}).forEach(entry => {
    if (entry.name.includes('backup')) return;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  });
}
walk('.');
htmlFiles.forEach(file => {
  assert(!read(file).includes('cdn.tailwindcss.com'), 'Tailwind CDN remains in production HTML: ' + file);
});

// Redirect compatibility pages
assert(read('admin/productos.html').includes('editor.html#catalogo'), 'Legacy productos route does not redirect to catalog editor');
assert(read('admin/contenido.html').includes('editor.html#inicio'), 'Legacy contenido route does not redirect to home editor');
assert(read('admin/contacto.html').includes('editor.html#contacto'), 'Legacy contacto route does not redirect to contact editor');

console.log('Admin panel contract OK');
console.log('Validated editor tabs: 9');
console.log('Validated request states: ' + statuses.length);
console.log('Validated solicitudes controls: ' + new Set(requestIds).size);
console.log('Validated production HTML files: ' + htmlFiles.length);