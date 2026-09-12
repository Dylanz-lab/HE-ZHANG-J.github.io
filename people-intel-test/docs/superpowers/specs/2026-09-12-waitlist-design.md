# VeriScope Waitlist Design

## Goal

Connect the existing VeriScope V0.3.3 early-access form to the `Waitlist` tab in the bound `VeriScope Waitlist` Google Sheet without changing the approved UI, layout, palette, demo, or language support.

## Scope and Constraints

- Work only inside `people-intel-test/`; do not modify unrelated Hexo blog files.
- Keep the production page in preview mode until a deployed Google Apps Script `/exec` URL has been configured and verified.
- Retain the English and Japanese pages, existing demo, and current form layout.
- Never submit or store photos, face data, filenames, arbitrary query strings, or credentials.
- The only persisted columns, in this exact order, are: `signup_time`, `email`, `interest`, `locale`, `country`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `plan`, `consent_version`, and `status`.

## Architecture

The Apps Script is bound to the `VeriScope Waitlist` spreadsheet, so it opens the active spreadsheet and its `Waitlist` sheet without embedding a spreadsheet ID in the repository. It is deployed as a Web App that executes as the owner and accepts anonymous `POST` requests.

The static GitHub Pages frontend posts the form to the configurable `/exec` endpoint through a uniquely named, hidden iframe. The request includes a cryptographically random request ID and the parent page origin. The Apps Script returns a minimal HTML response that posts a signed-in-context-free result back to that iframe's parent with `window.parent.postMessage`.

The frontend accepts a result only when all of the following are true:

1. It comes from the iframe created for the active submission.
2. Its request ID equals the current random request ID.
3. Its message shape is the expected waitlist result.

This avoids treating a cross-origin network completion as a successful signup. A missing response times out and preserves the entered form values so the user can retry.

## Frontend Contract

`config.json` gains a public, empty-by-default `waitlistEndpoint` property. It contains the Apps Script `/exec` URL only after the script has been deployed. `mode: "live"`, `waitlistEnabled: true`, a non-empty `waitlistEndpoint`, and the existing contact email are all required to activate real submission.

The frontend sends only these request values:

- `email`: trimmed user email.
- `interest`: one of the existing select values or an empty string.
- `locale`: `en` or `ja`.
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`: existing safely filtered attribution values, when present.
- `plan`: `usd_7_99` or `jpy_980`.
- `consent_version`: a fixed public version string.
- `website`: the existing honeypot value.
- `request_id` and `return_origin`: delivery metadata; neither is stored.

The client has three confirmed outcomes:

- `saved`: hide the form and display the existing success state.
- `duplicate`: hide the form and display localized wording that the email is already on the list; do not claim a second signup.
- `error`, malformed response, iframe failure, or timeout: show the existing localized retry message, leave the fields intact, and never show success.

## Apps Script Contract

`doPost(e)` parses only form fields, rejects missing or malformed payloads, and always returns a small HTML receipt. The script validates the parent origin against an administrator-configured allowlist stored in Script Properties before echoing it as the `postMessage` target. This prevents an arbitrary caller from selecting an unrelated recipient page.

The script performs server-side validation before persistence:

- Email is normalized to lowercase and checked against a practical email format and length limit.
- `interest`, `locale`, `plan`, and `consent_version` must be from fixed allowlists.
- Each UTM value is optional but limited to the same safe character set and length as the frontend.
- A populated honeypot never writes a row.
- The `Waitlist` header row must exactly match the required 12-column schema; otherwise the script returns an error and saves nothing.

The script holds `LockService.getScriptLock()` around duplicate lookup and `appendRow`. It searches normalized existing emails. A match returns `duplicate` and does not write; otherwise it appends exactly one row with Apps Script's current timestamp, `country: "unknown"`, and `status: "active"`.

No Apps Script or frontend code reads, transmits, or persists photos, biometric/face data, uploaded files, filenames, analytics session identifiers, browser fingerprints, or arbitrary request properties.

## Deployment and Verification

The repository includes a copy-paste Apps Script file and a deployment guide. The owner creates the bound script from the target Sheet, configures the allowed GitHub Pages origin in Script Properties, deploys it as a Web App, and pastes the generated `/exec` URL into `people-intel-test/config.json`.

Before switching the public config to live mode, verification must prove all of the following against the deployed script and real Sheet:

1. A valid English signup creates one row with all specified columns, including safe UTM values and `unknown` country.
2. Repeating the normalized email returns `duplicate` and leaves the Sheet row count unchanged.
3. A Japanese signup writes locale and JPY plan correctly.
4. Invalid email, honeypot input, malformed data, server failure, and unreachable endpoint never show success or write extra rows.
5. Browser submission receives a correlated iframe receipt; a fabricated or stale message is ignored.

Until the `/exec` URL exists, the shipped configuration remains preview-only and does not transmit email.
