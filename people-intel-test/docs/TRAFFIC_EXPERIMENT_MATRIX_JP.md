# JP Traffic Experiment Matrix

Use this as the operational matrix once the first theme pages are live.

| Variant | Landing path | Core promise | Primary search/social intent | Risk | Priority |
|---|---|---|---|---|---|
| A Control | `/ja/` | 写真から公開情報の背景を見る | 顔検索 / 写真から人を探す | Low | Control |
| B Dating safety | `/ja/dating-check/` | 会う前に公開プロフィールの一貫性を確認 | マッチングアプリ 身元確認 / 写真 本物 | Low-Med | P0 |
| C Photo misuse | `/ja/photo-check/` | この写真、別の名前で使われていない？ | 拾い画 / なりすまし / 写真悪用 | Low-Med | P0 |
| D Romance scam | `/ja/catfish-check/` | 写真が別人のものではないか手がかりを確認 | ロマンス詐欺 / なりすまし | Medium | P1 |
| E Relationship suspicion | `/ja/relationship-check/` | 公開プロフィールに不一致がないか確認 | 浮気チェッカー / 別アカウント | High expectation mismatch | P2 experiment |

## Required tracking

For every external link add:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- optional `utm_content`

Suggested campaign names:
- `jp_control`
- `jp_dating_check`
- `jp_photo_check`
- `jp_catfish_check`
- `jp_relationship_check`

Read results by:
1. country = Japan
2. landing page path
3. source / medium
4. campaign
5. funnel events
6. confirmed waitlist row

## Funnel
`page_view -> demo_start -> source_open -> pricing_view -> signup_open -> signup_complete`

## Interpretation rule
Traffic that clicks but does not progress to `source_open` / `pricing_view` is curiosity, not validated demand.
Traffic that reaches `signup_complete` is interest, not yet willingness to pay.
The next validation after a strong waitlist theme is a paid/fake-door price test or real one-off report checkout, not more traffic alone.
