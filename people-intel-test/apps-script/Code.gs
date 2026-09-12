var VERISCOPE_WAITLIST_HEADERS = [
  'signup_time',
  'email',
  'interest',
  'locale',
  'country',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'plan',
  'consent_version',
  'status'
];

var VERISCOPE_INTERESTS = ['', 'own_photo', 'authorized', 'research'];
var VERISCOPE_LOCALES = ['en', 'ja'];
var VERISCOPE_PLANS = ['usd_7_99', 'jpy_980'];
var VERISCOPE_CONSENT_VERSION = 'v0.3-waitlist';
var VERISCOPE_REQUEST_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
var VERISCOPE_SPREADSHEET_ID = '1lkfeZiRqzo8XW8H0fM7K_yBhrQzFvA3Q2VUGatI40h0';

function doPost(e) {
  var params = e && e.parameter ? e.parameter : {};
  var requestId = validRequestId_(params.request_id) ? String(params.request_id) : null;
  var origin = safeAllowedOrigin_(params.return_origin);
  var lock;
  var hasLock = false;

  try {
    if (!requestId || !origin) throw new Error('invalid-request');
    var input = validateSubmission_(params);
    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    hasLock = true;

    var sheet = SpreadsheetApp.openById(VERISCOPE_SPREADSHEET_ID).getSheetByName('Waitlist');
    assertHeaders_(sheet);
    if (hasNormalizedEmail_(sheet, input.email)) return receipt_(origin, requestId, 'duplicate');

    sheet.appendRow(buildRow_(input, new Date()));
    return receipt_(origin, requestId, 'saved');
  } catch (_) {
    return receipt_(origin, requestId, 'error');
  } finally {
    if (hasLock) lock.releaseLock();
  }
}

function validateSubmission_(input) {
  if (String(input.website || '')) throw new Error('honeypot');

  var email = normalizeEmail_(input.email);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid-email');

  return {
    email: email,
    interest: oneOf_(String(input.interest || ''), VERISCOPE_INTERESTS, 'interest'),
    locale: oneOf_(String(input.locale || ''), VERISCOPE_LOCALES, 'locale'),
    utm_source: utm_(input.utm_source),
    utm_medium: utm_(input.utm_medium),
    utm_campaign: utm_(input.utm_campaign),
    utm_content: utm_(input.utm_content),
    plan: oneOf_(String(input.plan || ''), VERISCOPE_PLANS, 'plan'),
    consent_version: oneOf_(String(input.consent_version || ''), [VERISCOPE_CONSENT_VERSION], 'consent-version')
  };
}

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function oneOf_(value, allowed, field) {
  if (allowed.indexOf(value) === -1) throw new Error('invalid-' + field);
  return value;
}

function utm_(value) {
  value = String(value || '');
  if (!/^[A-Za-z0-9_-]{0,60}$/.test(value)) throw new Error('invalid-utm');
  return value;
}

function assertHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() !== VERISCOPE_WAITLIST_HEADERS.length) throw new Error('invalid-sheet');
  var headers = sheet.getRange(1, 1, 1, VERISCOPE_WAITLIST_HEADERS.length).getDisplayValues()[0];
  for (var index = 0; index < VERISCOPE_WAITLIST_HEADERS.length; index += 1) {
    if (headers[index] !== VERISCOPE_WAITLIST_HEADERS[index]) throw new Error('invalid-headers');
  }
}

function hasNormalizedEmail_(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, 2, lastRow - 1, 1).getDisplayValues();
  for (var index = 0; index < values.length; index += 1) {
    if (normalizeEmail_(values[index][0]) === email) return true;
  }
  return false;
}

function buildRow_(input, timestamp) {
  return [
    timestamp,
    input.email,
    input.interest,
    input.locale,
    'unknown',
    input.utm_source,
    input.utm_medium,
    input.utm_campaign,
    input.utm_content,
    input.plan,
    input.consent_version,
    'active'
  ];
}

function allowedOrigin_(value) {
  var origin = String(value || '');
  var configured = String(PropertiesService.getScriptProperties().getProperty('VERISCOPE_ALLOWED_ORIGINS') || '');
  var origins = configured.split(',').map(function (item) { return item.trim(); }).filter(String);
  if (origins.indexOf(origin) === -1) throw new Error('invalid-origin');
  return origin;
}

function safeAllowedOrigin_(value) {
  try {
    return allowedOrigin_(value);
  } catch (_) {
    return null;
  }
}

function validRequestId_(value) {
  return VERISCOPE_REQUEST_ID.test(String(value || ''));
}

function receipt_(origin, requestId, status) {
  if (!origin || !requestId) return HtmlService.createHtmlOutput('<!doctype html><title>VeriScope waitlist</title>');
  var payload = JSON.stringify({
    type: 'veriscope-waitlist',
    request_id: requestId,
    status: status
  }).replace(/</g, '\\u003c');
  var targetOrigin = JSON.stringify(origin).replace(/</g, '\\u003c');
  var html = '<!doctype html><meta charset="utf-8"><script>window.parent.postMessage(' + payload + ',' + targetOrigin + ');</script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
