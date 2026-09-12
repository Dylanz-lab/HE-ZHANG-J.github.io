'use strict';

var VeriScopeWaitlistCore = (function () {
  var HEADERS = [
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
    'status',
  ];
  var INTERESTS = ['', 'own_photo', 'authorized', 'research'];
  var LOCALES = ['en', 'ja'];
  var PLANS = ['usd_7_99', 'jpy_980'];
  var CONSENT_VERSION = 'v0.3-waitlist';
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var UTM_PATTERN = /^[A-Za-z0-9_-]{0,60}$/;
  var REQUEST_ID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function oneOf(value, allowed, name) {
    if (allowed.indexOf(value) === -1) throw new Error('invalid-' + name);
    return value;
  }

  function sanitizeUtm(value) {
    value = String(value || '');
    if (!UTM_PATTERN.test(value)) throw new Error('invalid-utm');
    return value;
  }

  function validateSubmission(input) {
    input = input || {};
    if (String(input.website || '')) throw new Error('honeypot');

    var email = normalizeEmail(input.email);
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) throw new Error('invalid-email');

    return {
      email: email,
      interest: oneOf(String(input.interest || ''), INTERESTS, 'interest'),
      locale: oneOf(String(input.locale || ''), LOCALES, 'locale'),
      utm_source: sanitizeUtm(input.utm_source),
      utm_medium: sanitizeUtm(input.utm_medium),
      utm_campaign: sanitizeUtm(input.utm_campaign),
      utm_content: sanitizeUtm(input.utm_content),
      plan: oneOf(String(input.plan || ''), PLANS, 'plan'),
      consent_version: oneOf(String(input.consent_version || ''), [CONSENT_VERSION], 'consent-version'),
    };
  }

  function buildRow(input, timestamp) {
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
      'active',
    ];
  }

  function isReceipt(value) {
    return !!value &&
      value.type === 'veriscope-waitlist' &&
      typeof value.request_id === 'string' &&
      REQUEST_ID_PATTERN.test(value.request_id) &&
      ['saved', 'duplicate', 'error'].indexOf(value.status) !== -1;
  }

  return {
    HEADERS: HEADERS,
    normalizeEmail: normalizeEmail,
    validateSubmission: validateSubmission,
    buildRow: buildRow,
    isReceipt: isReceipt,
  };
}());

if (typeof module !== 'undefined') module.exports = VeriScopeWaitlistCore;
