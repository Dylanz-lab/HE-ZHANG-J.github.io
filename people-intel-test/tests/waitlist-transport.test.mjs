import test from 'node:test';
import assert from 'node:assert/strict';
import transport from '../assets/waitlist-transport.js';

const requestId = '3d7a5c6e-951a-4f2d-9f7f-9d5b8ac94962';

test('accepts only the active iframe and matching request id', () => {
  const frame = { contentWindow: {} };
  const receipt = { type: 'veriscope-waitlist', request_id: requestId, status: 'saved' };

  assert.equal(transport.isExpectedReceipt({ source: {}, data: receipt }, frame, requestId), false);
  assert.equal(transport.isExpectedReceipt({ source: frame.contentWindow, data: { ...receipt, request_id: 'be7a5c6e-951a-4f2d-9f7f-9d5b8ac94962' } }, frame, requestId), false);
  assert.equal(transport.isExpectedReceipt({ source: frame.contentWindow, data: receipt }, frame, requestId), true);
});

test('requires an HTTPS Apps Script exec URL', () => {
  assert.equal(transport.isExecEndpoint('https://script.google.com/macros/s/id/exec'), true);
  assert.equal(transport.isExecEndpoint('https://example.test/waitlist'), false);
  assert.equal(transport.isExecEndpoint('http://script.google.com/macros/s/id/exec'), false);
  assert.equal(transport.isExecEndpoint('https://script.google.com/macros/s/id/dev'), false);
});
