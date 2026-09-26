# Persian (fa) locale: session 6 (Persian-only audit labels, blank Nowruz capture, RTL polish, billing status fix, batch 6, upstream split plan)

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branches: `feat/fa-locale` (the fork) and `fix/billing-status-label` (from `upstream/main`, for a later upstream PR). `upstream/main` was still at `c2b7a9a` (fetched at the start of this session), so no merge was needed. Session 5 is described in the previous version of this file (`git log -- .fa-review/REPORT.md`, last one at `251e669`).

## Decisions applied

| # | Decision | Where it landed |
| --- | --- | --- |
| 1 | Audit roles and sign-in methods: Persian only; other languages as upstream | A |
| 2 | Billing-history status label: upstream-style fix on its own branch | D |
| 3 | Blank Nowruz screenshot, RTL issues, small admin pages | B, C, E |
| 4 | Upstream split: plan only | F |
| 5 | Chart legend order stays | unchanged |

## Commits

```
feat/fa-locale (from 251e669)
9cd40a8 fix(web): translate audit roles and sign-in methods in Persian only
936ab28 fix(web): keep code, handles, units and timings in reading order in RTL
129d598 style(web): clear the existing lint errors in the home terminal demo
3825299 feat(i18n): translate the sixth Persian batch (236 keys)
42a98a2 style(web): format the user subscriptions dialog
(this hand-off commit)

fix/billing-status-label (from upstream/main c2b7a9a)
6bf13ab fix(web): translate the top-up status in the billing history
```

## A. Audit roles and sign-in methods: Persian only

- `renderAuditContent(other, t, locale)` (`usage-logs/lib/format.ts`): the role number and the sign-in method are translated only when `isPersianIntlLocale(locale)`; every other language interpolates the recorded values, exactly as upstream (`Created user alice (role 100)`, `Logged in successfully via password`).
- `buildAuditDetails(entry, t, locale)` (`usage-logs/audit/lib/audit-details.ts`): upstream's `AUDIT_ROLE_NAMES` (root, admin, user, guest) are back for the summary, the actor role and the role field; `auditRoleName()` returns the translated role label only for Persian. The sign-in method label keeps upstream's behaviour (upstream already translates it in the viewer).
- Quota amounts: passing the interface locale for every language would not keep en and zh identical to upstream. Upstream formats audit amounts with the runtime default locale, so an English interface in a German browser shows `1 $`; with the interface locale it would show `$1`. The amounts therefore follow the interface locale only in Persian (`quotaText` in `quota-audit-operation.ts`); other languages keep upstream's call. A test pins this with a German runtime default.
- `web/src/features/usage-logs/audit/__tests__/details.test.tsx` is restored byte for byte: `git diff c2b7a9a -- <file>` is empty.
- Tests: `usage-logs/lib/__tests__/audit-content-locale.test.ts` (9: Persian role, method, unknown role, generic HTTP method, Persian digits; en and zh roles, methods and amounts equal to upstream's strings; en with a German browser default), `usage-logs/audit/__tests__/details-locale.test.ts` (5: Persian actor role and role field, Persian method; en and zh raw role names, en and zh method label).
- Proof against both baselines, running the two new files on other sources: on `upstream/main` code, `5 failed | 9 passed` (only the five Persian-translation cases fail, every en and zh case passes); on the session 5 code (`251e669`), `5 failed | 9 passed` (exactly the five "matches upstream" cases fail, including the German-default amount).
- Browser: the English audit log and the `user.create` details dialog were captured on the feat binary (`68-audit-log-en*.png`) and on the `upstream/main` binary with a copy of the same database (`69-audit-log-en-upstream*.png`). The captured row texts, the `user.create` row (`Created user demo-user (role user)`) and the dialog text (`… Role root … Role user …`) are identical (`diff` of the two outputs is empty). Persian: `67-audit-log-rtl.png`, `67b-audit-log-details-rtl.png` («کاربر ⁨demo-user⁩ ساخته شد (نقش ⁨کاربر⁩)», actor role «مدیر ارشد», «ورود موفق با رمز عبور»).

### Upstream test files modified on feat/fa-locale

`git diff --diff-filter=M --name-only c2b7a9a -- '*.test.*'`:

| File | Why |
| --- | --- |
| `web/scripts/oxlint/__tests__/intl-locale.test.ts` | Adds `"fa"` to the valid standard-locales case, so the `project/intl-locale` rule is shown to accept the new interface language. One line. |
| `web/src/components/data-table/core/__tests__/pagination.test.tsx` | Two tests appended: the page-step arrows mirror in RTL (`rtl:rotate-180`). No existing assertion changed. |
| `web/src/features/keys/components/__tests__/api-key-listing.test.tsx` | The quota cell now uses logical `text-start`/`text-end` (it rendered "۵ ۲" in RTL) and wraps each amount in `<bdi dir="ltr">`, so the existing `text-left`/`text-right` assertions became `text-start`/`text-end`, checked on the grid cell (`quotaGridCell`). Three tests appended (logical alignment, LTR-isolated negative amount, Persian digits after a language switch); `afterEach` resets the global language. The only upstream test with changed assertions. |
| `web/src/features/usage-logs/audit/__tests__/viewer.test.tsx` | One test appended: routes and user agents stay left to right in RTL. No existing assertion changed. |
| `web/src/features/usage-logs/components/__tests__/cost-display.test.tsx` | One test appended (Persian digits after switching language); `afterEach` resets the language and removes the fa bundle. A formatting-only change to an upstream assertion from an earlier session was reverted this session. |
| `web/src/features/usage-logs/components/__tests__/detail-preview.test.tsx` | One test appended: the preview uses `text-start`. No existing assertion changed. |

`details.test.tsx` is no longer in this list.

## B. The blank Nowruz screenshot

Reproduced with the session 5 steps (same seed, `shots5.mjs` clock calls: `setSystemTime(2026-01-03T18:00Z)` then `setSystemTime(2026-03-23T18:00Z)` on the same page) against the current binary.

- Not a render error, not a chart crash, not an auth problem: no page errors, the session stayed signed in, the page text and both chart canvases were present, and five seconds later the same page showed the Solar Hijri chart across Nowruz.
- Cause: capture timing with Playwright's fake clock. At capture time the page-transition wrappers (`AnimatedOutlet`, `FadeIn`) had computed `opacity: 0`. Playwright's clock replays its whole log on every page load, so after the second `setSystemTime` the new page's fake `performance.now()` started at the real time elapsed since the first clock call: `perfNow 9889` against `document.timeline.currentTime 3744`. Motion started its opacity Web Animations with a start time from the fake clock (6856 on the real document timeline), so they sat in the delay phase (`currentTime -3111`, then `-545` at the capture) and finished about 7 s after navigation, just after the screenshot. The first dashboard capture had no earlier clock call, so its animation ran at once. Playwright's visibility check ignores opacity, so the script's `canvas` wait passed.
- A real browser has no fake clock (both clocks share one origin), so there is no app bug and no app change. The fix is in the capture: `scripts/shots6.mjs` gives each faked time its own browser context and waits until the content and all its ancestors are fully opaque before each capture.
- Retaken: `31-dashboard-nowruz-rtl.png` (۱۲/۲۵ … ۱۲/۲۹, ۰۱/۰۱ … ۰۱/۰۳) and `30-dashboard-year-boundary-rtl.png`. Blank check on the main area (right-hand sidebar excluded): the old capture had 7 colours and 0.000 non-white pixels; the new one 851 colours and 0.221.

## C. RTL polish on the customer pages

| Issue | Fix | Test (fails on the old code) |
| --- | --- | --- |
| Home terminal demo rendered right to left | `dir="ltr"` on the demo root (`home/components/hero-terminal-demo.tsx`); it is a code mock-up | `home/components/__tests__/terminal-direction.test.tsx` |
| Profile `@admin` shown as `admin@` | `dir="auto"` on the handle span (`profile/components/profile-header.tsx`), so a Latin handle is LTR and an RTL-script handle stays RTL | `profile/components/__tests__/profile-header-direction.test.tsx` |
| Pricing `/1M`, `/1K` toggles and `—t/s`, `—s` | `<bdi dir="ltr">` inside the toggles (`pricing-toolbar.tsx`) and the performance values (`model-perf-badge.tsx`); the dd keeps its RTL alignment | `pricing/__tests__/value-direction.test.tsx` (toggles, empty and measured values) |
| Usage-log timing `127 t/s` shown as `t/s 127` | `dir="ltr"` on the throughput, duration and first-token values (`usage-logs/components/timing-metrics-cell.tsx`); the duration `1m 5s` flipped the same way (`5s 1m`) | `usage-logs/components/__tests__/timing-direction.test.tsx` |
| Button spinners with `mr-2` | `me-2` in the wallet (recharge, transfer, payment confirm, Creem confirm), security (passkey card ×2, 2FA setup) and profile (notification tab) | `wallet/components/__tests__/spinner-direction.test.tsx` (one representative dialog; the other seven are the same class change) |

- Existing components reused: plain `dir` attributes and `<bdi dir="ltr">`, the pattern already used by `quota-details-popover`, `api-key-quota-cell` and `activity-time-cell`. No new component.
- With the old sources: `9 failed`; with the fixes: `9 passed`.
- `hero-terminal-demo.tsx` had 12 upstream lint errors (a tab button without `type`, 11 index keys); cleared in the separate commit `129d598` (keys by line text and character offset; rendering unchanged).
- Browser: `60-home-terminal-rtl.png` (terminal `dir=ltr`), `61-profile-rtl.png` (`@admin`, `dir=auto`), `62-pricing-rtl.png` (toggles `["/1M","/1K"]`, values `—s`, `—t/s`), `63-usage-logs-timing-rtl.png` (`127 t/s`, `dir=ltr`).

### Hard-coded English strings (candidates for a later upstream fix)

Each needs a new key in all seven required locales, so none is fixed on this branch.

| File:line | Text |
| --- | --- |
| `web/src/features/usage-logs/components/columns/common-logs-columns.tsx:735` | column header `header: 'Tokens'` |
| `web/src/features/pricing/components/model-details.tsx:1336`, `:1439` | `tokens` appended after `t('Prices shown per')` and the unit (`1M tokens`) |
| `web/src/features/wallet/components/recharge-form-card.tsx:271` | preset button `Pay {amount}` |
| `web/src/features/wallet/components/recharge-form-card.tsx:275` | preset button `• Save {amount}` |
| `web/src/features/wallet/components/recharge-form-card.tsx:300` | amount placeholder `` `Minimum ${minTopup}` `` |
| `web/src/features/wallet/lib/format.ts:77` | discount badge `` `${off}% OFF` `` |
| `web/src/features/users/components/users-columns.tsx:267` | `{t('Inviter')} ID: {inviterId}` (literal `ID:`) |
| `web/src/features/users/constants.ts:110-115` | binding labels `GitHub ID`, `Discord ID`, `OIDC ID`, `WeChat ID`, `Telegram ID` are passed to `t()` but are missing from `en.json` (English in every language) |
| `web/src/features/home/components/hero-terminal-demo.tsx` | terminal labels `Request`, `Response`, `ms`, `tokens`, `cost`, `stream · sse`, `200 ok` (part of the code mock-up; low priority) |

Related upstream wording bugs found while translating (fixing them would change English, so not here):

- `web/src/features/subscriptions/components/subscriptions-columns.tsx:118`, `:124`: the plan status badge uses the verbs `t('Enable')`/`t('Disable')` instead of `Enabled`/`Disabled`; Persian shows «فعال کردن» (French, Russian and Vietnamese show the verb too).
- `web/src/features/redemption-codes/components/redemptions-primary-buttons.tsx:88-90`: the "delete invalid" sentence is built from six fragments around a literal Latin comma; Persian reads «… استفاده‌شده, غیرفعال، و منقضی حذف می‌شوند.». One key with interpolation would read naturally in every language.
- `web/src/features/redemption-codes/components/redemptions-mutate-drawer.tsx:286`: the key `Click save when you&apos;re done.` contains an HTML entity inside a JS string, so English shows `you&apos;re` literally.

## D. Upstream branch fix/billing-status-label

- Bug: `wallet/components/dialogs/billing-history-dialog.tsx` passed `statusConfig.label` from `getStatusConfig` (`wallet/lib/billing.ts`) to `StatusBadge` without `t()`, so Success, Pending and Expired were English in every language.
- Other places: `getStatusConfig` and `STATUS_CONFIG` have no other callers; `TopupStatus` is shown only in this dialog; payment method names already go through `t()` in `getPaymentMethodName`.
- Fix: `label={t(statusConfig.label)}` (one line). The keys already exist in all seven locales (zh 成功, 待确认, 已过期), so no locale file changes; `i18n:sync` compares against `en.json`, not code, so no registration is needed.
- Test: `wallet/components/__tests__/billing-status-label.test.tsx` renders the dialog with the real en and zh locale files and a mocked API (3 cases: en labels, zh labels, no English labels in zh). On `upstream/main`: `2 failed | 1 passed` (`Unable to find an element with the text: 成功`); with the fix: `3 passed`.
- Lint: the two changed files had no lint errors before or after, so there is no separate lint commit. Nothing Persian on the branch.

| Command (worktree of the branch, `web/`) | Result |
| --- | --- |
| `bun install` | 1202 packages |
| `bun run typecheck` | exit 0 |
| `bunx oxlint -c .oxlintrc.json <2 changed files>` | exit 0, no findings |
| `bunx oxfmt --check <2 changed files>` | clean |
| new test | `3 passed`; on `upstream/main` code `2 failed | 1 passed` |
| `bun run test` | `Test Files 167 passed (167)`, `Tests 2114 passed (2114)`, exit 0 |
| `bun run build` | exit 0, total 66156.8 kB / 20339.0 kB gzip |
| `bun run i18n:sync` | exit 0; en, zh, zh-TW, fr, ja, ru, vi missing 0, extras 0; no file changed |
| `go build` (repo root) | exit 0 |

Browser (`/wallet` → «Order History» button → Billing History dialog; admin sees all orders; Chromium 141.0.7390.37 headless, light theme, 1440×900, UTC):

| | before (`upstream/main`) | after (fix branch) |
| --- | --- | --- |
| English | `Expired`, `Pending`, `Success` (`70-billing-history-before-en.png`) | `Expired`, `Pending`, `Success` (`71-billing-history-after-en.png`) |
| Simplified Chinese | `Expired`, `Pending`, `Success` (`72-billing-history-before-zh.png`) | `已过期`, `待确认`, `成功` (`73-billing-history-after-zh.png`) |

Console errors in all four runs: a 401 from the pre-login session probe and `ERR_CERT_AUTHORITY_INVALID` for an external resource blocked by the sandbox proxy.

## E. Translation batch 6: users, redemption codes, subscriptions

- **236 keys** added (0 existing values changed); `fa.json` now has **2036 keys**, 4742 fall back to English.
- Scope: every en.json key used in `web/src/features/users`, `redemption-codes` and `subscriptions` (string literals and `t()` calls, including keys inside template literals and constants: status and role `labelKey`s, `SUCCESS_MESSAGES`/`ERROR_MESSAGES`, `ACTION_MESSAGES`), plus the 15 admin permission labels and descriptions that the user drawer receives from `service/authz` (`label_key`, `description_key`).
- Each key was read at its call site. Choices: `Redeemed By` «ثبت‌کننده» (glossary: redeem «ثبت کد»), `Root` «مدیر ارشد» (same role as Super Admin), `Deleted` «حذف‌شده» (a status label and a toast share it), `Validity` «دورۀ اعتبار», `Promote`/`Demote` «ارتقا به مدیر»/«تنزل به کاربر عادی» (the menu shows only the applicable one), `Allow balance redemption` «امکان پرداخت با موجودی» (the field is `allow_balance_pay`), `, and` «، و» (check-fa rejects leading whitespace, and the fragment follows a word directly).
- Left out on purpose: identifiers that only match an English key (`tokens`, `override`, `default`, `USD`) and brand names (Stripe, Discord, GitHub, LinuxDO, OIDC, Telegram, WeChat).
- FSI/PDI around `{{plan}}`, `{{username}}`, `{{provider}}` and `{{action}}`; `{{currency}}` follows its existing siblings (`Quota ({{currency}})`) without isolates.
- Written through `add-missing-keys.mjs` (created, run, deleted; fa only), then `bun run i18n:sync` and `bun run i18n:check-fa` (`2036 keys, no findings`).
- Browser: `64-users-rtl.png`, `64b-user-drawer-rtl.png`, `65-redemption-codes-rtl.png`, `65b-redemption-delete-invalid-rtl.png`, `66-subscriptions-rtl.png`.

## F. Upstream split plan (proposal only; nothing built)

Sizes are from the branch commits against `c2b7a9a`, excluding `.fa-review/` and `fa.json`; "tests" is the part of the additions in test files. Commits that mix concerns (marked *) need their hunks split when the PR branch is built.

Already separate upstream-ready branches: `fix/dashboard-chart-time-order` (session 5: `81b140e`, `04b86d9`; changes the chart order in every language, which is the fix) and `fix/billing-status-label` (this session: `6bf13ab`). PR 3 depends on the chart order fix.

| # | PR | Commits / files | Approx. size | Tests | Other languages |
| --- | --- | --- | --- | --- | --- |
| 1 | `fix(web): right-to-left layout in shared components` (usable today with the config drawer's RTL toggle) | `c78c83f`* (without the `formatQuota` locale hunks and the legal-consent join), `d8ee064`, `cb25020`, `8ccec81`, `936ab28`, `129d598`, the RTL half of `f01c5af`* (quota cell logical classes and `<bdi dir="ltr">`, quota popover, token pair isolate), the sidebar side from `b2720c9`* | ~75 files, +1,250 / −170 | ~1,000 lines: `rtl-layout`, `code-block-direction`, `column-pinning`, `column-resize-direction`, `app-sidebar-direction`, `date-range-direction`, `terminal-direction`, `profile-header-direction`, `value-direction`, `timing-direction`, `spinner-direction`, appended cases in `pagination`, `viewer`, `detail-preview`, and the changed `api-key-listing` assertions | No visible change in LTR: logical classes equal the physical ones in LTR, `rtl:` variants apply only under `dir="rtl"`, `dir="ltr"` matches the inherited direction. One nuance: the profile handle's `dir="auto"` renders an RTL-script username in its own direction in an LTR interface. |
| 2 | `feat(i18n): Persian (fa) partial locale, tooling and docs` + first batch | `b2720c9`* (without the sidebar), `07e070d`, `759a31e` (Vazirmatn), `f5296da` + `776c03c` (monospace shaping), `bfe01bb` (isolate check), the script part of `fa96f8b`; `fa.json` first batch (~400 keys); AGENTS.md, web/AGENTS.md, the i18n skill; `docs/i18n/fa.md` | ~25 files, +1,200 / −50, plus fa.json ~400 lines | ~550 lines: `languages`, `direction-provider`, `check-fa`, `persian-monospace`, the `intl-locale` lint case | The language switcher lists «فارسی». `<html lang>` now follows the interface language (upstream keeps a fixed `en`), and the page direction follows the language (a manual LTR/RTL choice in the config drawer is cleared on the next language change). The seven locale files are unchanged. `docs/i18n/fa.md` is a new file under `docs/`, which AGENTS.md reserves for explicit requests: ask the maintainers. |
| 3 | `feat(web): Solar Hijri dates, chart axes and date pickers in Persian` | `0ea975e`, `c2369c8` + `42a98a2`, `170ba72`, `9d22fac` (+ `@daypicker/persian`, `bun.lock` +10 lines) | ~55 files, +1,535 / −350 | ~730 lines: `display-date-locale`, `activity-time-cell-dates`, `login-session-dates`, `date-picker-display`, `calendar-persian`, `chart-time-locale` | None: `formatDisplayDate` returns `dayjs(value).format(pattern)` for every non-Persian locale (tests pin en), the calendar renders the same DayPicker props for other languages, and the Persian calendar is a lazy chunk (75.2 kB / 19.7 kB gzip) loaded only in Persian. |
| 4 | `feat(web): Persian labels for audit roles and sign-in methods` | net of `f767402` + `9cd40a8`: `usage-logs/lib/format.ts`, `quota-audit-operation.ts`, `audit/lib/audit-details.ts`, `login-session-utils.ts` (translator type), locale passed at 4 call sites | ~10 files, +90 / −20 | 303 lines: `audit-content-locale`, `details-locale` | None: en and zh are pinned to upstream's strings, including a German browser default; upstream's `details.test.tsx` is unchanged. Could be folded into PR 3. |
| 5 | `fix(web): format money and numbers in the interface language` | the locale half of `f01c5af`* and the `formatQuota` hunks of `c78c83f`* (dashboard, wallet, usage logs, keys, profile) | ~30 files, +600 / −300 | ~450 lines: `format-quota-locale`, `format-currency-locale`, `amount-locale`, `summary-cards-locale`, `profile-header-locale`, cost-display and api-key-listing cases | **Yes**, whenever the browser language differs from the interface language: an English interface in a German browser showed `1.234,5 $` and now shows `$1,234.5`. This follows web/AGENTS.md ("the interface language drives Intl"); present it as its own PR with that rationale, or gate it to Persian if upstream prefers the current output. |
| 6 | `fix(web): translate the joining word in the legal consent` | the legal-consent hunk of `c78c83f`* | 1 file, +1 / −1 (+ its test) | `legal-consent` | **Yes**: English changes from "… User Agreement and the Privacy Policy" to "… User Agreement and Privacy Policy", and zh and the others get their own «and» instead of English. Upstream-style small fix. |
| 7 | `feat(i18n): Persian translation batches` | `fa96f8b`, `551a8a3`, `795d296`, `4db67e2`, `3825299` (fa.json only; one PR per batch or two PRs) | fa.json only, ~1,640 keys | `bun run i18n:check-fa` | None: only `fa.json`. |

Leave out of every PR: `.fa-review/` and all hand-off commits (`e968fcf`, `39b326f`, `d263b5f`, `a498835`, `251e669` and this session's), the merge commit `bc388d4` (the chart fix goes as its own PR), and the scratch scripts. Nothing on the branch refers to a specific deployment. Order: chart fix and billing fix first, then 1, 2, 3 (+4), 7; 5 and 6 whenever upstream agrees to the behaviour change.

## G. Verification (feat/fa-locale)

All from `web/` unless noted.

| Command | Result |
| --- | --- |
| `git remote -v`, `git push --dry-run origin HEAD`, dry run to a new branch | origin `https://github.com/yaser-k/new-api-fork`; both dry runs accepted (after fast-forwarding the local branch from `d263b5f` to `251e669`) |
| `git fetch upstream main` | `upstream/main` = `c2b7a9a`; push URL `DISABLED` |
| `bun install` | 1206 packages |
| `bun run typecheck` | `tsgo -b`, exit 0 |
| `bun run lint` | exit 1: **151 errors, 65 warnings**; `upstream/main` (clean worktree with its own install): **182 errors, 66 warnings**; errors only on this branch (by file, rule and message): **none** |
| `bunx oxlint -c .oxlintrc.json <159 files changed vs upstream/main>` | exit 0, **0 errors**, 8 warnings, all pre-existing (`sync-i18n.mjs` style ×6, `no-danger` in footer, `self-closing-comp` in redemptions columns) |
| `bunx oxfmt --check <same files>` | one file reported, `cost-display.test.tsx`, which is reported on `upstream/main` too (its upstream lines were restored) |
| `bun run test` | `Test Files 196 passed (196)`, `Tests 2301 passed (2301)`, exit 0 |
| `bun run build` | exit 0, total 66499.8 kB / 20505.7 kB gzip; `index` 4864.1 kB; Persian calendar chunk `async/83353.*.js` 75.2 kB / 19.7 kB |
| `bun run i18n:sync` | exit 0; fa `partial`, missingCount 4742, extras 0, untranslated 0; the seven required locales missing 0 |
| `bun run i18n:check-fa` | `check-fa: 2036 keys, no findings`, exit 0 |
| `git diff --stat upstream/main -- web/src/i18n/locales/` | only `fa.json` (2040 insertions) |
| `go build -o <scratch>/new-api-feat .` (repo root, Go 1.25.1) | exit 0, embeds the fresh `web/dist` |

### Running app

```
# scripts/start-server.sh equivalent (scratch directory, SQLite, rate limits off for the scratch server only)
GLOBAL_WEB_RATE_LIMIT_ENABLE=false GLOBAL_API_RATE_LIMIT_ENABLE=false CRITICAL_RATE_LIMIT_ENABLE=false \
  SQLITE_PATH="<scratch>/app-feat/one-api.db?_busy_timeout=30000" PORT=3300 <scratch>/new-api-feat --log-dir <scratch>/app-feat/logs
python3 .fa-review/scripts/seed.py  http://127.0.0.1:3300 <scratch>/app-feat/one-api.db   # /api/setup creates the local admin, demo data
python3 .fa-review/scripts/seed6.py http://127.0.0.1:3300 <scratch>/app-feat/one-api.db   # compliance, redemption codes, a plan, top-ups
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3300 .fa-review fa                    # from a folder that can import playwright
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3300 .fa-review audit-fa
python3 .fa-review/scripts/seed6.py http://127.0.0.1:3300 lang en
# stop, copy the database to two more scratch folders, start upstream/main on 3301 and the fix branch on 3302
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3300 .fa-review audit-en 68-audit-log-en
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3301 .fa-review audit-en 69-audit-log-en-upstream
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3301 .fa-review billing 70-billing-history-before-en
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3302 .fa-review billing 71-billing-history-after-en
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3301 .fa-review billing 72-billing-history-before-zh zhCN
node .fa-review/scripts/shots6.mjs http://127.0.0.1:3302 .fa-review billing 73-billing-history-after-zh zhCN
```

Playwright 1.56.1 (global), Chromium 141.0.7390.37 headless, 1440×900, light theme, UTC, browser locale `fa-IR`, `en-US` or `zh-CN`. Excerpt of the fa run:

```
page: dir=rtl lang=fa
home terminal dir: ltr
profile handle: «@admin» dir=auto
pricing toggles: ["/1M","/1K"]
pricing perf values: ["—s","—t/s","—s","—t/s","—s","—t/s"]
usage-log throughput: «127 t/s» dir=ltr
delete invalid dialog: «کدهای شارژ نامعتبر حذف شوند؟ با این کار همۀ کدهای شارژ استفاده‌شده, غیرفعال، و منقضی حذف می‌شوند. …»
console errors: 401 on the pre-login session probe (once per sign-in); ERR_CERT_AUTHORITY_INVALID and
  ERR_TUNNEL_CONNECTION_FAILED for external resources blocked by the sandbox proxy
```

- While writing the script, one run clicked the first row-menu item on the users page (Disable) instead of Edit; demo-user was re-enabled through `/api/user/manage`. The audit log therefore also lists a disable and an enable event for demo-user.
- Blank check (main area, sidebar excluded, 200×120 sample): every new screenshot has 236 or more colours; the session 5 blank Nowruz capture had 7.

### Screenshots (new or retaken in this session)

- `30-dashboard-year-boundary-rtl.png`, `31-dashboard-nowruz-rtl.png` (retaken, not blank)
- `60-home-terminal-rtl.png`, `61-profile-rtl.png`, `62-pricing-rtl.png`, `63-usage-logs-timing-rtl.png` (C; they supersede `42-home-rtl.png`, `43-profile-rtl.png`, `39-pricing-rtl.png`)
- `64-users-rtl.png`, `64b-user-drawer-rtl.png`, `65-redemption-codes-rtl.png`, `65b-redemption-delete-invalid-rtl.png`, `66-subscriptions-rtl.png` (E)
- `67-audit-log-rtl.png`, `67b-audit-log-details-rtl.png` (Persian), `68-audit-log-en.png`, `68-audit-log-en-details.png` (feat, English), `69-audit-log-en-upstream.png`, `69-audit-log-en-upstream-details.png` (upstream/main, English)
- `70`–`73-billing-history-*` (upstream branch, before and after, English and Simplified Chinese)

## Remaining RTL and locale issues

1. **Dashboard chart header total** «مجموع: 22.98$»: `formatQuotaTotal` in `dashboard/lib/charts.ts` has no locale and the value is not isolated, so the `$` moves to the end and the digits are Latin.
2. **Subscriptions list**: duration «1 ماه» and priority «10» use Latin digits (raw values), the price `$9.90` is not formatted with the locale, and the status badges use `-ml-1.5` and the verbs Enable/Disable (see C).
3. **Hard-coded strings** in the C list, and the fragment sentence with a Latin comma on the redemption codes page.
4. **Audit details**: `admin (ID: 1)` keeps an English `ID`; the dialog close label is English (session 5 item, still open).
5. **Native date and time inputs** follow the browser locale (session 5 item).
6. **Charts**: the time axis runs left to right in RTL (not changed).
7. Earlier items still open: backend content in Chinese or English (Go i18n is en/zh only), `{{action}}` raw in `Performed {{action}} on user` and now `Failed to {{action}} user`, the users page actions cell `-ml-1.5`, `rtl:` also matching `:lang(fa)` when LTR is forced, carousel arrows, other `<pre>` blocks, the Public Sans font name mismatch.

## New open questions

1. **Number formatting (split PR 5)**: propose the interface-locale formatting upstream as a behaviour change for all languages, or gate it to Persian in the fork so every other language matches upstream everywhere (as done for the audit amounts this session)?
2. **Legal consent join (split PR 6)**: keep `t('and')` (changes the English sentence), or restore `' and the '` for other languages?
3. **Upstream candidates from C**: open one upstream fix for the hard-coded strings (Tokens header, Pay/Save/Minimum/% OFF, model detail tokens, binding ID labels) and one for the subscription status verbs?
4. **Next batch**: channels and models admin pages, or system settings?
