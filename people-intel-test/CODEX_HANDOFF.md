# Codex Handoff — VeriScope

## Repository entry point
- Repository: `Dylanz-lab/HE-ZHANG-J.github.io`
- Branch: **`master`** (not `main`)
- Project directory: `people-intel-test/`
- Live page: https://dylanz-lab.github.io/HE-ZHANG-J.github.io/people-intel-test/

## Current baseline
The current product baseline is **VeriScope V0.3.3**.

At the time this handoff was created, the baseline commit before this handoff file was:
`8985c69a4b420b8e60a383fc18e55f1d3fe38a17`

That commit message is:
`Load V0.3.3 typography readability tuning`

Do not start from an older archive or preview file outside `people-intel-test/`.

## Important files
- `people-intel-test/index.html` — English production page
- `people-intel-test/ja/index.html` — Japanese production page
- `people-intel-test/assets/style.css` — base visual styling
- `people-intel-test/assets/type-tune.css` — V0.3.3 typography/readability overrides
- `people-intel-test/assets/app.js` — client-side demo and form behavior
- `people-intel-test/config.json` — production mode flags / endpoint configuration
- `people-intel-test/sitemap.xml` — SEO sitemap
- `people-intel-test/metrics.html` — setup/status page, not production analytics

## Product state
- UI/layout/palette: approved baseline; avoid redesign unless explicitly requested.
- Copy baseline: `Identity, in focus.`
- EN + JA pages are live.
- Demo interaction is live.
- Typography was enlarged in V0.3.3 for readability.
- Real waitlist is **not enabled yet**.
- Public analytics is **not enabled yet**.
- `config.json` currently keeps waitlist and analytics disabled.

## Current config expectation
The current config is intentionally preview-only:
```json
{
  "version": "0.3",
  "mode": "preview",
  "waitlistEnabled": false,
  "waitlistEndpoint": "",
  "analyticsEnabled": false,
  "apiBase": "",
  "contactEmail": ""
}
```
The waitlist integration code and Apps Script deployment guide are included, but production collection remains disabled. Do not flip these flags or set `waitlistEndpoint` until the real endpoint has been deployed and verified end-to-end.

## Next task: real Waitlist
The next engineering task is to connect the existing waitlist form to a Google Sheet through a lightweight Google Apps Script Web App.

Expected sheet columns:
`signup_time, email, interest, locale, country, utm_source, utm_medium, utm_campaign, utm_content, plan, consent_version, status`

Requirements:
1. Validate email server-side.
2. Deduplicate email addresses.
3. Add honeypot/bot protection.
4. Use a lock for concurrent submissions.
5. Save only necessary fields; never save photos, filenames, face embeddings, or biometric data.
6. `country` may remain `unknown` until there is a trustworthy source for geography.
7. Capture UTM parameters.
8. Show success only after the backend confirms the row was saved or already exists.
9. On network/server error, show retry state; never fake success.
10. Keep EN/JA behavior equivalent.
11. Keep the Apps Script `/exec` URL configurable; do not hardcode secrets.
12. After wiring, run an end-to-end test and verify the row is actually present in the Google Sheet before enabling the live waitlist.

## Google Apps Script deployment dependency
The user still needs to deploy the Apps Script Web App under their Google account and provide the resulting `/exec` URL. Until that URL is available, finish all code behind a disabled/configurable endpoint and stop before enabling production submission.

## Do not change
- Do not modify the unrelated Hexo blog files at repository root.
- Do not redesign the current page by default.
- Do not remove the fictional-sample disclosures.
- Do not imply live face search is available.
- Do not claim signup success without server confirmation.
- Do not commit credentials, API keys, admin secrets, or Google tokens.

## Suggested Codex start command / instruction
Use the repository above, checkout `master`, then work only in `people-intel-test/`. Read this file first, inspect `config.json`, `assets/app.js`, `index.html`, and `ja/index.html`, then implement the waitlist integration while preserving the V0.3.3 visual baseline.
