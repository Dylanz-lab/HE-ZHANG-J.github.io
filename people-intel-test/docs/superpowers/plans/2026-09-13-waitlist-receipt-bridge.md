# Waitlist Receipt Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Apps Script `saved` and `duplicate` receipts to the live VeriScope Waitlist form through Google's nested iframe wrapper.

**Architecture:** The Apps Script response will post its receipt to the top-level GitHub Pages window. The shared browser transport will verify the payload type, active request UUID, terminal status, and a trusted Apps Script origin instead of equating `event.source` with the wrapper iframe. The form UI remains unchanged.

**Tech Stack:** Vanilla browser JavaScript, Google Apps Script, Node.js built-in test runner, GitHub Pages.

## Global Constraints

- Modify only `people-intel-test/`; do not modify blog directories.
- Preserve EN/JA layouts, visual palette, and copy.
- Never transmit or persist photographs, face information, or filenames.
- Browser success remains conditional on a server receipt of `saved` or `duplicate`.
- Network/server failures must remain retryable and must not show a false success state.

---

### Task 1: Test trusted Apps Script receipt handling

**Files:**
- Modify: `people-intel-test/tests/waitlist-transport.test.mjs`
- Modify: `people-intel-test/assets/waitlist-transport.js`

**Interfaces:**
- Consumes: `isExpectedReceipt(event, iframe, requestId)` from `assets/waitlist-transport.js`.
- Produces: `isExpectedReceipt` accepts valid nested Apps Script receipts and rejects arbitrary origins, mismatched UUIDs, or invalid statuses.

- [ ] **Step 1: Write the failing transport assertions**

```js
test('accepts matching Apps Script receipts across Google iframe wrappers', () => {
  const receipt = { type: 'veriscope-waitlist', request_id: requestId, status: 'duplicate' };
  assert.equal(transport.isExpectedReceipt({ origin: 'https://script.google.com', source: {}, data: receipt }, {}, requestId), true);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://abc-script.googleusercontent.com', source: {}, data: receipt }, {}, requestId), true);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://example.test', source: {}, data: receipt }, {}, requestId), false);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://script.google.com', source: {}, data: { ...receipt, status: 'unexpected' } }, {}, requestId), false);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test people-intel-test/tests/waitlist-transport.test.mjs`

Expected: FAIL because the current function only accepts `event.source === iframe.contentWindow` and does not inspect origin.

- [ ] **Step 3: Implement the minimal trusted-origin check**

```js
function isAppsScriptReceiptOrigin(value) {
  try {
    var url = new URL(value);
    return url.protocol === 'https:' &&
      (url.hostname === 'script.google.com' || /-script\.googleusercontent\.com$/.test(url.hostname));
  } catch (_) {
    return false;
  }
}

function isExpectedReceipt(event, iframe, requestId) {
  return !!event && !!iframe && isAppsScriptReceiptOrigin(event.origin) &&
    !!event.data && event.data.request_id === requestId && core.isReceipt(event.data);
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test people-intel-test/tests/waitlist-transport.test.mjs`

Expected: PASS with valid Google origins accepted and invalid origins rejected.

- [ ] **Step 5: Commit the tested browser transport change**

```bash
git add people-intel-test/assets/waitlist-transport.js people-intel-test/tests/waitlist-transport.test.mjs
git commit -m "fix: accept nested Apps Script receipts"
```

### Task 2: Send Apps Script receipt to the top-level page

**Files:**
- Modify: `people-intel-test/apps-script/Code.gs`
- Modify: `people-intel-test/tools/verify-waitlist-config.mjs`

**Interfaces:**
- Consumes: `receipt_(origin, requestId, status)` invoked from `doPost`.
- Produces: an `HtmlOutput` containing `window.top.postMessage(payload, targetOrigin)` and an `ALLOWALL` frame setting.

- [ ] **Step 1: Write the failing static deployment assertion**

```js
assert.match(script, /window\.top\.postMessage/, 'Apps Script receipt must target the top-level GitHub Pages window');
```

- [ ] **Step 2: Run configuration verification to verify it fails**

Run: `node people-intel-test/tools/verify-waitlist-config.mjs`

Expected: FAIL because the script currently uses `window.parent.postMessage`.

- [ ] **Step 3: Change only the receipt bridge target**

```js
var html = '<!doctype html><meta charset="utf-8"><script>window.top.postMessage(' + payload + ',' + targetOrigin + ');</script>';
```

Keep the existing allowed-origin lookup, receipt fields, `LockService`, validation, duplicate check, and Sheet write code unchanged.

- [ ] **Step 4: Run configuration verification to verify it passes**

Run: `node people-intel-test/tools/verify-waitlist-config.mjs`

Expected: PASS for live mode.

- [ ] **Step 5: Commit the receipt bridge update**

```bash
git add people-intel-test/apps-script/Code.gs people-intel-test/tools/verify-waitlist-config.mjs
git commit -m "fix: deliver waitlist receipt to top window"
```

### Task 3: Deploy and perform production verification

**Files:**
- No additional source changes expected.

**Interfaces:**
- Consumes: the deployed Apps Script `/exec` URL in `people-intel-test/config.json` and the copied `Code.gs` receipt bridge.
- Produces: `saved` on first valid test submission and successful duplicate acknowledgement without a second Sheet row.

- [ ] **Step 1: Copy the updated `Code.gs` to Apps Script and save it**

In the existing Apps Script project, replace only the `window.parent.postMessage` call with `window.top.postMessage`, then save.

- [ ] **Step 2: Create a new deployment version**

Open **Deploy → Manage deployments → Edit → New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**. Keep `VERISCOPE_ALLOWED_ORIGINS=https://dylanz-lab.github.io`.

- [ ] **Step 3: Run all local checks**

Run:

```bash
node --test people-intel-test/tests/waitlist-core.test.mjs people-intel-test/tests/waitlist-transport.test.mjs
node people-intel-test/tools/verify-waitlist-config.mjs
node --check people-intel-test/assets/waitlist-transport.js
```

Expected: all commands exit with status 0.

- [ ] **Step 4: Verify the live browser form**

Open `https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/`, submit the approved test address with a valid purpose and consent, and verify the success state says the address is already on the list. Verify the Sheet has one, not two, rows for that email.

- [ ] **Step 5: Push the completed work**

```bash
git push origin master
```
