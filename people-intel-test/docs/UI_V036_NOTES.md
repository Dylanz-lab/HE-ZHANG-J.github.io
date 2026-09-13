# VeriScope UI V0.3.6 — Readability Pass

Implemented on `master`.

## Scope
Typography/readability only. No change to visual palette, interaction model, analytics, waitlist transport, pricing, or product claims.

## Main changes
- Navigation + CTA text increased.
- Hero supporting copy increased to 21px desktop / 18px mobile.
- General buttons increased to 16px and minimum touch height raised.
- Demo result titles, metadata, detail copy, evidence CTA and next-step note increased.
- Workflow explanation text increased.
- Story and pricing body copy increased to 18px desktop.
- Pricing bullets + CTA increased.
- FAQ questions/answers increased substantially and click targets made taller.
- Modal/form/privacy copy increased for readability.
- Japanese hero/FAQ sizes tuned separately so localization remains balanced.

## Why
Screenshots at desktop width showed strong visual hierarchy in headings but undersized secondary copy, demo metadata, pricing details, and FAQs. This pass keeps the existing visual direction while improving scanability and conversion readability.

## QA
Check at:
- desktop 1440px+
- laptop ~1280px
- mobile <= 760px
- narrow mobile <= 355px

Verify no overflow in EN/JA and that FAQ, pricing card, demo list and floating hero cards remain balanced.
