# Codex Handoff — VeriScope

## Repository entry point
- Repository: `Dylanz-lab/HE-ZHANG-J.github.io`
- Branch: **`master`** (not `main`)
- Project directory: `people-intel-test/`
- Live EN page: https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/
- Live JA page: https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/ja/

## Current baseline
The approved visual/product baseline remains **V0.3.3** (typography/readability pass), with **waitlist transport v0.3.4** fixes on top.

Current production head before this handoff refresh:
`f794353e05296b6a59ebf8174d6ef933d0a7d51d`

Key recent fix:
`fix: refresh waitlist receipt transport`

Do not start from an older archive or preview file outside `people-intel-test/`.

## Important files
- `people-intel-test/index.html` — English production page
- `people-intel-test/ja/index.html` — Japanese production page
- `people-intel-test/assets/style.css` — base visual styling
- `people-intel-test/assets/type-tune.css` — V0.3.3 typography/readability overrides
- `people-intel-test/assets/app.js` — client-side demo, funnel events and form behavior
- `people-intel-test/assets/waitlist-core.js` — waitlist validation/receipt contract
- `people-intel-test/assets/waitlist-transport.js` — Apps Script iframe/postMessage transport
- `people-intel-test/apps-script/Code.gs` — deployed waitlist backend source of truth
- `people-intel-test/config.json` — production mode / waitlist endpoint / analytics flags
- `people-intel-test/sitemap.xml` — SEO sitemap
- `people-intel-test/tests/` — waitlist unit tests
- `people-intel-test/metrics.html` — setup/status page, not production analytics

## Current verified product state
- UI/layout/palette: approved baseline; avoid redesign unless explicitly requested.
- Copy baseline: `Identity, in focus.`
- EN + JA pages are live.
- Demo interaction is live.
- Typography was enlarged in V0.3.3 for readability.
- **Real Waitlist is enabled and verified end-to-end.**
- Production page → Google Apps Script → `VeriScope Waitlist` Google Sheet → confirmed receipt → success UI has been manually verified.
- Duplicate handling, request IDs, origin validation, server-side email validation, honeypot, locking, UTM validation and Sheet-header validation are implemented.
- Public production analytics is **still disabled**.

## Current config expectation
Production should remain live for waitlist collection while analytics stays off until a production analytics provider/endpoint is deliberately connected:

```json
{
  "version": "0.3",
  "mode": "live",
  "waitlistEnabled": true,
  "waitlistEndpoint": "<deployed Google Apps Script /exec URL>",
  "analyticsEnabled": false,
  "apiBase": "",
  "contactEmail": "<contact email>"
}
```

Do not disable or replace the working Waitlist flow without an explicit reason and end-to-end re-verification.

## Known limitation: country attribution
The Waitlist Sheet currently writes `country = unknown` by design.

This is **not a bug in the write path**. GitHub Pages does not provide trustworthy server-side visitor geo, and locale/page language/timezone must not be used as fake country attribution.

Track this in GitHub issue **#1**:
`[VeriScope] Replace waitlist country=unknown with reliable geo attribution`

Constraints:
- Do not infer country from browser language, page language, timezone alone, or `?market=`.
- Do not store raw IP addresses in the Waitlist sheet.
- Do not send email, photos, filenames, face data, or biometric data to analytics.
- Country-level geo is sufficient for US vs Japan validation.
- Keep `unknown` as the safe fallback when no trustworthy geo source is available.

## Next milestone: Phase 2 market validation
Track the working plan in GitHub issue **#2**:
`[VeriScope] Phase 2 validation — analytics, Search Console, US/JP traffic test`

Execution order:
1. Connect production analytics and preserve the existing consent / privacy behavior.
2. Measure the real funnel: `page_view → demo_start → source_open → pricing_view → signup_open → confirmed signup_complete`.
3. Keep UTM fields and locale separate from country.
4. Verify Search Console, submit the production sitemap, request indexing for EN + JA production URLs.
5. Run small comparable US / Japan traffic tests with UTMs.
6. Review confirmed Waitlist conversion, not raw page views, before changing positioning/pricing/product scope.

Recommended production event set:
- `page_view`
- `demo_start`
- `demo_view`
- `source_open`
- `pricing_view`
- `signup_open`
- `signup_complete`
- `signup_duplicate`
- `signup_error`

`signup_complete` must only mean a confirmed persisted signup receipt, never a button click.

## Do not change
- Do not modify the unrelated Hexo blog files at repository root.
- Do not redesign the current page by default.
- Do not remove the fictional-sample disclosures.
- Do not imply live face search is available.
- Do not claim signup success without server confirmation.
- Do not commit credentials, API keys, admin secrets, Google tokens, or analytics secrets.
- Do not store uploaded photos, filenames, face embeddings, biometric data, raw IPs, or other unnecessary PII for this validation stage.

## Suggested Codex start instruction
Use repository `Dylanz-lab/HE-ZHANG-J.github.io`, checkout `master`, then work only in `people-intel-test/`. Read this file first. Preserve the approved UI and the now-working Waitlist. The next engineering task is Phase 2 analytics/measurement, followed by Search Console and controlled US/JP traffic validation. Treat GitHub issues #1 and #2 as the current open work items.