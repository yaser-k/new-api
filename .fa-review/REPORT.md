# Persian (fa) locale: session 3 (RTL fixes, interface locale, third batch)

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branch: `feat/fa-locale`. `upstream/main` is still at `c2b7a9a` (fetched at the start of this session), so no merge was needed.

Session 1 (foundation, first 397 keys) is described in commit `b2720c9`; session 2 (RTL fixes, second batch of 399 keys) in commit `39b326f` (the previous version of this file). This file covers session 3.

## Decisions applied

| # | Decision | Where it landed |
| --- | --- | --- |
| 1 | Pass the interface locale at each call site | Wallet and top-up, usage logs, API keys, profile. The shared formatter defaults are unchanged. |
| 2 | Leave `{{count}}` and interpolated numbers as they are | Not touched; no key changed in the seven required locales. |
| 3 | Next batch: rest of the security page, notification settings, keys passed through variables | Done: 223 keys. |
| 4 | 2FA step label is fixed elsewhere | `two-fa-setup-dialog.tsx` and the `Step` / `of 3:` keys were not touched. |

## Commits

```
f5296da fix(web): shape Persian text in monospace contexts with Vazirmatn
f01c5af fix(web): format money and numbers in the interface language, fix the key quota cell in RTL
776c03c test(web): resolve the stylesheet with import.meta.dirname in the monospace test
551a8a3 feat(i18n): translate the third Persian batch (223 keys)
```

## A. Fixes

| Issue | Cause and fix | Regression test |
| --- | --- | --- |
| A.1 Version label «نسخۀ نامشخص» renders spaced out (`font-mono`) | DejaVu Sans Mono, Menlo and Courier New have fixed-width Arabic glyphs, so a Persian fallback **after** the monospace families is never reached. `index.css` adds a face `Vazirmatn Persian Script` (the Vazirmatn Arabic file, `unicode-range` limited to the Arabic script and ZWNJ) and, for `html:lang(fa)`, puts it **first** in `--font-mono`. Persian letters and digits take Vazirmatn; Latin letters, digits and punctuation in versions, code and keys still use the monospace stack. One rule covers the `font-mono` utility and the preflight `code/kbd/pre/samp`, which both read `--font-mono`. | `src/styles/__tests__/persian-monospace.test.ts`: compiles `index.css` with Tailwind, then resolves which face renders each character under `lang=fa` and `lang=en` |
| A.2 API key quota cell jumbled in RTL | The values grid flips in RTL but the values kept physical `text-left`/`text-right`, so remaining and used were pushed together in the middle of the cell (measured: «۵» at x 549–557 and «۲» at x 533–541 in a cell x 456–634) and read as one number. Now `text-start`/`text-end` (and `ms-1`). Each amount is in `<bdi dir="ltr">`, also in the shared `QuotaDetailsPopover`, because token-mode values such as `-1.5k` come from `toFixed` (no LRM) and their minus sign moved to the end in RTL. | `keys/components/__tests__/api-key-listing.test.tsx` (2 new cases; 5 assertions changed from physical to logical classes) |
| A.3 Money and numbers follow the browser language | Components compute `toIntlLocale(i18n.resolvedLanguage \|\| i18n.language)` at render and pass it to `formatQuota`, `formatQuotaWithCurrency`, `formatCurrencyFromUSD`, `formatBillingCurrencyFromUSD`, `formatLocalCurrencyAmount`, `formatNumber`, `formatCompactNumber`; raw `toLocaleString()` became `formatNumber(…, locale)`. `formatLogQuota` and the wallet `formatCurrency` gained an optional `locale` (default unchanged). The redemption toast (a non-React hook) converts `i18next.resolvedLanguage` at call time. Files: wallet (stats, recharge, affiliate, subscription plans, transfer, payment confirm, billing history, Creem), usage logs (columns, mobile card, stats, cost, details/task/user-info dialogs), keys (quota cell), profile (header, check-in). The usage-log token pair `input / output` is isolated LTR so it keeps its order. | `lib/__tests__/format-quota-locale.test.ts` (+`formatLogQuota`, 8 languages + invalid tag), `wallet/lib/__tests__/format-currency-locale.test.ts` (same), and en→fa→en **without reload**: `wallet/components/__tests__/amount-locale.test.tsx`, `profile/components/__tests__/profile-header-locale.test.tsx`, `usage-logs/components/__tests__/cost-display.test.tsx`, `api-key-listing.test.tsx` |
| A.4 Keys passed through variables | Scanned every string literal in the target features, `lib/roles.ts`, `lib/server-error-message.ts`, the secure-verification and Passkey modules, and the matching `static-keys.ts` sections, keeping the ones that are `en.json` keys missing from `fa.json`; each was checked at its call site. Translated in batch 3 (below). | n/a (translation) |

Fail-before evidence (the tests run against the code before each fix):

- A.1: `index.css` from `39b326f` → `1 failed | 2 passed` (the 2 are the Latin and English baselines); with the fix `3 passed`.
- A.2 + A.3: all changed production files stashed → `13 failed | 65 passed (78)`: the 10 new tests plus 3 existing key-list assertions that now require logical classes. With the fixes: `78 passed`.

Also fixed in touched files to keep them lint-clean: the array-index key in `creem-products-section.tsx` (pre-existing), and a missing `locale` dependency in `checkin-calendar-card.tsx`.

Reuse: every change edits the existing component or formatter; no new UI component.

## B. Third translation batch

- **223 keys** added; `fa.json` now has **1019 keys**, 5759 fall back to English.
- Security page: account bindings with the email, Telegram and WeChat dialogs, access token card and dialog, login sessions (list, revoke and sign-out dialogs), privacy card, delete-account details, backup-code regeneration, change/set password validation.
- Messages shown by the security flows, passed as variables: `server-error-message.ts` (2FA, Passkey, verification proof, Telegram binding, session limits), secure-verification method labels (`Linked account`, `Login session`, `Passkey`), Passkey registration errors, account-binding and password messages from `static-keys.ts`, role labels (`Super Admin`, `Guest`).
- Notification settings card (profile): method, threshold, email, webhook, Bark, Gotify setup, preferences.
- A.4 keys on pages translated earlier: `Change Password`, `Set Password` and its description, `Common Logs`, `Drawing Logs`, log types (`Top-up`, `Consume`, `Manage`, `Refund`, `Login`), `24 Hours`, dashboard balance status (`Healthy` → «کافی», `Low balance`), `Other` (chart bucket), dashboard tabs `Flow` and `User Analytics`, `Model Analytics Filters` and its description, API key statuses `Expired`, `Exhausted`, `Preferences` (also the dashboard chart-preferences button).
- Deliberately left out (fall back): brand names (GitHub, Discord, Telegram, WeChat, LinuxDO, OIDC, OAuth, Bark, Gotify), URL placeholders, identifiers that the scan matched but that are not text (`default`, `off`, `token`, …), and `to confirm` (see question 2).
- `Last active {{time}} · Expires {{expires}}`: the Persian value wraps both placeholders in FSI/PDI (U+2068 … U+2069). Without them the screenshot showed the expiry as `13:53 25-10-2026`; with them it reads `2026-10-25 13:55`.
- Written through `add-missing-keys.mjs` (created, run, deleted; fa only), then `bun run i18n:sync` and `bun run i18n:check-fa`.

## C. Verification (commands and results, final tree `551a8a3`)

All from `web/` unless noted.

| Command | Result |
| --- | --- |
| `git fetch upstream main` | `upstream/main` = `c2b7a9a`; no merge needed. `upstream` push URL set to `DISABLED`. |
| `bun install` | `1 package installed` (node_modules was present; `@fontsource-variable/vazirmatn@5.3.0`) |
| `bun run typecheck` | `tsgo -b`, exit 0 |
| `bun run lint` | exit 1: **178 errors, 66 warnings**. `upstream/main` in a clean worktree: **182 errors, 66 warnings**. Errors present only on this branch: **none** (compared by file and message). |
| `bunx oxlint -c .oxlintrc.json <93 files changed vs upstream/main>` | exit 0, **0 errors**, 7 warnings, all pre-existing (`sync-i18n.mjs` style rules, `no-danger` in footer) |
| `bun run test` | `Test Files 182 passed (182)`, `Tests 2224 passed (2224)`, exit 0 |
| `bun run build` | exit 0; CSS contains `html:lang(fa){--font-mono:"Vazirmatn Persian Script", ui-monospace, …}` and the font URL resolves to `/static/font/vazirmatn-arabic-wght-normal.*.woff2` |
| `bun run i18n:sync` | exit 0; fa `partial: true`, missingCount 5759, extras 0, untranslated 0 |
| `bun run i18n:check-fa` | `check-fa: 1019 keys, no findings`, exit 0 |
| `git diff --stat upstream/main -- web/src/i18n/locales/` | only `fa.json` (1023 insertions) |
| `go build -o <scratch>/new-api .` (repo root) | exit 0, embeds the fresh `web/dist` |

### Running app

```
SQLITE_PATH="<scratch>/app/one-api.db?_busy_timeout=30000" PORT=3300 <scratch>/new-api --log-dir <scratch>/app/logs
GET  /api/setup -> {"data":{"status":false,"root_init":false,"database_type":"sqlite"},"success":true}
POST /api/setup {"username":"admin",...} -> {"message":"系统初始化成功","success":true}
POST /api/user/login -> access_token; POST /api/token/ (Bearer) x2 -> {"success":true}   # demo-key, unlimited-key
PUT  /api/user/self {"language":"fa"} -> {"message":"Update successful","success":true}
```

Demo data was written into the scratch SQLite file: `demo-key` used 1,000,000 of 3,500,000 quota, three consume logs, user used quota and request count.

Playwright 1.56.1 (global), Chromium at `/opt/pw-browsers`, 1440×900, browser locale `fa-IR`:

```
fa page: dir=rtl lang=fa
version label: text «نسخۀ نامشخص», fontFamily "Vazirmatn Persian Script", ui-monospace, …, face loaded: true
quota cells (fa): «۵»@x626-634 | «۲»@x456-464 in cell x456-634      (remaining at the start edge, used at the end edge)
quota cells (en): 5@x807-815 | 2@x977-985 in cell x807-985           (unchanged LTR layout)
wallet numbers (fa): ‎$۲۰۰, ‎$۲٫۴۷, ۱٬۵۳۲, ‎$۰ …
usage log row (fa): … ۱٬۲۵۰ / ۳۸۰ ‎$۰٫۰۰۸۴۲ …
session line (fa): آخرین فعالیت: ⁨a few seconds ago⁩ · انقضا: ⁨2026-10-25 13:55⁩
```

Screenshots (1440 wide):
- replaced: `04-api-keys-rtl.png`, `06-usage-logs-rtl.png`, `07-wallet-rtl.png` (full page), `08-profile-rtl.png` (full page), `09-security-rtl.png` (the page scrolls inside the layout, so it was taken with a 2456 px viewport)
- new: `13-topbar-version-rtl.png`, `14-api-keys-en.png`, `15-notification-settings-rtl.png`, `16-notification-gotify-rtl.png` (Gotify selected, not saved)

Note: after a server restart the earlier access token is rejected (`AUTH_UNAUTHORIZED`); the script logs in again before each language change.

## Remaining RTL and locale issues

1. **Relative times are English** («آخرین فعالیت: a few seconds ago») on the security page: no Persian dayjs locale is loaded. Dates in general (dayjs `format`, `toLocaleString` for dates in subscription plans) were not changed; see question 3.
2. **Hard-coded English outside `t()`** (upstream gaps, need new keys in all seven locales): the usage-log `Tokens` column header (`header: 'Tokens'`; the existing `Tokens` key means an auth token in some locales, e.g. vi «Mã thông báo», so wrapping it is not safe), and «Pay», «• Save», «Minimum …», «% OFF» on the top-up preset buttons.
3. **Throughput** `127 t/s` shows as `t/s 127` in RTL (timing cell); `formatTokens` / `formatUseTime` build Latin-digit strings with `toFixed`.
4. **`Type` + username + `to confirm`** in the delete-account dialog cannot read correctly in Persian (`Type` is a noun, «نوع», everywhere else). `to confirm` is left in English; see question 2.
5. **Access-token history sheet** on the security page embeds the audit-log viewer, which is still English (99 keys, plus 115 audit-event descriptors in `usage-logs/lib/format.ts`, which also label top-up, manage and login rows in the usage logs). That is the audit-log batch.
6. **Users page quota cell** has a `-ml-1.5` offset (not in this session's pages).
7. Still open from session 2: `mr-2`/`ml-2` on button spinners, `rtl:` also matching `:lang(fa)` when LTR is forced, carousel arrows, the other `<pre>` blocks, the Public Sans font name mismatch, top-nav links under the welcome toast, Go backend messages (en/zh only).

## New open questions

1. **Audit batch next?** The access-token history on the security page and the non-consume rows in usage logs need the audit viewer and descriptors (about 215 keys). Do that next, or the usage-log detail dialogs first?
2. **Delete-account confirmation label.** Replace `{t('Type')} <strong>{name}</strong> {t('to confirm')}` with one key using `Trans` (for example `Type <strong>{{name}}</strong> to confirm`)? It adds a key to all seven required locales, like the 2FA step fix.
3. **Dates and relative times in Persian.** Load the dayjs `fa` locale for relative times? And should absolute dates stay Gregorian `YYYY-MM-DD` with Latin digits (current), or follow `PERSIAN_INTL_LOCALE` (which would also switch to the Solar Hijri calendar through Intl)?
4. **FSI/PDI in translations.** Is wrapping interpolated LTR values in U+2068/U+2069 inside `fa.json` acceptable as a convention? If yes, it should be added to `docs/i18n/fa.md` (and possibly to `check-fa`).
