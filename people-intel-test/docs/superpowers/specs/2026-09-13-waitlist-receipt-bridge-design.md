# Waitlist receipt bridge design

## Goal

Make the deployed Google Apps Script response reach the VeriScope GitHub Pages form after a successful save or duplicate check, without changing the existing visual UI.

## Cause

Apps Script serves user HTML through a Google wrapper iframe. A receipt sent with `window.parent.postMessage` is delivered only to that wrapper rather than the original GitHub Pages window. The existing browser transport also rejects a message whose `source` is the nested Apps Script iframe.

## Design

1. The Apps Script receipt posts the `{ type, request_id, status }` payload to `window.top` using the configured GitHub Pages origin.
2. The browser transport accepts receipts only when all of these checks pass:
   - the message origin is `https://script.google.com` or a Google Apps Script `*.googleusercontent.com` host;
   - the payload type is `veriscope-waitlist`;
   - the request ID matches the active submission;
   - the status is `saved`, `duplicate`, or `error`.
3. A `saved` or `duplicate` receipt preserves the existing successful form state. An `error` receipt or timeout preserves the existing retryable error state.

## Verification

Use the already-approved test address once to observe the saved or duplicate success state, then submit it again to confirm duplicate handling produces no second Sheet row. Existing unit tests and configuration verification remain green.
