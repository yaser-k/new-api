# Persian (fa) locale: session 5 (chart order, Solar Hijri charts and pickers, audit values, batch 5)

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branch: `feat/fa-locale`. `upstream/main` was still at `c2b7a9a` (fetched at the start of this session), so no upstream merge was needed. Session 4 is described in the previous version of this file (`git log -- .fa-review/REPORT.md`, last one at `a498835`).

## Decisions applied

| # | Decision | Where it landed |
| --- | --- | --- |
| 1 | Chart order fixed upstream-style, then Solar Hijri axes in the fork | A and B below |
| 2 | Date pickers with `@daypicker/persian` | C below |
| 3 | Audit values on feat/fa-locale as their own commit | D below; roles translated in every language (answered during the session) |
| 4 | Batch 5: customer-facing pages | E below, 448 keys |

## Commits

```
fix/dashboard-chart-time-order (from upstream/main c2b7a9a)
81b140e fix(web): order dashboard chart points by time across a year boundary
04b86d9 style(web): clear the existing lint errors in dashboard charts

feat/fa-locale (from a498835)
bc388d4 Merge branch 'fix/dashboard-chart-time-order' into feat/fa-locale
170ba72 feat(web): show Solar Hijri dashboard chart axes in Persian
9d22fac feat(web): Solar Hijri date pickers in Persian with @daypicker/persian
f767402 feat(web): translate roles and sign-in methods in audit content
4db67e2 feat(i18n): translate the fifth Persian batch (448 keys)
(this hand-off commit)
```

## A. Upstream branch fix/dashboard-chart-time-order

- Bug: `dashboard/lib/charts.ts` sorted the `formatChartTime` keys as text (`.sort()`, and `localeCompare` on `Time` for the bar, area and model trend values), so a range from late December to early January drew January first, in every language. `processUserChartData` had the same `.sort()`. No other chart code sorts time labels.
- Fix: each time key keeps the earliest timestamp that produced it; keys sort by that timestamp. The three `localeCompare` re-sorts were removed, because the values are already pushed in chart-time order (stable order within a time point is unchanged). Labels, colors, aggregation and padding are unchanged. The legend's item order follows the data order, so it can differ from before.
- Second commit: the file had 15 pre-existing oxlint errors (web/AGENTS.md 3.2 requires touched files to be error-free). Behavior-preserving cleanup, separate so it can be dropped.
- Test `web/src/features/dashboard/lib/__tests__/chart-time-order.test.ts` (6 cases: day, hour, week, for the model charts and the user trend). On upstream code: `6 failed`, for example `expected [ '01-01', '01-02', '01-03', …(4) ] to deeply equal [ '12-28', '12-29', '12-30', …(4) ]`. With the fix: `6 passed`.

| Command (worktree of the branch) | Result |
| --- | --- |
| `bun run typecheck` | exit 0 |
| `bunx oxlint -c .oxlintrc.json` on the 2 changed files | exit 0, 0 errors, 0 warnings |
| `bunx oxfmt --check` on them | clean |
| new test | `6 passed`; on upstream code `6 failed` |
| `bun run test` | `Test Files 167 passed (167)`, `Tests 2117 passed (2117)` |
| `bun run build` | exit 0, total 66156.8 kB / 20339.0 kB gzip |
| `go build` | exit 0 |

Browser check (English, Chromium 141.0.7390.37 headless, light theme, 1440×900, UTC, page clock set to 2026-01-03 18:00 UTC, `/dashboard/models`, 7 days, daily):

- before (`upstream/main`, `46-upstream-chart-before-en.png`): 01-01, 01-02, 01-03, 12-27, 12-28, 12-29, 12-30, 12-31
- after (fix branch, `47-upstream-chart-after-en.png`): 12-27, 12-28, 12-29, 12-30, 12-31, 01-01, 01-02, 01-03
- console errors in both runs: a 401 from the pre-login session probe, `ERR_CERT_AUTHORITY_INVALID` for external resources blocked by the sandbox proxy

## B. Solar Hijri chart axes

- `processChartData(…, locale)` and `processUserChartData(…, locale)` pass the locale to `formatChartTime`; the model charts, the consumption distribution chart and the user charts compute it at render with `toIntlLocale(i18n.resolvedLanguage || i18n.language)`.
- Test `dashboard/lib/__tests__/chart-time-locale.test.ts` (5): fa day, hour and week across Nowruz (`۱۲/۲۶ … ۱۲/۲۹, ۰۱/۰۱ … ۰۱/۰۳`, hour `۱۲/۲۹ ۲۳:۰۰` then `۰۱/۰۱ ۰۰:۰۰`, week `۱۲/۲۵ - ۰۱/۰۲`), fa user trend, en Gregorian and identical to no locale.
- Screens: `30-dashboard-year-boundary-rtl.png` (۱۰/۰۶ … ۱۰/۱۳, i.e. 27 Dec to 3 Jan), `31-dashboard-nowruz-rtl.png` (۱۲/۲۵ … ۱۲/۲۹, ۰۱/۰۱ … ۰۱/۰۳), `40-dashboard-year-boundary-en.png` (English unchanged).

## C. Persian date pickers

Evaluation (web/AGENTS.md 3.15), from the npm registry (the download-count API is blocked by the sandbox proxy, 403):

| Package | Version | License | Maintainer / repo | Unpacked | Last publish |
| --- | --- | --- | --- | --- | --- |
| `@daypicker/persian` | 10.0.1 | MIT | gpbl, `gpbl/react-day-picker` | 40.3 kB | 2026-05-15 |
| `@daypicker/react` (dep) | 10.0.1 | MIT | same | 57.2 kB (re-exports `react-day-picker`) | 2026-05-15 |
| `date-fns-jalali` (dep, pinned `4.1.0-0`) | latest 4.4.0-0 | MIT | smmoosavi, `date-fns-jalali/date-fns-jalali` | 4.46 MB (full date-fns fork) | 2026-05-31 |

- Added with `bun add @daypicker/persian@^10.0.1` (same range as `react-day-picker`). 3 packages installed. `bun.lock` has a single `react-day-picker@10.0.1`, and `node_modules` has one copy. Version lock noted in `docs/i18n/fa.md` and next to the lazy import.
- `components/ui/calendar.tsx`: in Persian it renders the add-on's `DayPicker` through `React.lazy`, with the same classNames and components, `dir` from the direction provider (`useDirection`), numerals from `Intl.NumberFormat(PERSIAN_INTL_LOCALE).resolvedOptions().numberingSystem` (`arabext` for `fa`, `latn` for `fa-u-nu-latn`), and the add-on's own Persian locale and month names. Other languages render the same DayPicker with the same props as before.
- Trigger text through `formatDisplayDate`: `date-picker.tsx`, `datetime-picker.tsx`, and the usage-log range picker (label and mobile label). The Date values are unchanged; the native `datetime-local` inputs inside the range picker are drawn by the browser and stay Gregorian.
- Tests: `components/ui/__tests__/calendar-persian.test.tsx` (4: en synchronous Gregorian; fa `مهر ۱۴۰۵` with Persian digits and the provider's `rtl`; picking 3 Mehr returns the same Date as picking September 25 in English; en→fa→en without a reload), `components/__tests__/date-picker-display.test.tsx` (4), one fa case in `usage-logs/components/__tests__/date-range-direction.test.tsx`. With the old sources: `7 failed / 4 passed` (all fa cases fail, the en cases pass).
- Bundle: the calendar is its own async chunk, `static/js/async/83353.*.js` 75.2 kB / 19.7 kB gzip, not in the initial `index` bundle. Total build 66369.1 kB → 66479.5 kB (+110.4 kB, +29.3 kB gzip) against the session start; the initial `index` bundle grew 34.9 kB (+9.5 kB gzip), which is the new fa.json text (37.2 kB of added lines; all locale files ship in the initial bundle, as before).
- Browser: `32-date-picker-rtl.png` (dashboard filter, trigger «۱۴۰۴/۱۲/۲۵», grid «اسفند ۱۴۰۴», `dir=rtl`), `33-usage-log-range-picker-rtl.png` (trigger «۱۴۰۵/۰۷/۰۳ ۰۰:۰۰ ~ …», start input value `2026-09-25T00:00`), `41-date-picker-en.png` (English unchanged, «December 2025»).

## D. Audit values

- `renderAuditContent(other, t, locale)`: `role` numbers (0, 1, 10, 100) are shown with the `lib/roles.ts` labels (Guest, User, Admin, Super Admin); `method` with `loginMethodLabel` (except the `generic` descriptor, whose `{{method}}` is the HTTP method); unknown role numbers stay as recorded.
- The audit viewer's role field and actor role use the same labels instead of `root/admin/user/guest` (in every language, as answered during the session). The 8 upstream tests that asserted the raw names now assert the labels.
- Quota amounts in the descriptors follow the interface locale: `buildQuotaAuditOperation`, `renderAuditContent` and `buildAuditDetails` take it from the callers (usage-log columns and details dialog, audit columns and details dialog).
- `loginMethodLabel` accepts a plain `(key) => string` translator (TFunction still fits).
- Test `usage-logs/lib/__tests__/audit-content-locale.test.ts` (8: en, fa and zh role labels, unknown role, en and fa methods, generic HTTP method, en and fa amounts). With the old sources: `14 failed / 42 passed` across it and the updated audit tests.
- Browser: `35-audit-log-rtl.png` («ورود موفق با رمز عبور»), `36-audit-log-details-rtl.png` («کاربر ⁨demo-user⁩ ساخته شد (نقش ⁨کاربر⁩)», actor role «مدیر ارشد»), `34-usage-logs-details-rtl.png`.

## E. Translation batch 5

- **448 keys** added (0 existing values changed); `fa.json` now has **1800 keys**, 4978 fall back to English.
- Wallet (billing history dialog, subscription plans card, subscription purchase dialog, Creem confirmation, payment hooks, subscription duration and reset labels), pricing and model pages (catalog, cards, table, sidebar and toolbar filters, empty states, model details with overview, performance, API and apps tabs, pricing breakdown, condition texts, parameter descriptions), model pricing panel, home, profile (daily check-in, sidebar modules), error pages (401, 403, 404, 500, 503) and the about page.
- Every key was read at its call site, including keys passed through constants and label maps (`CAPABILITY_LABEL_KEYS`, `MODALITY_LABEL_KEYS`, `TIME_FUNC_LABELS`, billing variable labels, `descriptionKey`, `conditionText`, task price messages, `getPaymentMethodName`).
- Left out on purpose: brand and product names (Stripe, Alipay, WeChat Pay, Waffo, OpenAI, Claude, Gemini, the project and author names), URLs and placeholders, identifiers that only matched the scan (`default`, `token`, `x`, `field`, `stream`, `uptime`, `USD`, `CNY`, `K`, `1M`, `s`), home constants that are not rendered (`GATEWAY_FEATURES`), `Auto` (the group name stays Latin, as in earlier batches), and the admin-only billing-expression editor messages in `pricing/lib/billing-expression/visual.ts` and its operator labels.
- FSI/PDI around interpolated LTR values (`{{query}}`, `{{unit}}`, `{{currency}}`, `{{rate}} {{currency}}`, `{{start}}–{{end}}`, `{{first}}`/`{{second}}`, `{{condition}}`, `{{timezone}}`).
- Written through `add-missing-keys.mjs` (created, run, deleted; fa only), then `bun run i18n:sync` and `bun run i18n:check-fa`. The first check-fa run flagged `IPها` (Latin word with a Persian affix); rephrased to «نشانی‌های IP».

## Verification (feat/fa-locale)

All from `web/` unless noted.

| Command | Result |
| --- | --- |
| `git fetch upstream main` | `upstream/main` = `c2b7a9a`; push URL `DISABLED` |
| `bun install` | 1203 packages; after `bun add`, 3 more |
| `bun run typecheck` | `tsgo -b`, exit 0 |
| `bun run lint` | exit 1: **163 errors, 65 warnings**; `upstream/main` (clean worktree): **182 errors, 66 warnings**; errors only on this branch (by file, rule and message): **none** |
| `bunx oxlint -c .oxlintrc.json <148 files changed vs upstream/main>` | exit 0, **0 errors**, 8 warnings, all pre-existing (`sync-i18n.mjs` style, `no-danger` in footer, `self-closing-comp` in redemptions columns) |
| `bun run test` | `Test Files 190 passed (190)`, `Tests 2286 passed (2286)`, exit 0 |
| `bun run build` | exit 0 (sizes in C) |
| `bun run i18n:sync` | exit 0; fa `partial`, missingCount 4978, extras 0, untranslated 0; the seven required locales missing 0 |
| `bun run i18n:check-fa` | `check-fa: 1800 keys, no findings`, exit 0 |
| `git diff --stat upstream/main -- web/src/i18n/locales/` | only `fa.json` (1804 insertions) |
| `go build -o <scratch>/new-api-feat .` (repo root, Go 1.25.1) | exit 0, embeds the fresh `web/dist` |

### Running app

```
GLOBAL_WEB_RATE_LIMIT_ENABLE=false GLOBAL_API_RATE_LIMIT_ENABLE=false CRITICAL_RATE_LIMIT_ENABLE=false \
  SQLITE_PATH="<scratch>/app-feat/one-api.db?_busy_timeout=30000" PORT=3300 <scratch>/new-api-feat --log-dir <scratch>/app-feat/logs
python3 .fa-review/scripts/seed.py http://127.0.0.1:3300 <scratch>/app-feat/one-api.db
node .fa-review/scripts/shots5.mjs http://127.0.0.1:3300 .fa-review fa     # run from a folder that can import playwright
node .fa-review/scripts/shots5.mjs http://127.0.0.1:3300 .fa-review en
node .fa-review/scripts/shots5.mjs http://127.0.0.1:3301 .fa-review chart-en 46-upstream-chart-before-en   # upstream/main binary, copy of the DB
node .fa-review/scripts/shots5.mjs http://127.0.0.1:3302 .fa-review chart-en 47-upstream-chart-after-en    # fix branch binary, copy of the DB
```

- The rate limits were turned off for the scratch server only: the screenshot runs sign in many times and load many assets, and the default login limit (20 per 20 minutes) and web limit (120 per 3 minutes) answered 429.
- Seed additions this session: one channel (so pricing lists models), hourly `quota_data` for two users and three models from 2025-12-27 to 2026-01-03 and from 2026-03-15 to 2026-03-23 (UTC; 408 rows), and one consume log in each period.
- The dashboard range rolls back from "now", so the script moves the page clock (`page.clock.setSystemTime`); the other screens use a fresh browser context without a fake clock, because it stalls the page transitions.

Playwright 1.56.1 (global), Chromium 141.0.7390.37 headless, 1440×900, light theme, UTC, browser locale `fa-IR` or `en-US`. Output of the fa run:

```
page: dir=rtl lang=fa
date picker trigger: «۱۴۰۴/۱۲/۲۵»
calendar grid label: «اسفند ۱۴۰۴»
calendar dir: rtl
range trigger: «۱۴۰۵/۰۷/۰۳ ۰۰:۰۰ ~ ۱۴۰۵/۰۷/۰۳ ۱۹:۱۹»
range start input value: 2026-09-25T00:00
usage-log details column: ["管理员补单成功，充值金额: ＄20.000000，支付金额：20.000000",
  "افزایش سهمیۀ کاربر «⁨demo-user⁩» (شناسه: 2) · سهمیۀ درخواستی: ⁨‎$۵⁩ · ‎$۰ → ‎$۵",
  "ورود موفق با رمز عبور", …]
audit dialog excerpt: "کاربر ⁨demo-user⁩ ساخته شد (نقش ⁨کاربر⁩) … انجام‌دهنده admin (ID: 1) نقش مدیر ارشد … نقش کاربر …"
console errors: 401 on the pre-login session probe (once per sign-in); ERR_CERT_AUTHORITY_INVALID and
  ERR_TUNNEL_CONNECTION_FAILED for external resources blocked by the sandbox proxy
```

Screenshots (new in this session):

- `30-dashboard-year-boundary-rtl.png`, `31-dashboard-nowruz-rtl.png`: Solar Hijri chart axes
- `32-date-picker-rtl.png`: open Persian calendar (dashboard filter)
- `33-usage-log-range-picker-rtl.png`: open usage-log range picker
- `34-usage-logs-details-rtl.png`: usage logs, details column
- `35-audit-log-rtl.png`, `36-audit-log-details-rtl.png`: audit log with roles and sign-in methods
- `37-wallet-rtl.png`, `38-wallet-billing-history-rtl.png`: wallet and billing history
- `39-pricing-rtl.png`, `39b-model-detail-rtl.png`: pricing and model detail
- `42-home-rtl.png`, `43-profile-rtl.png`, `44-error-404-rtl.png`, `45-about-rtl.png`
- `40-dashboard-year-boundary-en.png`, `41-date-picker-en.png`: English unchanged
- `46-upstream-chart-before-en.png`, `47-upstream-chart-after-en.png`: upstream branch before and after

## Remaining RTL and locale issues

1. **Billing history status is English in every language**: `wallet/lib/billing.ts` `STATUS_CONFIG.label` reaches `StatusBadge` without `t()` (upstream code; zh shows "Success" too). A candidate for another small upstream fix.
2. **Model detail footnote** «قیمت‌ها به‌ازای 1M tokens»: `model-details.tsx` appends a hardcoded English `tokens` after `t('Prices shown per')`.
3. **Home terminal demo**: the request and response code lines render right to left (quotes and braces move); the block needs `dir="ltr"`. The features section is not visible in a full-page capture (scroll-triggered animation), and the footer copyright line is English.
4. **Profile header** shows `@admin` as `admin@` (RTL reordering of a leading `@`).
5. **Pricing**: token unit toggles `1K/` `1M/` and the empty metrics `t/s–`, `s–` show their neutral characters on the wrong side.
6. **Audit details**: actor `admin (ID: 1)` keeps an English `ID`; the dialog's close label is English.
7. **Native date and time inputs** (range picker, the time input next to the date pickers: `06:00 PM`) follow the browser locale, not the interface language.
8. **Charts**: the time axis runs left to right in RTL (the same as other RTL chart libraries; not changed).
9. Earlier items still open: backend content in Chinese or English (`管理员补单成功…`, Go i18n is en/zh only), `{{action}}` raw in `Performed {{action}} on user`, the usage-log `Tokens` header, throughput `t/s 127` order, users page quota cell `-ml-1.5`, `mr-2`/`ml-2` on button spinners, `rtl:` also matching `:lang(fa)` when LTR is forced, carousel arrows, other `<pre>` blocks, the Public Sans font name mismatch.

## New open questions

1. **Billing status label**: fix upstream-style on its own branch (one `t()` plus a test), like the chart order?
2. **Home page RTL**: set `dir="ltr"` on the terminal demo code block in the fork, or propose it upstream (it only matters for RTL)?
3. **Legend order**: the chart legend now follows the chronological data order (the first time point's models). Keep, or also fix the legend to a stable model order in the upstream branch?
4. **Next batch**: the remaining admin screens (channels, models, users, system settings), or the security and API key pages first?
