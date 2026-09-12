# Google Sheet Waitlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a real, privacy-minimizing VeriScope waitlist that writes confirmed signups to the bound Google Sheet through a configurable Apps Script Web App.

**Architecture:** Keep the V0.3.3 form and submit its explicit fields to a hidden iframe. Apps Script validates and saves under a script lock, then returns an HTML `postMessage` receipt correlated by an unguessable request ID; the page accepts only the receipt from its current iframe.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Node.js built-in test runner, Google Apps Script, Google Sheets, GitHub Pages.

## Global Constraints

- Modify only `people-intel-test/`; leave unrelated Hexo blog files untouched.
- Preserve V0.3.3 layout, palette, demo, fictional-sample disclosures, and EN/JA pages.
- Commit `config.json` in preview mode: `waitlistEnabled: false` and `waitlistEndpoint: ""` until deployed end-to-end verification passes.
- Never transmit or save photos, face/biometric data, filenames, credentials, analytics identifiers, or unknown request properties.
- Persist exactly `signup_time, email, interest, locale, country, utm_source, utm_medium, utm_campaign, utm_content, plan, consent_version, status`, in that order.
- Write `country` as `unknown` and new signup `status` as `active`.
- Do not hardcode an Apps Script `/exec` URL, Sheet ID, token, or secret.
- Show success only for a matching `saved` receipt; treat all missing, invalid, server-error, or timed-out receipts as retryable errors.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `assets/waitlist-core.js` | Shared pure validation, normalization, row construction, and receipt-shape functions for Apps Script and Node. |
| `assets/waitlist-transport.js` | Hidden-iframe submit and correlated `postMessage` receipt handling. |
| `assets/app.js` | Existing page controller; live gating and form-state mapping only. |
| `index.html`, `ja/index.html` | Load new scripts and define localized duplicate strings. |
| `config.json` | Empty-by-default public endpoint setting. |
| `apps-script/Code.gs` | Bound Sheet Web App entrypoint, lock-protected lookup/write, and HTML receipt. |
| `apps-script/README.md` | Sheet-bound setup, allowed origin, deployment, rollback, and live verification. |
| `tests/*.test.mjs` | Node unit tests for contract and receipt correlation. |
| `tools/verify-waitlist-config.mjs` | Offline preview-safety and integration checks. |

### Task 1: Define and test the shared waitlist contract

**Files:**
- Create: `people-intel-test/assets/waitlist-core.js`
- Create: `people-intel-test/tests/waitlist-core.test.mjs`

**Interfaces:**
- Produces `globalThis.VeriScopeWaitlistCore` in a browser and `module.exports` in Node.
- Produces `normalizeEmail(value)`, `validateSubmission(input)`, `buildRow(input, timestamp)`, `isReceipt(value)`, and `HEADERS`.
- Consumes only primitive values; it has no DOM, storage, image, analytics, or network dependency.

- [ ] **Step 1: Write failing core tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import core from '../assets/waitlist-core.js';

test('normalizes email and creates the exact 12-column row', () => {
  const input = core.validateSubmission({
    email: '  HELLO@Example.COM ', interest: 'research', locale: 'en',
    plan: 'usd_7_99', consent_version: 'v0.3-waitlist', website: '',
    utm_source: 'launch', utm_medium: 'email', utm_campaign: '', utm_content: ''
  });
  assert.equal(input.email, 'hello@example.com');
  assert.deepEqual(core.buildRow(input, '2026-09-12T00:00:00.000Z'), [
    '2026-09-12T00:00:00.000Z', 'hello@example.com', 'research', 'en', 'unknown',
    'launch', 'email', '', '', 'usd_7_99', 'v0.3-waitlist', 'active'
  ]);
});

test('rejects invalid email, locale, UTM, and honeypot', () => {
  assert.throws(() => core.validateSubmission({ email: 'not-an-email' }));
  assert.throws(() => core.validateSubmission({ email: 'a@b.com', locale: 'fr' }));
  assert.throws(() => core.validateSubmission({ email: 'a@b.com', utm_source: 'bad value' }));
  assert.throws(() => core.validateSubmission({ email: 'a@b.com', website: 'bot' }));
});
```

- [ ] **Step 2: Run the test before implementation**

Run: `node --test people-intel-test/tests/waitlist-core.test.mjs`

Expected: FAIL because `waitlist-core.js` does not exist.

- [ ] **Step 3: Implement the pure contract module**

```js
var VeriScopeWaitlistCore = (function () {
  var HEADERS = ['signup_time','email','interest','locale','country','utm_source','utm_medium','utm_campaign','utm_content','plan','consent_version','status'];
  var INTERESTS = ['', 'own_photo', 'authorized', 'research'];
  var LOCALES = ['en', 'ja'];
  var PLANS = ['usd_7_99', 'jpy_980'];
  function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
  function oneOf(value, values, name) { if (values.indexOf(value) === -1) throw new Error('invalid-' + name); return value; }
  function utm(value) { value = String(value || ''); if (!/^[A-Za-z0-9_-]{0,60}$/.test(value)) throw new Error('invalid-utm'); return value; }
  function validateSubmission(input) {
    input = input || {}; if (String(input.website || '')) throw new Error('honeypot');
    var email = normalizeEmail(input.email);
    if (email.length > 254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error('invalid-email');
    return { email: email, interest: oneOf(String(input.interest || ''), INTERESTS, 'interest'), locale: oneOf(String(input.locale || 'en'), LOCALES, 'locale'), utm_source: utm(input.utm_source), utm_medium: utm(input.utm_medium), utm_campaign: utm(input.utm_campaign), utm_content: utm(input.utm_content), plan: oneOf(String(input.plan || ''), PLANS, 'plan'), consent_version: oneOf(String(input.consent_version || ''), ['v0.3-waitlist'], 'consent') };
  }
  function buildRow(input, timestamp) { return [timestamp, input.email, input.interest, input.locale, 'unknown', input.utm_source, input.utm_medium, input.utm_campaign, input.utm_content, input.plan, input.consent_version, 'active']; }
  function isReceipt(value) { return !!value && value.type === 'veriscope-waitlist' && /^[a-f0-9-]{36}$/.test(value.request_id || '') && ['saved', 'duplicate', 'error'].indexOf(value.status) !== -1; }
  return { HEADERS: HEADERS, normalizeEmail: normalizeEmail, validateSubmission: validateSubmission, buildRow: buildRow, isReceipt: isReceipt };
}());
if (typeof module !== 'undefined') module.exports = VeriScopeWaitlistCore;
```

Email uses `^[^\s@]+@[^\s@]+\.[^\s@]+$` after normalization and has a 254-character limit. UTM fields are optional but limited to 60 characters matching `^[A-Za-z0-9_-]*$`. Accept interest only from `'', 'own_photo', 'authorized', 'research'`, locale only from `en, ja`, plan only from `usd_7_99, jpy_980`, and consent version only as `v0.3-waitlist`. Ignore every request key not returned by `validateSubmission`.

- [ ] **Step 4: Re-run the core suite**

Run: `node --test people-intel-test/tests/waitlist-core.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run: `git add people-intel-test/assets/waitlist-core.js people-intel-test/tests/waitlist-core.test.mjs && git commit -m "feat: define waitlist submission contract"`

### Task 2: Build a correlated, fail-closed browser transport

**Files:**
- Create: `people-intel-test/assets/waitlist-transport.js`
- Create: `people-intel-test/tests/waitlist-transport.test.mjs`
- Modify: `people-intel-test/index.html`
- Modify: `people-intel-test/ja/index.html`
- Modify: `people-intel-test/assets/app.js: 1-177`
- Modify: `people-intel-test/config.json`

**Interfaces:**
- Consumes `VeriScopeWaitlistCore.isReceipt` and a valid endpoint.
- Produces `window.VeriScopeWaitlistTransport.submit(endpoint, fields)` returning `Promise<{status: 'saved' | 'duplicate'}>` or rejecting.
- Produces `isExecEndpoint(url)` and `isExpectedReceipt(event, iframe, requestId)` for tests and live gating.

- [ ] **Step 1: Write failing receipt-correlation tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import transport from '../assets/waitlist-transport.js';

test('accepts only the active iframe and request id', () => {
  const frame = { contentWindow: {} };
  assert.equal(transport.isExpectedReceipt({ source: {}, data: { type: 'veriscope-waitlist', request_id: 'r1', status: 'saved' } }, frame, 'r1'), false);
  assert.equal(transport.isExpectedReceipt({ source: frame.contentWindow, data: { type: 'veriscope-waitlist', request_id: 'r2', status: 'saved' } }, frame, 'r1'), false);
  assert.equal(transport.isExpectedReceipt({ source: frame.contentWindow, data: { type: 'veriscope-waitlist', request_id: 'r1', status: 'saved' } }, frame, 'r1'), true);
});

test('requires an HTTPS Apps Script exec URL', () => {
  assert.equal(transport.isExecEndpoint('https://script.google.com/macros/s/id/exec'), true);
  assert.equal(transport.isExecEndpoint('https://example.test/waitlist'), false);
  assert.equal(transport.isExecEndpoint('http://script.google.com/macros/s/id/exec'), false);
});
```

- [ ] **Step 2: Run the test before implementation**

Run: `node --test people-intel-test/tests/waitlist-transport.test.mjs`

Expected: FAIL because `waitlist-transport.js` does not exist.

- [ ] **Step 3: Implement transport cleanup and request correlation**

```js
function submit(endpoint, fields) {
  return new Promise(function (resolve, reject) {
    var requestId = crypto.randomUUID(), iframe = document.createElement('iframe'), form = document.createElement('form');
    var timer, settled = false;
    function finish(error, result) { if (settled) return; settled = true; clearTimeout(timer); window.removeEventListener('message', onMessage); form.remove(); iframe.remove(); error ? reject(error) : resolve(result); }
    function onMessage(event) { if (isExpectedReceipt(event, iframe, requestId)) event.data.status === 'error' ? finish(new Error('waitlist-error')) : finish(null, event.data); }
    iframe.name = 'veriscope-waitlist-' + requestId; iframe.hidden = true;
    form.method = 'POST'; form.action = endpoint; form.target = iframe.name; form.hidden = true;
    Object.entries(Object.assign({}, fields, { request_id: requestId, return_origin: location.origin })).forEach(function (entry) { var input = document.createElement('input'); input.type = 'hidden'; input.name = entry[0]; input.value = entry[1]; form.appendChild(input); });
    document.body.append(iframe, form); window.addEventListener('message', onMessage); timer = setTimeout(function () { finish(new Error('waitlist-timeout')); }, 12000); form.submit();
  });
}
```

Do not use `fetch` with `no-cors`, parse iframe documents, or trust event origin alone. Bind every receipt to both `iframe.contentWindow` and the request ID because Apps Script uses a redirecting Google-hosted response origin.

- [ ] **Step 4: Integrate into the current form with no layout changes**

1. Load `waitlist-core.js` and `waitlist-transport.js` immediately before `app.js` in both pages.
2. Add `waitlistEndpoint: ''` to default config and `config.json`.
3. Set live mode only if existing live conditions and `isExecEndpoint(config.waitlistEndpoint)` are true.
4. Replace only the live `fetch(endpoint('api/waitlist'))` branch with `submit(config.waitlistEndpoint, fields)`.
5. Submit precisely this field map:

```js
{
  email: $('email').value,
  interest: $('purpose').value,
  locale: t.locale,
  utm_source: attribution.utm_source || '', utm_medium: attribution.utm_medium || '',
  utm_campaign: attribution.utm_campaign || '', utm_content: attribution.utm_content || '',
  plan: t.locale === 'ja' ? 'jpy_980' : 'usd_7_99',
  consent_version: 'v0.3-waitlist', website: $('website').value
}
```

6. Map `saved` to the current success UI, `duplicate` to localized “already joined” title/body, and all rejections to the existing retry UI without clearing inputs. Preview form behavior remains fully local.

- [ ] **Step 5: Run browser-contract checks**

Run: `node --test people-intel-test/tests/waitlist-transport.test.mjs && rg -n "api/waitlist|no-cors|face|filename" people-intel-test/assets/app.js people-intel-test/assets/waitlist-transport.js`

Expected: tests PASS and no legacy waitlist request or prohibited payload appears in the new path.

- [ ] **Step 6: Commit Task 2**

Run: `git add people-intel-test/assets/waitlist-transport.js people-intel-test/tests/waitlist-transport.test.mjs people-intel-test/assets/app.js people-intel-test/index.html people-intel-test/ja/index.html people-intel-test/config.json && git commit -m "feat: add confirmed waitlist browser flow"`

### Task 3: Implement the bound Apps Script Web App

**Files:**
- Create: `people-intel-test/apps-script/Code.gs`
- Create: `people-intel-test/apps-script/README.md`

**Interfaces:**
- Consumes `VeriScopeWaitlistCore` after the `waitlist-core.js` source is pasted into the bound Apps Script project.
- Produces `doPost(e)` and a minimal receipt `{ type: 'veriscope-waitlist', request_id, status }`.
- Requires Script Property `VERISCOPE_ALLOWED_ORIGINS=https://dylanz-lab.github.io`.

- [ ] **Step 1: Add the failing manual Apps Script test matrix to the README**

| Request | Receipt | Sheet rows |
| --- | --- | --- |
| valid first email | `saved` | increases by one |
| same email with different case | `duplicate` | unchanged |
| malformed email | `error` | unchanged |
| populated `website` | `error` | unchanged |
| wrong header row | `error` | unchanged |

- [ ] **Step 2: Verify source files do not exist yet**

Run: `Test-Path people-intel-test/apps-script/Code.gs; Test-Path people-intel-test/apps-script/README.md`

Expected: `False`, then create both files.

- [ ] **Step 3: Implement exact server behavior**

```js
function doPost(e) {
  var requestId = safeRequestId_(e.parameter.request_id);
  try {
    var input = VeriScopeWaitlistCore.validateSubmission(e.parameter || {});
    var origin = allowedOrigin_(e.parameter.return_origin);
    var lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Waitlist');
      assertHeaders_(sheet);
      if (findNormalizedEmail_(sheet, input.email)) return receipt_(origin, requestId, 'duplicate');
      sheet.appendRow(VeriScopeWaitlistCore.buildRow(input, new Date().toISOString()));
      return receipt_(origin, requestId, 'saved');
    } finally { lock.releaseLock(); }
  } catch (error) { return receipt_(safeAllowedOrigin_(e.parameter || {}), requestId, 'error'); }
}
```

`assertHeaders_` compares the 12 header cells in order before read/write. `findNormalizedEmail_` reads only the email column below headers and normalizes each value. `receipt_` HTML-escapes JSON and calls `window.parent.postMessage(receipt, allowedOrigin)`. The origin is accepted only when listed in Script Property `VERISCOPE_ALLOWED_ORIGINS`; no request field is ever stored except validated submission data.

- [ ] **Step 4: Document owner setup and rollback**

Document: Sheet → **Extensions → Apps Script**; paste `waitlist-core.js` and `Code.gs`; check the header row; set the allowed-origins property; deploy Web App as owner with anonymous access; copy `/exec`; paste it into config; run live tests; then enable flags. State that reverting config to preview or disabling waitlist immediately stops public collection.

- [ ] **Step 5: Run the privacy-source check**

Run: `rg -n "getActiveSpreadsheet|Waitlist|LockService|appendRow|face|photo|filename|embedding|DriveApp|UrlFetchApp" people-intel-test/apps-script`

Expected: active Sheet, tab, lock, and append are present; unnecessary services and prohibited data processing are absent.

- [ ] **Step 6: Commit Task 3**

Run: `git add people-intel-test/apps-script && git commit -m "feat: add Google Sheets waitlist web app"`

### Task 4: Add offline verification and perform V0.3.3 regression checks

**Files:**
- Create: `people-intel-test/tools/verify-waitlist-config.mjs`
- Modify: `people-intel-test/CODEX_HANDOFF.md`

**Interfaces:**
- Consumes config, both language pages, app/transport sources, and Apps Script documentation.
- Exits 0 only when preview is safely disabled or a future live config is structurally valid.

- [ ] **Step 1: Write the failing offline verifier**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
const config = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url)));
assert.equal(config.waitlistEnabled, false);
assert.equal(config.mode, 'preview');
assert.equal(config.waitlistEndpoint, '');
for (const file of ['../index.html', '../ja/index.html']) {
  const html = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.match(html, /assets\/waitlist-core\.js/);
  assert.match(html, /assets\/waitlist-transport\.js/);
}
```

- [ ] **Step 2: Run before implementation**

Run: `node people-intel-test/tools/verify-waitlist-config.mjs`

Expected: FAIL because endpoint config and scripts are not present.

- [ ] **Step 3: Expand the verifier and update handoff**

Reject a live config with empty/non-`/exec` endpoint, a preview config with non-empty endpoint, missing allowed-origin documentation, and the legacy `api/waitlist` path. Update the handoff to say code is implemented but collection remains disabled until URL deployment and real Sheet verification.

- [ ] **Step 4: Run automated regression checks**

Run: `node --test people-intel-test/tests/*.test.mjs; node people-intel-test/tools/verify-waitlist-config.mjs; git diff --check; git status --short`

Expected: all tests and verifier PASS; only intended project files are changed.

- [ ] **Step 5: Smoke-test EN and JA static pages**

Open each page with `?qa=1`. Confirm preview submission is local and no request is created; demo cards, dialogs, locale links, privacy dialog, and form validation still work. Confirm CSS colors/layout/type tuning are unchanged.

- [ ] **Step 6: Commit Task 4**

Run: `git add people-intel-test/tools/verify-waitlist-config.mjs people-intel-test/CODEX_HANDOFF.md && git commit -m "test: verify waitlist remains safely configured"`

### Task 5: Deploy and verify against the live Sheet

**Files:**
- Modify: `people-intel-test/config.json`
- Modify: `people-intel-test/CODEX_HANDOFF.md`

**Interfaces:**
- Consumes the owner-provided deployed `/exec` URL and bound Sheet.
- Produces live collection only after browser receipts and actual Sheet rows match.

- [ ] **Step 1: Obtain the owner-deployed `/exec` URL**

Accept only `https://script.google.com/macros/s/<deployment-id>/exec`; do not accept `/dev`, a redirect URL, API keys, or tokens.

- [ ] **Step 2: Enable only after deployment**

Set `mode` to `live`, `waitlistEnabled` to `true`, and `waitlistEndpoint` to the `/exec` URL. Preserve the contact email and add no secrets.

- [ ] **Step 3: Perform end-to-end browser/Sheet tests**

Submit a valid EN email with safe UTM fields and verify exactly one ordered row. Repeat it with case differences and verify duplicate UI with unchanged row count. Submit a valid JA email and verify `ja`/`jpy_980`. Verify invalid email, filled honeypot, and an invalid local endpoint do not show success or create rows. Restore real configuration before committing.

- [ ] **Step 4: Record only non-sensitive test facts**

Update handoff with deployment date and pass/fail facts for saved, duplicate, Japanese, and retry paths. Never record Sheet IDs, deployment IDs, email addresses, or tokens.

- [ ] **Step 5: Final validation, commit, and push**

Run: `node --test people-intel-test/tests/*.test.mjs; node people-intel-test/tools/verify-waitlist-config.mjs; git diff --check; git status --short`

Run: `git add people-intel-test/config.json people-intel-test/CODEX_HANDOFF.md && git commit -m "feat: enable verified VeriScope waitlist" && git push origin master`

Expected: GitHub Pages receives a verified live configuration.
