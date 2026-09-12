import test from 'node:test';
import assert from 'node:assert/strict';
import core from '../assets/waitlist-core.js';

test('normalizes email and creates the exact 12-column row', () => {
  const input = core.validateSubmission({
    email: '  HELLO@Example.COM ',
    interest: 'research',
    locale: 'en',
    plan: 'usd_7_99',
    consent_version: 'v0.3-waitlist',
    website: '',
    utm_source: 'launch',
    utm_medium: 'email',
    utm_campaign: '',
    utm_content: '',
  });

  assert.equal(input.email, 'hello@example.com');
  assert.deepEqual(core.buildRow(input, '2026-09-12T00:00:00.000Z'), [
    '2026-09-12T00:00:00.000Z',
    'hello@example.com',
    'research',
    'en',
    'unknown',
    'launch',
    'email',
    '',
    '',
    'usd_7_99',
    'v0.3-waitlist',
    'active',
  ]);
});

test('rejects invalid email, locale, UTM, and honeypot', () => {
  assert.throws(() => core.validateSubmission({ email: 'not-an-email' }));
  assert.throws(() => core.validateSubmission({ email: 'a@b.com', locale: 'fr' }));
  assert.throws(() => core.validateSubmission({ email: 'a@b.com', utm_source: 'bad value' }));
  assert.throws(() => core.validateSubmission({ email: 'a@b.com', website: 'bot' }));
});
