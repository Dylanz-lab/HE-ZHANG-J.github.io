# VeriScope Waitlist Apps Script

This code is the lightweight backend for the VeriScope early-access form. Bind it directly to the Google Sheet named `VeriScope Waitlist`; it reads and writes only its `Waitlist` tab.

## Before deployment

1. In `VeriScope Waitlist`, create or open the `Waitlist` tab.
2. Set row 1 to these exact columns, in this order:

   ```text
   signup_time, email, interest, locale, country, utm_source, utm_medium, utm_campaign, utm_content, plan, consent_version, status
   ```

3. Select **Extensions → Apps Script**.
4. Replace the default source with the contents of [`Code.gs`](./Code.gs).
5. In **Project Settings → Script Properties**, add:

   | Property | Value |
   | --- | --- |
   | `VERISCOPE_ALLOWED_ORIGINS` | `https://dylanz-lab.github.io` |

   Use a comma-separated list only when another explicitly approved production origin is required. Do not add `*`, development origins, Sheet IDs, or secrets.

## Deploy

1. Select **Deploy → New deployment → Web app**.
2. Set **Execute as** to yourself and access to **Anyone**.
3. Authorize the script for Sheets access, deploy it, then copy the URL ending in `/exec`.
4. Paste that URL into `people-intel-test/config.json` as `waitlistEndpoint`.
5. Keep `mode` as `preview` and `waitlistEnabled` as `false` until the end-to-end checks below pass.
6. Once verified, set `mode` to `live` and `waitlistEnabled` to `true`, then deploy the static site update.

The `/exec` URL is public configuration, not a secret. Do not put a Google token, Sheet ID, deployment editor URL, or `/dev` URL in `config.json`.

## Behavior

- The script validates email, allowed interest/locale/plan values, consent version, and safe UTM values on the server.
- A populated `website` honeypot does not create a row.
- `LockService` covers email lookup and row insertion. Case-insensitive duplicates receive `duplicate` and do not add a row.
- New rows have a server timestamp, `country` set to `unknown`, and `status` set to `active`.
- The HTML response sends only a correlated `saved`, `duplicate`, or `error` receipt to the original GitHub Pages iframe. It never returns stored data.
- The code does not receive, store, or process photos, face/biometric data, filenames, files, analytics IDs, or arbitrary request fields.

## End-to-end test matrix

Perform these tests against the deployed `/exec` URL and the real Sheet before enabling live collection.

| Request | Browser outcome | Sheet outcome |
| --- | --- | --- |
| Valid EN email with safe UTM values | Saved confirmation after server receipt | One new ordered row; country `unknown`; status `active` |
| Same email with different capitalization | Already-joined confirmation | Row count is unchanged |
| Valid JA email | Saved confirmation | One row with locale `ja` and plan `jpy_980` |
| Invalid email | Browser validation or retry state | Row count is unchanged |
| Filled `website` honeypot | No success state | Row count is unchanged |
| Temporary invalid endpoint | Retry state after timeout | No new row |
| Wrong header row | Retry state | No new row |

Do not record test email addresses, Sheet IDs, deployment IDs, or authorization information in the repository.

## Stop collection

To stop public submissions immediately, publish a static configuration with `waitlistEnabled: false` or `mode: "preview"`. This does not delete existing Sheet rows.
