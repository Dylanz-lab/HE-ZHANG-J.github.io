# Codex Handoff — VeriScope

## Repository entry point
- Repository: `Dylanz-lab/HE-ZHANG-J.github.io`
- Branch: **`master`** (not `main`)
- Project directory: `people-intel-test/`
- Live page: https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/

## Current product baseline
- UI/layout/palette: approved baseline; do not redesign unless explicitly requested.
- Copy baseline: `Identity, in focus.`
- EN + JA pages are live.
- Demo interaction is live.
- Typography readability pass is live.
- Real Waitlist is **live** and has been verified end-to-end.
- Production analytics is still **disabled**.
- Search Console ownership is verified.
- The production sitemap exists at `people-intel-test/sitemap.xml` and contains the EN + JA production URLs.

## Important files
- `people-intel-test/index.html` — English production page
- `people-intel-test/ja/index.html` — Japanese production page
- `people-intel-test/assets/style.css` — base visual styling
- `people-intel-test/assets/type-tune.css` — typography/readability overrides
- `people-intel-test/assets/app.js` — client-side demo, event model and form behavior
- `people-intel-test/assets/waitlist-core.js` — Waitlist validation/shared logic
- `people-intel-test/assets/waitlist-transport.js` — Apps Script submit/receipt bridge
- `people-intel-test/apps-script/Code.gs` — Google Apps Script backend source
- `people-intel-test/config.json` — production mode flags / endpoint configuration
- `people-intel-test/sitemap.xml` — production SEO sitemap (EN + JA)
- `people-intel-test/tests/` — waitlist tests
- `people-intel-test/docs/PHASE2_VALIDATION_SETUP.md` — Phase 2 validation plan

## Waitlist status
The Waitlist is live and verified end-to-end:
production page → Google Apps Script → `VeriScope Waitlist` Google Sheet → receipt → success UI.

Current sheet columns:
`signup_time, email, interest, locale, country, utm_source, utm_medium, utm_campaign, utm_content, plan, consent_version, status`

Known limitation:
- `country` is intentionally `unknown` for now. Do not infer it from locale, page language, timezone, or `?market=`. See GitHub Issue #1.

## Search Console status
- URL-prefix property verified for:
  `https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/`
- Verification method: HTML meta tag on the English production homepage. Do not remove the verification meta tag.
- EN + JA production URLs have been added to indexing tracking.
- Initial URL Inspection state for both: `URL is unknown to Google`.
- Sitemap submitted in Search Console:
  `https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/sitemap.xml`
- Immediately after submission, the Search Console UI may show `Couldn't fetch` / Type `Unknown`; this can be transient while Google processes a new sitemap.
- The sitemap file itself is valid XML and contains exactly 2 URLs (EN + JA). GSC Wizard can fetch and parse both URLs successfully.
- Do not keep changing or resubmitting the sitemap just because the initial UI status is transient. Recheck after processing; treat sitemap submission, fetchability, and indexing as separate states.

## Phase 2: production measurement
Goal: move from a working landing page + Waitlist to measurable market validation.

Minimum events:
- `page_view`
- `demo_start`
- `demo_view`
- `source_open`
- `pricing_view`
- `signup_open`
- `signup_complete`
- `signup_duplicate`
- `signup_error`

Dimensions:
- locale (`en` / `ja`)
- trustworthy country from analytics / edge layer; otherwise unknown
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`
- device class if available from analytics

Important definitions:
- `signup_complete` means a persisted signup confirmed by backend receipt.
- Never treat button clicks as signup completion.
- Never send email, photos, filenames, face data or biometric data into analytics.

Recommended funnel:
- demo_start / page_view
- source_open / demo_start
- pricing_view / demo_start
- confirmed signup_complete / pricing_view
- confirmed signup_complete / page_view

## Search / market validation plan
See GitHub Issue #2 and `docs/PHASE2_VALIDATION_SETUP.md`.
Sequence:
1. Connect production analytics (GA4 is the current preferred first option).
2. Confirm country/device/source dimensions and custom funnel events.
3. Monitor Search Console sitemap + EN/JA indexing.
4. Run comparable US and Japan controlled traffic tests with UTMs.
5. Evaluate confirmed Waitlist conversion, not raw page views.

Initial problem-intent buckets:
- where a photo appears online
- fake / reused profile photo
- image misuse / impersonation
- public context around a photo

## Do not change
- Do not modify unrelated Hexo blog files at repository root.
- Do not redesign the current page by default.
- Do not remove fictional-sample disclosures.
- Do not imply live face search is available.
- Do not claim signup success without server confirmation.
- Do not commit credentials, API keys, admin secrets, or Google tokens.
- Do not remove Search Console verification metadata unless verification is migrated safely.
- Do not infer visitor country from locale/page language.

## Suggested Codex start instruction
Use repository `Dylanz-lab/HE-ZHANG-J.github.io`, checkout `master`, and work only in `people-intel-test/` unless explicitly instructed otherwise. Read this file, GitHub Issues #1 and #2, `docs/PHASE2_VALIDATION_SETUP.md`, `config.json`, `assets/app.js`, `assets/waitlist-transport.js`, and `apps-script/Code.gs` before making changes. Preserve the current approved visual baseline and the verified Waitlist flow.
