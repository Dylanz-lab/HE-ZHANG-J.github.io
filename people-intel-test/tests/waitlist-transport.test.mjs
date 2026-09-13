import test from 'node:test';
import assert from 'node:assert/strict';
import transport from '../assets/waitlist-transport.js';

const requestId = '3d7a5c6e-951a-4f2d-9f7f-9d5b8ac94962';

test('accepts matching Apps Script receipts across Google iframe wrappers', () => {
  const frame = {};
  const receipt = { type: 'veriscope-waitlist', request_id: requestId, status: 'saved' };

  assert.equal(transport.isExpectedReceipt({ origin: 'https://script.google.com', source: {}, data: receipt }, frame, requestId), true);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://abc-script.googleusercontent.com', source: {}, data: { ...receipt, status: 'duplicate' } }, frame, requestId), true);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://example.test', source: {}, data: receipt }, frame, requestId), false);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://script.google.com', source: {}, data: { ...receipt, request_id: 'be7a5c6e-951a-4f2d-9f7f-9d5b8ac94962' } }, frame, requestId), false);
  assert.equal(transport.isExpectedReceipt({ origin: 'https://script.google.com', source: {}, data: { ...receipt, status: 'unexpected' } }, frame, requestId), false);
});

test('requires an HTTPS Apps Script exec URL', () => {
  assert.equal(transport.isExecEndpoint('https://script.google.com/macros/s/id/exec'), true);
  assert.equal(transport.isExecEndpoint('https://example.test/waitlist'), false);
  assert.equal(transport.isExecEndpoint('http://script.google.com/macros/s/id/exec'), false);
  assert.equal(transport.isExecEndpoint('https://script.google.com/macros/s/id/dev'), false);
});
