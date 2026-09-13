import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const config = JSON.parse(read('config.json'));
const execPattern = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/;

assert.equal(typeof config.waitlistEndpoint, 'string', 'waitlistEndpoint must be a string');

if (config.mode === 'preview') {
  assert.equal(config.waitlistEnabled, false, 'preview mode must disable waitlist collection');
  assert.equal(config.waitlistEndpoint, '', 'preview mode must not contain an endpoint');
} else if (config.mode === 'live') {
  assert.equal(config.waitlistEnabled, true, 'live mode must explicitly enable the waitlist');
  assert.match(config.waitlistEndpoint, execPattern, 'live mode requires an Apps Script /exec URL');
  assert.match(config.contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'live mode requires a support contact email');
} else {
  assert.fail('mode must be preview or live');
}

for (const page of ['index.html', 'ja/index.html']) {
  const html = read(page);
  assert.match(html, /assets\/waitlist-core\.js/, `${page} must load the shared validation contract`);
  assert.match(html, /assets\/waitlist-transport\.js/, `${page} must load the receipt transport`);
}

const app = read('assets/app.js');
assert.doesNotMatch(app, /api\/waitlist/, 'legacy waitlist endpoint must not remain');
assert.match(app, /VeriScopeWaitlistTransport\.submit/, 'app must use the receipt transport');

const script = read('apps-script/Code.gs');
assert.match(script, /LockService\.getScriptLock\(\)/, 'Apps Script must lock duplicate lookup and write');
assert.match(script, /getSheetByName\('Waitlist'\)/, 'Apps Script must target the Waitlist tab');
assert.match(script, /VERISCOPE_ALLOWED_ORIGINS/, 'Apps Script must require approved parent origins');
assert.match(script, /window\.top\.postMessage/, 'Apps Script receipt must target the top-level GitHub Pages window');

const guide = read('apps-script/README.md');
assert.match(guide, /VERISCOPE_ALLOWED_ORIGINS/, 'deployment guide must document allowed origins');
assert.match(guide, /\/exec/, 'deployment guide must document the production URL');

console.log(`Waitlist configuration verified for ${config.mode} mode.`);
