# Persian (fa) locale: session 7 (legal consent and UI label fixes upstream-style, merges, batch 7: channels and models)

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branches: `feat/fa-locale` (the fork), and two new branches from `upstream/main` for later upstream PRs: `fix/legal-consent-sentence` and `fix/ui-label-strings`. `upstream/main` was still at `c2b7a9a` (fetched at the start of this session), so no upstream merge was needed. Session 6 is described in the previous version of this file (`git log -- .fa-review/REPORT.md`, last one at `f397eb6`).

## Decisions applied (session 6's open questions)

| # | Decision | Where it landed |
| --- | --- | --- |
| 1 | Money and number formatting that follows the interface language stays as it is, for every language; offered upstream later as its own PR | unchanged (split PR 5) |
| 2 | Legal consent: one translatable sentence, upstream-style; English must read exactly as upstream | A, merge |
| 3 | `<html lang>` follows the interface language | unchanged |
| 4 | Hard-coded English labels, the subscription status verbs, the redemption dialog's comma join: upstream-style, one branch, one commit per fix | B, merge |
| 5 | Batch 7: channels, then models | C |

## Commits

```
fix/legal-consent-sentence (from upstream/main c2b7a9a)
27317a9 fix(web): translate the legal consent as one sentence
6a660f7 fix(web): translate the sign-in and sign-up terms footer as one sentence   (follow-up)

fix/ui-label-strings (from upstream/main c2b7a9a)
ae1fdc0 fix(web): translate the usage log Tokens column header
d7948da fix(web): translate the token unit in the model price note
2a12c0d fix(web): translate the top-up preset labels
d095f42 fix(web): show the subscription plan status instead of a verb
4004f8f style(web): use a top-level type import in the subscription columns
3a6842a fix(web): describe the deleted redemption codes in one sentence
3b86126 fix(web): translate the inviter ID label in the users list

feat/fa-locale (from f397eb6)
44610c0 Merge branch 'fix/legal-consent-sentence' into feat/fa-locale
b2d14dc Merge branch 'fix/ui-label-strings' into feat/fa-locale
666c43c style(web): put the license header back at the top of 19 files
aaba1b0 feat(i18n): translate the keys from the legal consent and UI label fixes in Persian
cb4c311, 44306fa (.fa-review scripts and screenshots)
8a76a75 feat(i18n): translate the seventh Persian batch, channels (1105 keys)
ada5af2 feat(i18n): translate the seventh Persian batch, models (372 keys)
dfdc4bb (hand-off)
6f7168b Merge branch 'fix/legal-consent-sentence' into feat/fa-locale   (follow-up: terms footer)
c6aaad5 feat(i18n): translate the terms footer sentences in Persian
(this hand-off commit)
```

## A. Upstream branch fix/legal-consent-sentence

- Bug: `auth/components/legal-consent.tsx` joined the two links with the hard-coded `' and the '`, so every language showed English words there and translators could not order the sentence.
- Fix: three keys, one per combination of configured documents, rendered through `<Trans>` with the links as the `agreement` and `privacy` components (the same pattern as `fix/delete-account-confirm-label`); registered in `static-keys.ts`. English renders exactly the upstream text in all three cases (checked with `toBe`). The old key `I have read and agree to the` stays in the locale files (unused now; the script cannot delete keys).
- Values for all seven required locales through the skill's `add-missing-keys.mjs`, then `bun run i18n:sync`. French and Russian get their own articles and cases (l'Accord / la Politique; «принимаю … Политику»), Japanese puts the verb at the end.
- Test `auth/components/__tests__/legal-consent-sentence.test.tsx` (7 cases: 3 English equal to upstream, links and hrefs, 3 Simplified Chinese without Latin letters). On upstream code: `3 failed | 4 passed` (`Received: "我已阅读并同意 用户协议 and the 隐私政策."`); with the fix `7 passed`.
- Lint: the changed files had no errors before or after, so no lint commit. Nothing Persian on the branch.

### A2. Follow-up: the terms footer (commit 6a660f7)

- Bug: `auth/components/terms-footer.tsx`, rendered below the sign-in and sign-up forms, passed its lead text and both link labels untranslated and only translated the joining word: Simplified Chinese showed `By creating an account, you agree to our User Agreement 和 Privacy Policy.`, Persian the same English line with «و».
- Fix: six keys, one per variant (sign-in, sign-up) and case (both documents, user agreement only, privacy policy only), in a `TERMS_FOOTER_KEYS` constant and rendered through `<Trans>` with the links as `agreement` and `privacy` components, the same way as `legal-consent.tsx`; registered in `static-keys.ts`. Links keep their hrefs and classes; nothing renders when neither document is configured (as before).
- Values for the seven required locales through the script, then `bun run i18n:sync`.
- Test `auth/components/__tests__/terms-footer-sentence.test.tsx` (14 cases: 6 English equal to upstream's text for both variants and all three cases, hrefs, nothing rendered without documents, 6 Simplified Chinese without Latin letters). On upstream code: `6 failed | 8 passed` (every English case passes, every Chinese case fails, e.g. `Received: "By clicking sign in, you agree to our User Agreement 和 Privacy Policy."`); with the fix `14 passed`.
- Lint: `terms-footer.tsx` had no errors before or after, the new test and `static-keys.ts` none, so no lint commit.
- Merged into feat/fa-locale again (`6f7168b`, conflict in `static-keys.ts` only, both additions kept); Persian values and a Persian test (`terms-footer-persian.test.tsx`, both variants) in `c6aaad5`.

## B. Upstream branch fix/ui-label-strings

One commit per fix, each with a test (en and zhCN, real locale files, same i18n options as `src/i18n/config.ts`) that fails on `upstream/main` code and passes with the fix:

| Fix | Change | Test (upstream code → fix) |
| --- | --- | --- |
| Usage-log Tokens header | `t('Tokens', { context: 'usage' })`, key `Tokens_usage` (English `Tokens`). The existing `Tokens` key means an API key in some locales (vi «Mã thông báo»), so it is not reused and its meaning is unchanged | `usage-logs/components/__tests__/tokens-header.test.tsx`: 1 failed / 1 passed → 2 passed |
| Model detail price note | `t('Prices shown per {{unit}} tokens', { unit })` at both call sites (dynamic tiers and group table); English unchanged | `pricing/__tests__/price-unit-note.test.tsx`: 1 failed / 1 passed → 2 passed |
| Top-up presets | `Pay {{amount}}`, `Save {{amount}}`, `Minimum {{amount}}`, `{{percent}}% OFF`; `getDiscountLabel(discount, t)` now takes `t` | `wallet/components/__tests__/preset-labels.test.tsx`: 1 failed / 1 passed → 2 passed |
| Subscription status | `t('Enabled')` / `t('Disabled')` (existing keys) instead of the verbs; English changes from Enable/Disable to Enabled/Disabled, which is the fix | `subscriptions/components/__tests__/plan-status-label.test.tsx`: 4 failed → 4 passed |
| Redemption delete-invalid dialog | one `<Trans>` sentence with the three statuses in `<strong>`; English text identical | `redemption-codes/components/__tests__/delete-invalid-sentence.test.tsx`: 1 failed / 1 passed → 2 passed |
| Users list inviter | `t('Inviter ID: {{id}}', { id })` instead of `{t('Inviter')} ID: {id}`; English identical | `users/components/__tests__/inviter-label.test.tsx`: 1 failed / 1 passed → 2 passed |

- `subscriptions-columns.tsx` had one existing lint error (`no-import-type-side-effects`); cleared in the separate commit `4004f8f`. The other changed files had none.
- New keys (8) in all seven required locales through the script, then `bun run i18n:sync`. Frontend only; nothing Persian.
- Not done from the hard-coded list: the account binding labels (`GitHub ID` …) would read the same in every language, and the home terminal demo is a code mock-up.

## Merges into feat/fa-locale

- `44610c0`: conflict in `legal-consent.tsx`, resolved to the fix branch's code plus the fork's `text-start` class. The fork's `t('and')` join is gone; English is upstream's sentence again. The fork's `legal-consent.test.tsx` lost its two join cases (English "and", Persian conjunction) and keeps the RTL alignment case.
- `b2d14dc`: conflicts in `recharge-form-card.tsx` (kept the fix's `t()` calls with the fork's `formatCurrency(…, locale)`) and `static-keys.ts` (both additions).
- `666c43c`: earlier fork commits had added `import { toIntlLocale }` above the license header, and import sorting carried the header down with it in 19 files. Header moved back to the first lines; no code changes (`git diff` is pure moves).
- `aaba1b0`: Persian for the 11 new keys, and a Persian case in `legal-consent.test.tsx` («توافق‌نامۀ کاربری و سیاست حریم خصوصی را خوانده‌ام و می‌پذیرم.», no English words, both links).

## C. Translation batch 7: channels and models

- **1477 keys** added (0 existing values changed): channels **1105**, models **372**. `fa.json` now has **3524 keys**; 3265 fall back to English.
- Scope: every `en.json` key that appears as a string literal in `web/src/features/channels` or `web/src/features/models` (t() calls, `labelKey`/`descriptionKey`/`detailKey` constants, provider labels and descriptions, parameter-override operations, message constants), except keys that are only identifiers or would read the same in Persian. After the batch a scan of both folders finds no such key left.
- Method: the keys were split into chunks; each chunk was drafted from its call sites against `docs/i18n/fa.md` and a shared channel glossary, with a checker that runs the `check-fa` rules plus placeholder and markup equality. I reviewed the drafts, aligned terms across chunks (regex «عبارت باقاعده» as in the existing `Regex Replace`, catch-all «فراگیر», connection shards «بخش‌های اتصال»), and wrote them through `add-missing-keys.mjs` (created, run, deleted per batch; its `newKeys` object read from a JSON file), then `bun run i18n:sync` and `bun run i18n:check-fa`.
- Terms used (candidates for the glossary): pass-through «عبور مستقیم», override «بازنویسی», model redirect «تغییر مسیر مدل», weight «وزن», multi-key «چندکلیدی», polling «نوبتی», credential «اعتبارنامه», endpoint «نقطۀ پایانی», route/fallback «مسیر / مسیر پیش‌فرض», forwarding «هدایت», converter «مبدل», source/target «مبدأ / مقصد», metadata «فراداده», container «کانتینر», replica «رپلیکا», snapshot «نمونه», reset credit «اعتبار بازنشانی».
- Left out on purpose: provider, product and model names (54 channel type labels), example values (`socks5://…`, URLs, `gpt-3.5-turbo`), identifiers that only match an English key (`default`, `pending`, `running`, `_copy`), `h`/`m`/`s` (glued to the number in code), `more mapping` (the code appends an English `s`), and an example that needs Latin commas.
- Keys shared with other pages were checked at their other call sites (`Free` in the system-info disk tooltip, `failed` in the task-history filter, `to` in billing time fields, `Response`/`Rerank` as endpoint labels).
- Fragments: the "Full Base URL (supports" + `{model}` + "variable)" pair puts the verb in the second fragment (`variable` has only that call site); `model` stays untranslated so the literal `{model}` is not shown as `{مدل}`.
- The high-risk retry confirmation phrase, which the admin must type exactly, avoids ZWNJ and ۀ so it can be typed on a standard Persian keyboard.

## D. Upstream split plan (proposal only; nothing built)

Sizes are from the branch commits against `c2b7a9a`, excluding `.fa-review/` and `fa.json`. Commits that mix concerns (marked *) need their hunks split when the PR branch is built.

Upstream-ready branches in the fork (each from `upstream/main`):

| Branch | Head | Content |
| --- | --- | --- |
| `fix/dashboard-chart-time-order` | `81b140e` | chart points ordered by timestamp (session 5); **merged** (`bc388d4`). The branch now ends at `81b140e`: its lint-cleanup commit `04b86d9` was dropped from the branch, but feat/fa-locale still has it through the earlier merge `bc388d4`. When PRs are cut from feat/fa-locale, `04b86d9` belongs to no upstream branch: leave it out, or fold it into PR 1 if its lint fixes touch files that PR changes |
| `fix/billing-status-label` | `6bf13ab` | billing history status through `t()` (session 6); not merged |
| `fix/delete-account-confirm-label` | `747769c` | delete-account confirmation as one `Trans` sentence; not merged |
| `fix/2fa-setup-step-label` | `6d614c0` | earlier session; not merged |
| `fix/quota-insufficient-i18n` | `28b7893` | earlier session; not merged |
| `fix/legal-consent-sentence` | `6a660f7` | this session (consent line + terms footer); **merged** (`44610c0`, again `6f7168b`) |
| `fix/ui-label-strings` | `3b86126` | this session; **merged** (`b2d14dc`) |

`feat/fa-locale` contains, by merge, `fix/dashboard-chart-time-order`, `fix/legal-consent-sentence` and `fix/ui-label-strings`.

| # | PR | Commits / files | Tests | Other languages |
| --- | --- | --- | --- | --- |
| 1 | `fix(web): right-to-left layout in shared components` | `c78c83f`* (without the `formatQuota` locale hunks; its legal-consent hunk is now superseded by the merge), `d8ee064`, `cb25020`, `8ccec81`, `936ab28`, `129d598`, the RTL half of `f01c5af`*, the sidebar side of `b2720c9`*, and `666c43c` (header positions, only where PR 1 touches the file) | rtl-layout, code-block-direction, column-pinning, column-resize-direction, app-sidebar-direction, date-range-direction, terminal-direction, profile-header-direction, value-direction, timing-direction, spinner-direction, appended cases | No visible change in LTR |
| 2 | `feat(i18n): Persian (fa) partial locale, tooling and docs` + first batch | `b2720c9`* (without the sidebar), `07e070d`, `759a31e`, `f5296da` + `776c03c`, `bfe01bb`, the script part of `fa96f8b`; AGENTS.md, web/AGENTS.md, the i18n skill; `docs/i18n/fa.md` | languages, direction-provider, check-fa, persian-monospace, intl-locale lint case | Language switcher lists «فارسی»; `<html lang>` follows the interface language; `docs/i18n/fa.md` is a new file under `docs/` (ask the maintainers) |
| 3 | `feat(web): Solar Hijri dates, chart axes and date pickers in Persian` | `0ea975e`, `c2369c8` + `42a98a2`, `170ba72`, `9d22fac` | display-date-locale, activity-time-cell-dates, login-session-dates, date-picker-display, calendar-persian, chart-time-locale | None |
| 4 | `feat(web): Persian labels for audit roles and sign-in methods` | net of `f767402` + `9cd40a8` | audit-content-locale, details-locale | None (could fold into 3) |
| 5 | `fix(web): format money and numbers in the interface language` | locale half of `f01c5af`*, `formatQuota` hunks of `c78c83f`*, the `locale` argument in `recharge-form-card.tsx` | format-quota-locale, format-currency-locale, amount-locale, summary-cards-locale, profile-header-locale | **Yes**: an English interface in a German browser shows `$1,234.5` instead of `1.234,5 $`; its own PR (decision 1) |
| 6 | `feat(i18n): Persian translation batches` | `fa96f8b`, `551a8a3`, `795d296`, `4db67e2`, `3825299`, `aaba1b0`, `8a76a75`, `ada5af2`, `c6aaad5` (fa.json, plus the Persian cases in `legal-consent.test.tsx` and `terms-footer-persian.test.tsx`) | `bun run i18n:check-fa` | None: only `fa.json` |

The old PR 6 (legal consent join) is dropped: it is the `fix/legal-consent-sentence` branch now. Leave out of every PR: `.fa-review/`, all hand-off commits, the merge commits (their branches go as their own PRs). Order: the upstream fix branches first, then 1, 2, 3 (+4), 6; 5 when upstream agrees to the behaviour change.

## E. Verification

### feat/fa-locale (from `web/`; re-run after the terms footer follow-up at `c6aaad5`)

| Command | Result |
| --- | --- |
| `git remote -v`, `git push --dry-run origin HEAD`, dry run to a new branch | origin `https://github.com/yaser-k/new-api-fork`; both accepted after fast-forwarding the local branch from `d263b5f` to `f397eb6` |
| `git fetch upstream main` | `upstream/main` = `c2b7a9a`; push URL `DISABLED` |
| `bun install` | done (1206 packages) |
| `bun run typecheck` | `tsgo -b`, exit 0 |
| `bun run lint` | exit 1: **150 errors, 65 warnings**; `upstream/main` (own worktree and install): **182 errors, 66 warnings**; errors only on this branch (by file, rule and message): **none** |
| `bunx oxlint -c .oxlintrc.json <174 changed .ts/.tsx/.mjs files>` | exit 0, **0 errors**, 8 warnings, all pre-existing |
| `bun run test` | `Test Files 205 passed (205)`, `Tests 2337 passed (2337)` |
| `bun run build` | exit 0, total 66674.4 kB / 20550.4 kB gzip |
| `bun run i18n:sync` | exit 0; fa partial, missing 3265, extras 0; seven required locales missing 0; no file changed |
| `bun run i18n:check-fa` | `check-fa: 3530 keys, no findings` |
| `git diff --stat upstream/main -- web/src/i18n/locales/` | `fa.json` +3534; en, fr, ja, ru, vi, zh-TW, zh +17 each: exactly the 9 keys from A (3 consent + 6 footer) and the 8 from B |
| `go build -o <scratch>/bin/new-api-feat .` (Go 1.25.1) | exit 0, embeds the fresh `web/dist` |

### Upstream branches (worktrees from `upstream/main`, `web/`)

| Command | fix/legal-consent-sentence | fix/ui-label-strings |
| --- | --- | --- |
| `bun install` | 1202 packages | 1202 packages |
| `bun run typecheck` | exit 0 | exit 0 |
| `bunx oxlint` on the changed files | exit 0, no findings | exit 0, no findings (after `4004f8f`) |
| new tests | consent 7 passed (upstream code 3 failed / 4 passed); footer 14 passed (upstream code 6 failed / 8 passed) | see table in B |
| `bun run test` | 168 files, 2132 tests passed (after the footer commit) | 172 files, 2125 tests passed |
| `bun run build` | exit 0, 66178.8 kB / 20344.1 kB | exit 0, 66169.6 kB / 20343.4 kB |
| `bun run i18n:sync` | exit 0, no file changed | exit 0, no file changed |
| `go build` | exit 0 | exit 0 |

### Running app

```
# one SQLite database seeded on the upstream/main binary, then copied for each binary
scratchpad/start.sh up 3301           # rate limits off for the scratch server only
python3 .fa-review/scripts/seed.py  http://127.0.0.1:3301 <db> en   # /api/setup creates the local admin; demo data
python3 .fa-review/scripts/seed6.py http://127.0.0.1:3301 <db>      # compliance, redemption codes, a plan, top-ups
python3 .fa-review/scripts/seed7.py http://127.0.0.1:3301           # legal docs, demo Epay + 20% discount on 100, 2 more channels, vendor, 3 models
python3 .fa-review/scripts/seed6.py <url> lang en|zhCN|fa           # saved interface language before each run
node shots7.mjs http://127.0.0.1:3301 .fa-review fixes before en    # upstream/main
node shots7.mjs http://127.0.0.1:3301 .fa-review fixes before zhCN
node shots7.mjs http://127.0.0.1:3302 <dir> fixes after en|zhCN     # fix/legal-consent-sentence binary (85 kept)
node shots7.mjs http://127.0.0.1:3303 <dir> fixes after en|zhCN     # fix/ui-label-strings binary (86-89 kept)
node shots7.mjs http://127.0.0.1:3300 .fa-review fa                 # feat/fa-locale binary
```

Playwright 1.56.1 (global), Chromium 141.0.7390.37 headless, 1440×900, light theme, UTC. The script counts the colours of every capture (every 4th pixel) and flags fewer than 16 as blank: every capture has 1259 or more colours.

| Fix (page) | | before (`upstream/main`) | after |
| --- | --- | --- | --- |
| Legal consent (`/sign-up`) | en | I have read and agree to the User Agreement and the Privacy Policy. | identical |
| | zh | 我已阅读并同意 用户协议 and the 隐私政策. | 我已阅读并同意用户协议和隐私政策。 |
| Tokens header (`/usage-logs/common`) | en | Tokens | Tokens |
| | zh | Tokens | Token |
| Top-up presets (`/wallet`) | en | 20% OFF · Pay 584 • Save 146 · placeholder Minimum 1 | identical |
| | zh | 20% OFF · Pay 584 • Save 146 · Minimum 1 | 优惠 20% · 支付 584 • 节省 146 · 最低 1 |
| Subscription status (`/subscriptions`) | en | Enable | Enabled |
| | zh | 启用 | 已启用 |
| Delete invalid (`/redemption-codes`) | en | This will delete all used, disabled, and expired redemption codes. | identical |
| | zh | 这将删除所有 已使用, 已禁用，和 已过期 兑换码。 | 这将删除所有已使用、已禁用和已过期的兑换码。 |

| Terms footer, sign-in (`/sign-in`) | en | By clicking sign in, you agree to our User Agreement and Privacy Policy. | identical |
| | zh | By clicking sign in, you agree to our User Agreement 和 Privacy Policy. | 点击登录即表示您同意我们的用户协议和隐私政策。 |
| Terms footer, sign-up (`/sign-up`) | en | By creating an account, you agree to our User Agreement and Privacy Policy. | identical |
| | zh | By creating an account, you agree to our User Agreement 和 Privacy Policy. | 创建账户即表示您同意我们的用户协议和隐私政策。 |

Screenshots `85`–`91-*-{before,after}-{en,zhCN}.png` (footer: `node shots7.mjs <url> .fa-review footer before|after en|zhCN`, signed out; the `85-*-after-*` files were retaken on the follow-up binary, so the footer below the consent line is translated there too). Footer runs log only the 401. Console errors in every run: a 401 from the pre-login session probe and `ERR_CERT_AUTHORITY_INVALID` for an external resource blocked by the sandbox proxy. `<html lang>` is `en` in all upstream runs (upstream keeps it fixed).

Persian (feat binary): `92-terms-footer-sign-in-rtl.png` («با کلیک روی «ورود»، توافق‌نامۀ کاربری و سیاست حریم خصوصی ما را می‌پذیرید.», `dir=rtl`), `93-terms-footer-sign-up-rtl.png` («با ساخت حساب کاربری، توافق‌نامۀ کاربری و سیاست حریم خصوصی ما را می‌پذیرید.»), `80-sign-up-consent-rtl.png` (retaken, footer now Persian) («توافق‌نامۀ کاربری و سیاست حریم خصوصی را خوانده‌ام و می‌پذیرم.», `dir=rtl lang=fa`), `81-channels-rtl.png` (card view), `82-channel-edit-drawer-rtl.png` («ویرایش کانال Azure …»), `83-models-rtl.png`, `84-model-edit-rtl.png`. Same two console errors.

## Remaining issues

1. **Code bugs found while translating** (English affected too; candidates for a later upstream fix):
   - `channels/components/data-table-bulk-actions.tsx`: `t('Set a tag for')` and `t('Are you sure you want to delete')` are followed by the count with no space ("for5").
   - `Update balance for:`, `Edit Tag:`, `Create a copy of:`, `Edit all channels with tag:` run into the name with no space.
   - `more mapping`: the code appends an English `s` for plurals (left out of fa.json).
   - `h`, `m`, `s` time units are glued to the number (left out of fa.json).
   - `lib/channel-actions.ts`: `{{field}} updated to {{value}}` gets the raw English field name (Priority, Weight).
   - `Concatenate channel system prompt with user&apos;s prompt` contains a literal `&apos;` (like the session 6 `you&apos;re`).
2. **Model edit dialog**: the icon field labels (`Inherit vendor icon`, `Custom model icon`, `Effective icon`, `Inherited from {{vendor}}`) come from the shared `components/lobe-icon-field.tsx` and are still English in Persian; the sidebar toggle label `Toggle Sidebar` is not an i18n key.
3. **Response-time badge**: `{{value}}ms` becomes «… میلی‌ثانیه», longer than `ms`; the column width was not checked in a table view (the channels page opens in card view).
4. Session 6 items still open: dashboard chart header total, subscriptions list digits and `-ml-1.5`, audit details `ID`, native date inputs, chart time axis direction, backend content in Chinese or English, `{{action}}` raw in two audit strings, carousel arrows, other `<pre>` blocks, the Public Sans font name mismatch.

## New open questions

1. **Glossary**: add the channel and model terms from C to `docs/i18n/fa.md` (a docs change; it is an existing file)?
2. **Upstream candidates from the remaining issues**: one more upstream branch for the missing spaces, `more mapping`, the time units and the priority/weight field name, like `fix/ui-label-strings`?
3. **Next batch**: system settings, or the playground and the remaining shared components (`lobe-icon-field`, data table and layout labels)?
