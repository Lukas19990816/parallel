/**
 * PARALLEL // Automated Unit & Regression Test Suite
 * Zero-dependency test runner validating i18n, DOM integrity, headphone profiles,
 * security CSP, accessibility contrast tokens, and commercial leakage prevention.
 *
 * Run via: node tests/run-tests.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

function runSection(title, fn) {
  console.log(`\n--- 🧪 ${title} ---`);
  try {
    fn();
  } catch (err) {
    console.error(`  💥 EXCEPTION in suite: ${err.message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// 1. i18n Integrity & Zero-Commercial Traces
// -----------------------------------------------------------------------------
runSection('1. i18n Integrity & Commercial Cleansing', () => {
  const i18nPath = path.join(ROOT_DIR, 'js', 'i18n.js');
  assert(fs.existsSync(i18nPath), 'js/i18n.js exists');

  const i18nCode = fs.readFileSync(i18nPath, 'utf8');
  const sandbox = {};
  const fn = new Function('window', i18nCode + '; return I18N;');
  const I18N = fn(sandbox);

  assert(!!I18N.zh && !!I18N.en && !!I18N.ja, 'All three languages (zh, en, ja) defined');

  const zhKeys = Object.keys(I18N.zh);
  const enKeys = Object.keys(I18N.en);
  const jaKeys = Object.keys(I18N.ja);

  const missingInEn = zhKeys.filter(k => !(k in I18N.en));
  const missingInJa = zhKeys.filter(k => !(k in I18N.ja));
  assert(missingInEn.length === 0, 'EN has all ZH keys', `Missing: ${missingInEn.join(', ')}`);
  assert(missingInJa.length === 0, 'JA has all ZH keys', `Missing: ${missingInJa.join(', ')}`);

  // Verify all data-i18n in index.html are mapped in I18N
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const htmlI18nKeys = [...new Set([...html.matchAll(/data-i18n=['"]([^'"]+)['"]/g)].map(m => m[1]))];
  const unmappedKeys = htmlI18nKeys.filter(k => !(k in I18N.zh));
  assert(unmappedKeys.length === 0, 'All HTML data-i18n keys are mapped in I18N', `Unmapped: ${unmappedKeys.join(', ')}`);

  // Verify zero commercial tokens in translations
  const commercialRegex = /(9\.99|4\.99|parallel-audio\.app|7-day|7天免費試用|7-Day Free Trial|付費|商業版|買斷)/i;
  let commercialFound = [];
  for (const lang of ['zh', 'en', 'ja']) {
    for (const [k, v] of Object.entries(I18N[lang])) {
      if (typeof v === 'string' && commercialRegex.test(v)) {
        commercialFound.push(`${lang}.${k}: "${v}"`);
      }
    }
  }
  assert(commercialFound.length === 0, 'Zero commercial/pricing terms in i18n dictionary', commercialFound.join('; '));
});

// -----------------------------------------------------------------------------
// 2. DOM & Event Element Binding Integrity
// -----------------------------------------------------------------------------
runSection('2. DOM & Event Binding Integrity', () => {
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const jsPath = path.join(ROOT_DIR, 'js', 'app.js');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  // Verify all getElementById in app.js exist in index.html
  const idMatches = [...js.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
  const uniqueIds = [...new Set(idMatches)];
  const missingIds = uniqueIds.filter(id => !html.includes(`id="${id}"`) && !html.includes(`id='${id}'`));

  assert(missingIds.length === 0, 'All app.js getElementById exist in index.html', `Missing: ${missingIds.join(', ')}`);

  // Verify Above-The-Fold 3-Step Wizard elements
  assert(html.includes('class="wizard-rack"'), 'Above-the-fold wizard rack (.wizard-rack) exists in index.html');
  assert(html.includes('step-1') && html.includes('step-2') && html.includes('step-3'), 'Steps 1, 2, 3 cards exist in wizard');

  // Verify Modals exist
  assert(html.includes('id="preShareModal"'), 'Pre-share guidance modal (#preShareModal) exists');
  assert(html.includes('id="browserMatrixModal"'), 'Browser compatibility matrix modal (#browserMatrixModal) exists');

  // Verify Inline Collapsible Guide & FAQ Drawer exists in wizard rack
  assert(html.includes('id="guideDrawer"'), 'Inline collapsible guide drawer (#guideDrawer) exists in wizard');
  assert(html.includes('id="btnToggleGuide"'), 'Guide toggle button (#btnToggleGuide) exists');
  assert(!html.includes('id="btnFooterOpenGuide"'), 'Footer guide expand button (#btnFooterOpenGuide) cleanly removed as requested');

  // Verify Centered Mechanical Nameplate in Footer without CHASSIS SPEC
  assert(html.includes('class="chassis-nameplate"'), 'Centered mechanical nameplate (.chassis-nameplate) exists in footer');
  assert(!html.includes('CHASSIS SPEC'), 'Zero "CHASSIS SPEC" text in footer or document');

  // Verify GitHub Pages .nojekyll flag file exists
  assert(fs.existsSync(path.join(ROOT_DIR, '.nojekyll')), '.nojekyll exists for GitHub Pages static bypass');

  // Verify modal accessibility attributes
  assert(html.includes('aria-modal="true"'), 'Modal includes aria-modal="true"');
  assert(html.includes('role="dialog"'), 'Modal includes role="dialog"');
});

// -----------------------------------------------------------------------------
// 3. Headphone Profile Engine
// -----------------------------------------------------------------------------
runSection('3. Headphone Acoustic Profiles', () => {
  const profilePath = path.join(ROOT_DIR, 'js', 'headphone-profiles.js');
  assert(fs.existsSync(profilePath), 'js/headphone-profiles.js exists');

  const profileCode = fs.readFileSync(profilePath, 'utf8');
  const sandbox = {};
  const fn = new Function('window', profileCode + '; return HEADPHONE_PROFILES;');
  const HEADPHONE_PROFILES = fn(sandbox);

  assert(typeof HEADPHONE_PROFILES === 'object', 'HEADPHONE_PROFILES is defined and object');
  const requiredProfiles = ['FLAT', 'AIRPODS_PRO', 'AIRPODS_OPEN', 'SOUNDCORE', 'SONY_1000X'];
  for (const p of requiredProfiles) {
    assert(p in HEADPHONE_PROFILES, `Profile "${p}" is defined`);
    if (p in HEADPHONE_PROFILES) {
      const entry = HEADPHONE_PROFILES[p];
      assert(typeof entry.name === 'string' && entry.name.length > 0, `Profile "${p}" has valid name`);
      assert(typeof entry.badge === 'string', `Profile "${p}" has valid badge`);
      assert(typeof entry.low === 'object' && typeof entry.low.freq === 'number', `Profile "${p}" has valid low band`);
      assert(typeof entry.mid === 'object' && typeof entry.mid.freq === 'number', `Profile "${p}" has valid mid band`);
      assert(typeof entry.high === 'object' && typeof entry.high.freq === 'number', `Profile "${p}" has valid high band`);
    }
  }
});

// -----------------------------------------------------------------------------
// 4. Security & Content Security Policy (CSP)
// -----------------------------------------------------------------------------
runSection('4. Security & Content Security Policy (CSP)', () => {
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // CSP tag presence
  assert(html.includes('http-equiv="Content-Security-Policy"'), 'Content-Security-Policy meta tag exists');

  // Strict CSP rules with sanctioned GA4 telemetry
  assert(html.includes("connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;"), "CSP connect-src strictly allows only local origin and Google Analytics 4");
  assert(html.includes("object-src 'none'"), "CSP contains object-src 'none' (blocks Flash/plugin attacks)");
  assert(html.includes("base-uri 'none'"), "CSP contains base-uri 'none' (prevents base tag hijacking)");

  // Verify only the official GA4 measurement script is loaded externally
  const externalScripts = [...html.matchAll(/<script[^>]+src=["'](https?:\/\/[^"']+)["']/gi)].map(m => m[1]);
  assert(externalScripts.length === 1 && externalScripts[0].includes('googletagmanager.com/gtag/js?id=G-E6Q8L7K0MW'), 'Only official GA4 measurement script is loaded', externalScripts.join(', '));

  // Verify GA4 Measurement ID G-E6Q8L7K0MW configured
  assert(html.includes("'G-E6Q8L7K0MW'"), "GA4 Measurement ID 'G-E6Q8L7K0MW' is configured in gtag");
});

// -----------------------------------------------------------------------------
// 5. Accessibility & High-Contrast Design
// -----------------------------------------------------------------------------
runSection('5. Accessibility & High-Contrast Styles', () => {
  const cssPath = path.join(ROOT_DIR, 'css', 'app.css');
  assert(fs.existsSync(cssPath), 'css/app.css exists');

  const css = fs.readFileSync(cssPath, 'utf8');

  // Check refined matte contrast text tokens (comfortable, readable, non-glaring)
  assert(css.includes('--text-main: #a3adb8'), 'Refined contrast text main is readable #a3adb8');
  assert(css.includes('--text-sub: #788290'), 'Refined contrast text sub is clear #788290');
  assert(css.includes('--text-dim: #545c6b'), 'Refined contrast text dim is legible #545c6b');

  // Check accessible focus styles
  assert(css.includes(':focus-visible'), 'Focus visible ring (:focus-visible) defined for keyboard accessibility');
  assert(css.includes('.modal-backdrop'), 'Modal backdrop styles defined');
  assert(css.includes('.matrix-table'), 'Matrix compatibility table styles defined');
});

// -----------------------------------------------------------------------------
// 6. Zero Commercial Traces Across Project & Documentation
// -----------------------------------------------------------------------------
runSection('6. Zero Commercial / Pricing Leakage in Documentation', () => {
  const docFiles = ['README.md', 'README.en.md', 'README.ja.md', 'index.html'];
  const leakRegex = /(parallel-audio\.app|\$9\.99|\$4\.99|7-day free trial|7天免費試用|7-Day Free Trial)/i;

  for (const file of docFiles) {
    const fullPath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const matches = content.match(leakRegex);
    assert(!matches, `${file} is 100% free of commercial links and pricing`, matches ? matches[0] : '');
  }
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n=============================================================');
console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
