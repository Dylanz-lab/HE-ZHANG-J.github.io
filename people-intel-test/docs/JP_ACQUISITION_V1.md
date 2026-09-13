# VeriScope Japan Acquisition V1

Status: planning baseline after GA4 + waitlist production validation.

## Goal
Validate whether Japan has a strong, repeatable acquisition wedge for photo-to-public-context research before building live face-search infrastructure.

Primary success metric: **confirmed waitlist signups / qualified landing sessions**, segmented by landing-page theme, country, language, and source.

Supporting funnel:
`page_view -> demo_start -> source_open -> pricing_view -> signup_open -> signup_complete`

Do not combine `signup_duplicate`, `signup_error`, or preview events with confirmed signup conversion.

---

## 1. Landing-page theme experiments

### A. Dating / pre-meeting profile consistency — P0
Working Japanese positioning:
- 会う前に、公開プロフィールの一貫性を確認する
- 1枚の写真から、公開ページとプロフィールの違いを確認
- 写真の一致は手がかり。本人確認や不正の証明ではない

User problem:
- Met someone through a matching/dating app.
- Wants to know whether the public story around the profile photo is consistent before meeting or trusting the profile.

Why first:
- Closest to current product capability and current demo.
- Clear urgency without promising surveillance or a definitive judgment.

Suggested path: `/people-intel-test/ja/dating-check/`

### B. Photo misuse / fake-profile check — P0/P1
Working Japanese positioning:
- この写真、別の名前で使われていない？
- プロフィール写真の出どころと公開上の使われ方を確認

Intent examples:
- 拾い画 チェッカー
- マッチングアプリ 写真 本物
- 写真 悪用 チェック
- なりすまし 写真

Suggested path: `/people-intel-test/ja/photo-check/`

### C. Cheating / relationship suspicion — experiment only, not core brand
Do **not** promise “upload a photo and find out whether someone is cheating.” A photo/public-web search cannot establish infidelity.

Safer test framing:
- 気になる相手の公開プロフィールに不一致はないか？
- 見慣れた写真が、意外な公開ページで使われていないか確認
- 事実を断定せず、公開情報の手がかりを整理

Potential SEO/test terms:
- 浮気 チェッカー
- 浮気 調査 写真
- マッチングアプリ 既婚者 見分け方

Use this as a dedicated experiment page or content cluster. Keep it separate from the main VeriScope identity.

Suggested path: `/people-intel-test/ja/relationship-check/`

### D. Romance scam / catfish safety — P1
Working positioning:
- 写真が別人のものではないか、公開情報から確認
- ロマンス詐欺・なりすましの手がかりを探す

Suggested path: `/people-intel-test/ja/catfish-check/`

---

## 2. SEO plan

### Technical P0
- Keep canonical + hreflang correct for every indexed page.
- Add every production intent page to sitemap.
- Noindex QA, metrics, or internal preview pages.
- Give each page a unique title, meta description, H1, and copy; do not make thin doorway pages with only keyword swaps.
- Link intent pages from the main JA page through a useful “Use cases” section.
- Keep URLs static; do not rely on `?market=` for SEO localization.

### Keyword clusters

#### Core face/photo search
- 顔写真 検索
- 顔検索
- 写真から人を探す
- 画像から人物検索
- 写真で人を探す

#### Dating safety / profile consistency
- マッチングアプリ 身元確認
- マッチングアプリ 相手 調べる
- マッチングアプリ 写真 本物
- マッチングアプリ なりすまし
- マッチングアプリ 既婚者 見分け方

#### Photo misuse / impersonation
- 拾い画 チェッカー
- 写真 悪用 チェック
- なりすまし 写真
- 自分の写真 悪用
- プロフィール写真 盗用

#### Romance scam
- ロマンス詐欺 写真
- ロマンス詐欺 見分け方
- 詐欺師 顔写真 検索

#### Relationship suspicion — test only
- 浮気 チェッカー
- 浮気 調査 写真
- 相手 SNS 別アカウント

### Content format
Prioritize high-intent utility pages over generic blog volume.

P0 pages:
1. Matching-app profile photo check landing page
2. Photo misuse / fake profile check landing page
3. “写真から人を探す方法” educational page
4. “マッチングアプリのプロフィール写真が本物か確認する方法” guide
5. “拾い画・なりすましを確認するときのチェックリスト” guide

P1 pages:
6. Romance scam photo-check guide
7. Existing vs reverse-image vs face-search comparison
8. FAQ/legal/privacy explanation for public-web photo search
9. Relationship-suspicion page with strict non-diagnostic wording

### On-page pattern
Each SEO page should contain:
- exact user question in H1 or opening
- direct 2-3 sentence answer
- what the tool can find
- what the tool cannot prove
- fictional demo / example result
- actionable checklist
- CTA to demo / waitlist
- related internal links

---

## 3. Non-SEO acquisition

### P0: controlled traffic for validation
Do not wait for Google indexing to test demand.

Use tagged links for every source, for example:
`?utm_source=x&utm_medium=social&utm_campaign=jp_dating_check`

Channels:
- X: short educational threads/screenshots about checking a dating profile photo before meeting.
- TikTok / Reels / YouTube Shorts: 20-40s “same photo, different public context” demos; no sensational accusations.
- Japanese matching-app / scam-safety creators: small creator outreach with demo access.
- Relevant Japanese blog/affiliate publishers: offer a useful public-web photo-check guide or comparison piece.

### P1: community / earned traffic
- Yahoo!知恵袋: answer real questions helpfully; link only when genuinely relevant.
- note: publish practical safety/checklist articles that lead into the interactive demo.
- Product / AI directories and indie-launch communities for backlinks and discovery.
- Outreach to romance-scam prevention or online-safety communities for feedback rather than “investigation” marketing.

### P1/P2: paid search
Only after a landing page shows organic/manual conversion.

Start with exact/high-intent terms and tiny budgets. Separate campaigns by intent:
- dating verification
- fake/profile photo misuse
- face search generic
- relationship suspicion experiment

Never pool them into one campaign because traffic quality and user expectations differ sharply.

---

## 4. Experiment design

Do not alter the core product demo per traffic source initially. Change only:
- hero problem statement
- page title/meta/H1
- supporting use-case copy
- CTA label if needed

Keep pricing and signup mechanics consistent so conversion is comparable.

Suggested first three variants:

A — Neutral/current
- Identity / public context

B — JP dating safety
- 会う前に、公開プロフィールの一貫性を確認する

C — JP fake-photo / misuse
- この写真、別の名前で使われていない？

Relationship/cheating framing becomes Variant D only after A/B/C produce a baseline.

Working decision thresholds (not universal benchmarks):
- Do not call a winner from fewer than ~100 qualified sessions per variant.
- `demo_start / page_view` < 20%: message/hero likely weak.
- `pricing_view / page_view` < 10%: users are not progressing far enough.
- confirmed `signup_complete / page_view` >= 3%: worth continuing the theme test.
- >= 5% on a clearly qualified source: strong early signal, then test willingness to pay rather than celebrating waitlist alone.

These are working gates for iteration, not proof of product-market fit.

---

## 5. Guardrails

- A face match is a lead, not identity proof.
- Do not claim to determine cheating, marital status, criminality, trustworthiness, or intent from a photo.
- Do not market home addresses, phone numbers, personal email, family/minor discovery, or sensitive-trait inference.
- Keep public-source links/context visible so users can verify evidence themselves.
- Separate “user interest / signup” from payment intent; waitlist conversion alone is not willingness-to-pay proof.

---

## Next execution order

1. Ship typography/readability update on current EN/JA page.
2. Build JA Variant B: dating/pre-meeting consistency landing page.
3. Build JA Variant C: photo misuse/fake-profile landing page.
4. Add both to sitemap + Search Console and instrument `theme`/campaign attribution.
5. Send controlled JP traffic to A/B/C.
6. Evaluate by country=Japan + source + theme using GA4 and confirmed waitlist rows.
7. Only then decide whether to create relationship/cheating Variant D.
