# Persian (fa) locale: session 2 (RTL fixes and second batch)

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branch: `feat/fa-locale`. `upstream/main` is still at `c2b7a9a` (fetched at the start of this session), so no merge was needed.

Session 1 (foundation, first 397 keys) is described in the commit `b2720c9`. This file covers session 2.

## Decisions applied

| # | Decision | Where it landed |
| --- | --- | --- |
| 1 | Persian web font: yes | Vazirmatn (`@fontsource-variable/vazirmatn`, SIL OFL 1.1), used for `html:lang(fa) body` and `.font-sans`. Code keeps `font-mono`. |
| 2 | تر/ترین: Academy exceptions | بیشتر، کمتر، بهتر and their superlatives are written joined. Other comparatives keep ZWNJ. |
| 3 | ZWNJ before ها after non-joining letters: no | کلیدها، فیلترها، رمزها. check-fa now reports a ZWNJ in that position. |
| 4 | Digits inside strings: Persian | Unchanged (`PERSIAN_INTL_LOCALE = 'fa'`). |
| 5 | Terminology: confirmed | `docs/i18n/fa.md` glossary unchanged (plural example updated to کلیدهای API). |
| 6 | Order: RTL fixes first | Done in that order. |

Rules changed first (`docs/i18n/fa.md`, `web/scripts/check-fa.mjs` and its test), then the 7 affected `fa.json` values were rewritten through the script.

## Commits

```
07e070d feat(i18n): relax fa spelling rules for joined plurals and comparatives
759a31e feat(web): use the Vazirmatn font for Persian text
c78c83f fix(web): fix right-to-left layout issues found with the Persian locale
fa96f8b feat(i18n): translate the second Persian batch (399 keys)
d8ee064 fix(web): keep the usage log date range in reading order in RTL
```

## A. RTL fixes

| Issue | Fix | Regression test |
| --- | --- | --- |
| Config drawer close button over the title | `ui/sheet.tsx` close button `right-3` → `end-3`; `ui/dialog.tsx` `right-2` → `end-2` | `components/ui/__tests__/rtl-layout.test.tsx` |
| Chevrons and arrows don't flip | `rtl:rotate-180` (the convention already used in `ui/calendar.tsx`) on: data-table pagination (6), `ui/pagination`, `ui/breadcrumb`, dropdown and context submenu arrows, sidebar back chevron, nav-group and chat-presets collapsible chevrons (`rtl:not-group-data-[…]:rotate-180`, so open still points down), forgot-password submit, dashboard wallet and setup-step arrows, flow-chart separators, usage-log mobile card, wallet billing-history and check-in calendar pagers, API key Auto-order connector | `data-table/core/__tests__/pagination.test.tsx` (2 new cases) |
| Code blocks need LTR | `dir="ltr"` on the shared `CodeBlockFrame` body, the dashboard curl preview, masked values, API URLs on the keys page, billing trade numbers, stream-error `<pre>`, math blocks | `ai-elements/__tests__/code-block-direction.test.tsx` |
| Physical CSS classes | Logical classes in `features/auth/*` (text-start, logo `start-*`), `legal-consent`, `ui/sidebar` (inset `ms-*`, action and badge `end-*`, menu-sub `border-s`), `ui/badge`, `layout/footer`, `layout/public-header`, `layout/chat-presets-item`, data-table cells, card rows, disabled-row marker, mobile filter panel, static table numeric cells (`text-end`) | `rtl-layout.test.tsx`, `legal-consent.test.tsx` |
| Data-table pinning and resizing | Pinned columns stick to `start-0` / `end-0` with mirrored shadows. Resizer on `end-0`; `useDataTable` passes Base UI's direction as TanStack `columnResizeDirection`; ArrowLeft widens in RTL | `data-table/core/__tests__/column-pinning.test.ts`, `column-resize-direction.test.tsx` |
| `' and the '` in legal-consent | `t('and')` (existing key in all locales; English now reads "User Agreement and Privacy Policy.") | `features/auth/components/__tests__/legal-consent.test.tsx` |
| Dashboard currency digits | Root cause was not a missing re-render: `formatQuota` passed no locale, so digits followed the **browser** locale, not the interface language. `formatQuota(quota, locale?)` now takes the interface locale; `SummaryCards` and `LogStatCards` pass `toIntlLocale(i18n.resolvedLanguage)` | `lib/__tests__/format-quota-locale.test.ts` (all 8 languages + invalid tag), `dashboard/components/overview/__tests__/summary-cards-locale.test.tsx` (en→fa and fa→en without reload) |
| Usage-log date range reordered in RTL (found in this session's screenshots) | `dir="auto"` on the range labels | `usage-logs/components/__tests__/date-range-direction.test.tsx` |

Reuse: every fix changes the existing shared component (`Sheet`, `Dialog`, `DataTablePagination`, `CodeBlockFrame`, `useDataTable`, `formatQuota`, …); no new UI component was added.

Fail-before check: the new tests were copied into a worktree at `07e070d` (before the fixes) and run there: **15 failed, 13 passed** (the 13 are LTR/English baselines that must keep passing). The date-range test: 2 failed with the fix stashed, 2 passed with it.

Also fixed in touched files, to keep them lint-clean: `layout/components/footer.tsx` used array indexes as keys (now `column.title` / `link.href`). I reverted my change to `command-menu.tsx` instead, because that file has a pre-existing `import(no-cycle)` error that is out of scope.

## B. Second translation batch

- **399 keys** added; `fa.json` now has **796 keys**, 5982 fall back to English.
- Scope: dashboard overview and model analytics (plus the dashboard stat-card config and range/chart constants), API keys (list, cells, create/edit drawer, delete dialogs, Auto group order, toasts, form validation), usage log list (columns, filters, stats, timing, model badge, mobile cards, date range), wallet and top-up (balance cards, add funds, redemption, referral program, transfer and payment-confirm dialogs, payment toasts), profile (header, language preferences, profile toasts), security (page headings, two-factor card/setup/disable, passkey card, change-password dialog, delete-account action).
- Left out to stay within 300 to 400: usage-log detail dialogs and audit logs, drawing/task log columns and constants, dashboard flow and user analytics, model-analytics preferences dialog, subscription plans, billing history dialog, Creem/Waffo dialogs, CC Switch dialog, FluentRead toasts, notification settings tab, check-in calendar, sidebar-modules card, account bindings, access tokens, login sessions, privacy card.
- Kept in English on purpose (they fall back): `RPM`, `TPM`, `Auto` (group name), `CC Switch`, `Waffo`, `ms` (it is glued to a Latin number as `123ms`).
- Every key was translated after reading its call site. Examples of choices driven by the call site: "This will permanently delete API key" + name + ". This action cannot be undone." → «این کلید API برای همیشه حذف می‌شود:» + name + «. این کار برگشت‌پذیر نیست.»; "Token Name" in the log filter is the API key name → «نام کلید»; "Step" is followed by a number → «مرحلۀ».
- check-fa false positive: «میله» (bar chart) added to the real words that start with می.

## C. Verification (commands and results, final tree `d8ee064`)

All run from `web/` unless noted.

| Command | Result |
| --- | --- |
| `git fetch upstream main` | `upstream/main` = `c2b7a9a`, 0 new commits; no merge needed |
| `bun install` | 1202 packages installed; `bun add @fontsource-variable/vazirmatn` → 5.3.0 |
| `bun run typecheck` | `tsgo -b`, exit 0 |
| `bun run lint` | exit 1: **179 errors, 66 warnings**. `upstream/main` in a clean worktree: **182 errors, 66 warnings**. Errors present only on this branch: **none**. The 3 fewer are the `curly` fix in `sync-i18n.mjs` (session 1) and the two footer key fixes |
| `bunx oxlint -c .oxlintrc.json <69 files changed vs upstream/main>` | exit 0, **0 errors**, 7 warnings (pre-existing: `no-danger` in footer, `prefer-string-starts-ends-with` in `sync-i18n.mjs`) |
| `bun run test` | `Test Files 178 passed (178)`, `Tests 2195 passed (2195)`, exit 0 |
| `bun run build` | exit 0 (generated CSS contains the `rtl:` rules, `.end-3{inset-inline-end:…}` and `:lang(fa) body{font-family:Vazirmatn Variable,sans-serif}`) |
| `bun run i18n:sync` | exit 0. fa: `partial: true`, missingCount 5982, extras 0, untranslated 0. The other 7 locale files are byte-identical to `upstream/main` (`git diff --stat upstream/main -- web/src/i18n/locales/` lists only `fa.json`) |
| `bun run i18n:check-fa` | `check-fa: 796 keys, no findings`, exit 0 |
| `go build -o <scratch>/new-api .` (repo root) | exit 0, binary embeds the fresh `web/dist` |

### Running app

```
SQLITE_PATH="<scratch>/app/one-api.db?_busy_timeout=30000" PORT=3300 <scratch>/new-api --log-dir <scratch>/app/logs
GET  /api/setup  -> {"data":{"status":false,"root_init":false,"database_type":"sqlite"},"success":true}
POST /api/setup  {"username":"admin",...} -> {"message":"系统初始化成功","success":true}
POST /api/token/ (bearer access token from /api/user/login) -> {"success":true}   # one demo key
```

Playwright (global 1.56.1, Chromium at `/opt/pw-browsers`), browser locale `fa-IR`, empty storage:

```
sign-in (browser fa-IR, empty storage): dir=rtl lang=fa bodyFont="Vazirmatn Variable", sans-serif
after sign-in, Persian selected: dir=rtl lang=fa i18nextLng=fa
dashboard first currency value (fa): ["‎$۰","‎$۲۰۰"]
config drawer: close button x= 1005 .. 1033  title text x= 1325 .. 1416  overlap= false
after switching language (language menu, no reload): dir=ltr lang=en bodyFont="Public Sans", sans-serif
dashboard first currency value after switch: ["$0","$200"]
```

Note: after sign-in the account's saved language wins over the browser language (the language preference syncs to the server), so the script selects فارسی in the language menu when needed. One login round hit the login rate limiter (HTTP 429) after repeated test logins; restarting the local server cleared it.

Screenshots (1440×900 unless noted):
- `01-sign-in-rtl.png`, `12-sign-in-mobile-rtl.png` (390 px)
- `02-dashboard-overview-rtl.png` (full page), `03-dashboard-models-rtl.png` (full page)
- `04-api-keys-rtl.png`, `05-api-key-drawer-rtl.png`
- `06-usage-logs-rtl.png` (date range now reads start ~ end)
- `07-wallet-rtl.png`, `08-profile-rtl.png`, `09-security-rtl.png` (full page)
- `10-config-drawer-rtl.png` (close button on the left, title on the right)
- `11-dashboard-after-switch.png` (English LTR right after switching, Latin digits)

## Remaining RTL and locale issues

1. **Other quota/number callers still use the browser locale.** Only the dashboard (`SummaryCards`, `LogStatCards`) passes the interface locale. `formatQuota` / `formatCurrencyFromUSD` elsewhere (wallet, profile header, API key quota cell, usage logs, charts) still use the runtime default. With a Persian browser and English UI they show Persian digits, and vice versa. See open question 1.
2. **API key quota cell** renders its parts as `۵ / ۰ / x` in RTL (row text), which looks jumbled in `04-api-keys-rtl.png`. Needs a closer look at `api-key-quota-cell.tsx` layout.
3. **Numbers built with template strings stay Latin**: `{{count}}` interpolations, `شناسۀ کاربر 1`, invite count `0`, `Setup progress: 1/3`, the setup-step numbers (shown as `.1` in RTL), chart axes (VChart), `مجموع: 0.00$` in the model charts.
4. **2FA setup step label** (`two-fa-setup-dialog.tsx`) renders `{t('Step')}{n}{t('of 3:')}{label}` with no spaces in every language ("Step1of 3:Scan QR Code"). Upstream bug; the fix is a single interpolated key.
5. **Keys passed as variables are not found by a `t('…')` scan**, so some visible strings on translated pages are still English: "Change Password"/"Set Password" and its description on the security page, "Healthy" on the dashboard, "Common Logs", "Tokens" column, "Preferences", "User Analytics", "Flow", "Root User"/"Super Admin". Next batch should also scan constants and conditional keys.
6. **English text inside RTL containers**: untranslated English sentences still show their full stop on the left (".when the scheduled…" on the profile page); LTR labels truncated with an ellipsis lose their start ("…ple Large-font" in the theme presets). `dir="auto"` on those elements would help.
7. **`rtl:` in Tailwind v4 also matches `:lang(fa)`.** A Persian user who forces LTR in the config drawer still gets mirrored icons and `rtl:` shadows. Minor, but worth knowing.
8. **Not converted yet:** `mr-2`/`ml-2` on spinner icons in buttons across features, `text-left` in the usage-log details button, the other 13 `<pre>` blocks outside the pages touched here (channels, settings, playground), the sign-in button icon (not mirrored), carousel arrows (Embla needs a `direction` option).
9. **Theme font mismatch (pre-existing, not RTL):** `theme.css` uses `'Public Sans'` but fontsource registers `'Public Sans Variable'`, so the Latin theme font may not actually be applied upstream.
10. From session 1, still open: the "Type" key collision (noun vs verb), top-nav links under the welcome toast, and Go backend messages (en/zh only).

## New open questions

1. **Interface locale for all money and numbers.** Should `@/lib/currency` default to the interface language (reading i18next at call time) instead of the runtime locale? That fixes item 1 everywhere at once but changes a shared default for all languages. The alternative is passing the locale at each call site, as done for the dashboard.
2. **Latin digits from `{{count}}`.** i18next can format interpolations (`{{count, number}}`), which would make them follow `PERSIAN_INTL_LOCALE`. That changes the key text in all 8 locales. Worth doing, or accept Latin digits in interpolations?
3. **Security page completeness.** The next batch could finish the security page (account bindings, access tokens, login sessions, privacy) and the profile notification tab, about 110 keys. Do those first, or the usage-log detail dialogs and audit logs (about 220 keys)?
4. **2FA step label fix (item 4).** OK to change it to one interpolated key such as `Step {{current}} of {{total}}: {{label}}`? It needs a new key in all 7 required locales.
