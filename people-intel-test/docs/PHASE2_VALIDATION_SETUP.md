# VeriScope Phase 2 Validation Setup

## Decision
Use **GA4 as the first production analytics layer** for the landing-page validation phase, while keeping the existing Waitlist in Google Apps Script / Google Sheets.

Why GA4 for this phase:
- Provides country/device reporting without writing raw IPs into the VeriScope Waitlist sheet.
- Supports the custom funnel events already named in `assets/app.js`.
- Fits the upcoming Google Search Console workflow.
- Can be loaded only after the existing measurement-consent flow is granted.

Do not send email, photos, filenames, face data, biometric data, or other PII to GA4.

## One-time Google-side setup required
Create a GA4 property and a Web data stream for:

`https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/`

Copy the resulting Measurement ID (`G-...`).

Do **not** commit Google-account credentials or admin tokens. The GA4 Measurement ID is a public client-side identifier and may be stored in site configuration, but keep analytics disabled until the integration is tested.

## Front-end integration requirements
Codex / implementation should:

1. Add a configurable analytics provider + GA4 Measurement ID to `config.json`.
2. Keep `analyticsEnabled=false` until a real `G-...` ID is supplied and verified.
3. Lazy-load GA4 only after the user grants measurement consent.
4. Do not backfill events that occurred before consent.
5. Respect Do Not Track / Global Privacy Control behavior already present in `assets/app.js`.
6. Preserve QA mode behavior: QA traffic must not enter production analytics.
7. Never include form email or any uploaded/photo-related value in analytics payloads.

## Production funnel events
Required event names:

- `page_view`
- `demo_start`
- `demo_view`
- `source_open`
- `pricing_view`
- `signup_open`
- `signup_complete`
- `signup_duplicate`
- `signup_error`

Useful event parameters:

- `locale`
- `plan`
- `position` (where relevant)
- `source` (fictional demo source ID only)
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`

`signup_complete` must only fire after the production Waitlist backend returns a confirmed `saved` receipt. `duplicate` must remain a separate event.

## Funnel definitions
Primary validation views:

- `demo_start / page_view`
- `source_open / demo_start`
- `pricing_view / demo_start`
- `signup_complete / pricing_view`
- `signup_complete / page_view`

Do not use raw button clicks as the main demand signal.

## Country attribution
The Waitlist Sheet currently keeps `country=unknown` intentionally. See GitHub issue #1.

For Phase 2 market comparison, use GA4's country dimension as the primary country-level traffic/conversion view. Do not infer country from `locale`, page language, timezone alone, or `?market=`.

If a future implementation writes country back into the Waitlist, it must use a documented trustworthy source and must not store raw IP addresses.

## Google Search Console
After analytics is live:

1. Create/verify a URL-prefix Search Console property covering the VeriScope production prefix.
2. Use a verification method compatible with GitHub Pages (for example a Google-provided meta tag/file).
3. Submit the production sitemap:
   `https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/sitemap.xml`
4. Request indexing for:
   - EN production page
   - JA production page
5. Keep internal QA/status pages out of the indexing target set.
6. Record `submitted`, `indexed`, and `ranking/traffic` as separate states; submission is not proof of indexing.

## Controlled US / Japan traffic test
Do not wait for SEO alone. Once analytics is verified, run a small comparable acquisition test in US and Japan.

Use unique UTMs for every source/creative. Keep the acquisition intent and creative concept as comparable as practical.

Initial intent clusters:
- where a photo appears online
- fake / reused profile photo
- image misuse / impersonation
- public context around a photo

Review the first usable sample by market + source before increasing spend. The decision metric is confirmed Waitlist conversion after meaningful product exposure, not page views alone.

## Current dependencies
- Real Waitlist: ✅ live and E2E verified
- GA4 Measurement ID: ⏳ needs one-time Google-side creation
- Production analytics integration: ⏳ next engineering task
- Search Console verification: ⏳ follows analytics/setup
- Country in Waitlist Sheet: ⚠️ known limitation tracked in issue #1
- US/JP traffic test: ⏳ start after analytics is verified

See GitHub issue #2 for the Phase 2 execution checklist.