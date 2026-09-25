# Persian (fa) locale: session 4 (audit batch, Persian dates, FSI/PDI rule, upstream label fix)

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branch: `feat/fa-locale`. `upstream/main` was still at `c2b7a9a` (fetched at the start of this session), so no merge was needed. Sessions 1 to 3 are described in the previous versions of this file (`git log -- .fa-review/REPORT.md`, last one at `d263b5f`).

## Decisions applied

| # | Decision | Where it landed |
| --- | --- | --- |
| 1 | Audit log first, then the usage-log detail dialogs | Batch 4, 333 keys (A below) |
| 2 | Delete-account label fixed upstream-style on its own branch | `fix/delete-account-confirm-label` (D below); nothing changed here |
| 3 | Relative times in Persian, absolute dates in Solar Hijri | B below |
| 4 | FSI/PDI in `fa.json` accepted, documented and enforced | C below |

## Commits on feat/fa-locale

```
bfe01bb feat(i18n): require paired directional isolates in Persian strings
795d296 feat(i18n): translate the fourth Persian batch (333 keys)
0ea975e feat(web): show Persian relative times and Solar Hijri dates in fa
c2369c8 feat(web): pass the interface locale to date helpers on admin screens
cb25020 fix(web): keep audit routes and user agents left to right in RTL
8ccec81 fix(web): use logical alignment classes on the usage-log detail preview
(this hand-off commit)
```

## A. Translation batch 4

- **333 keys** added (0 existing values changed); `fa.json` now has **1352 keys**, 5426 fall back to English.
- Audit log: viewer, filter bar, columns, detail fields and values, details dialog, the access-token history sheet on the security page (same viewer, `accessOnly`).
- Event descriptors (`usage-logs/lib/format.ts` `AUDIT_TEMPLATES` and the redemption batch messages), quota adjustment operations (`quota-audit-operation.ts`), token operations and field labels (`audit/lib/audit-details.ts`). These also render the content of top-up, manage and login rows in the usage logs.
- Parameter override actions (Set, Move, Set Header, ...) shown in the details dialog.
- Usage-log details dialog, task details dialog, user info dialog.
- Every key was read at its call site, including keys passed through variables (`labelKey`, `namedKey`, `auditFieldLabel`, `CHANNEL_FIELD_LABELS`, `PARAM_OVERRIDE_ACTION_MAP`, `quotaSaturationKindLabel`, `getUsageBillingPathLabel`, `taskStatusMapper` fallback `Submitting`, `t(entry.unit)`).
- FSI/PDI wrap embedded names, usernames, tags, setting keys, routes, amounts, domain lists and raw action names.
- Left out on purpose (English is correct or they are not text): brand names (GitHub, Discord, Telegram, WeChat, LinuxDO, OAuth, OIDC), `IP`, `{{method}} {{route}}`, and literals the scan matched that are not UI text (`default`, `to`, `models` as switch cases).
- Glossary additions in `docs/i18n/fa.md`: audit «حسابرسی», billing «محاسبۀ هزینه», vendor «سازنده», header «هدر», tier «سطح».
- Written through `add-missing-keys.mjs` (created, run, deleted; fa only), then `bun run i18n:sync` and `bun run i18n:check-fa`.

## B. Dates in Persian

Design: one shared helper, `formatDisplayDate(value, pattern, locale)` in `web/src/lib/format.ts`. It takes the Day.js pattern the callers already used. For a Persian Intl locale (`isPersianIntlLocale`, new in `i18n/languages.ts`) it fills YYYY, MM, DD, HH, mm, ss from `Intl.DateTimeFormat(locale, { calendar: 'persian', hourCycle: 'h23', ... }).formatToParts`, with `/` between date fields; digits follow `PERSIAN_INTL_LOCALE`. Every other locale, or no locale, returns `dayjs(value).format(pattern)`, so other languages are byte-identical.

- Existing helpers gained an optional trailing `locale` and delegate to it: `formatTimestamp`, `formatTimestampToDate`, `formatDateTimeStr`, `formatDateStr`, `formatTimeStr` (`lib/format.ts`), `formatDate`, `formatDateTimeObject`, `formatChartTime` (`lib/time.ts`), plus the feature wrappers `wallet/lib/billing.ts formatTimestamp`, `subscriptions/lib/format.ts formatTimestamp`, `channels/lib/channel-utils.ts formatTimestamp`, `models/lib/model-utils.ts formatTimestamp`.
- `formatFromNow(value, locale)`: Persian relative time through the existing `formatTimestampRelative` (Intl.RelativeTimeFormat); other languages keep Day.js `fromNow` unchanged. No dayjs locale was added.
- `formatGregorianTitle(timestamp, locale, unit)`: the Gregorian `YYYY-MM-DD HH:mm:ss` for a `title` in Persian only; `undefined` otherwise, so other languages get no new attribute.
- Call sites pass `toIntlLocale(i18n.resolvedLanguage || i18n.language)` computed at render: security page (login sessions relative and expiry, passkey last used, access token created and last used), audit log columns and details, usage-log columns (common, drawing, task), mobile card, task details dialog, wallet billing history, subscription plan end and next reset (Persian only; other languages keep `toLocaleString()`), `ActivityTimeCell` (API keys, users), and the admin screens: notifications and announcements, redemption codes, system update, channels (columns, codex usage, multi-key, balance, drawer), system info, channel-affinity cache stats, maintenance settings, models, vendors, deployments, user subscriptions.
- Gregorian `title` on Solar Hijri table, list and log cells; `ActivityTimeCell`'s relative-time tooltip shows both.
- Machine values unchanged: API parameters, date-range filter values, `formatTimestampForInput`, exports and copy buttons.
- Date pickers stay Gregorian (including the date shown on the picker button and the usage-log range picker's trigger label and native `datetime-local` inputs). react-day-picker 10.0.1 has no built-in Persian calendar; its README points to the `@daypicker/persian` add-on (10.0.1, same repository and maintainer), which ships its own `DayPicker` built on a separate `@daypicker/react` package (so `calendar.tsx` would have to swap components) and depends on `date-fns-jalali@4.1.0-0`, a prerelease of a third-party library. A `dateLib` override on the installed DayPicker would still need `date-fns-jalali`. Per the instruction, pickers stay Gregorian.
- Dashboard chart axes stay Gregorian: `dashboard/lib/charts.ts` sorts its time keys as strings, so Solar Hijri keys would sort wrongly across Nowruz (month 12 to 01). `formatChartTime` itself supports the locale and is tested.
- Date rules added to `docs/i18n/fa.md` (section "Dates and times").

## C. FSI/PDI rule

- `docs/i18n/fa.md` typography rule 10: when and how to wrap an interpolated LTR value in U+2068/U+2069, with the `Last active {{time}} · Expires {{expires}}` example, and how to write them in the script.
- `check-fa` reports `unbalanced-isolate` for an FSI, LRI or RLI without its PDI, or a PDI without an opener (nesting-aware). 5 new cases in `web/scripts/__tests__/check-fa.test.ts`, and the passing fixture now contains a balanced pair.
- All current `fa.json` values pass (1352 keys; 34 values now use isolates).

## RTL fixes found in this session's screenshots

| Issue | Fix | Test |
| --- | --- | --- |
| Audit route shown as `api/user/login/` (leading `/` moved to the end), long user agents cut at their start | Route and client cells use `rtl:[direction:ltr] rtl:text-right` on the `TruncatedCell` content; English unchanged | `audit/__tests__/viewer.test.tsx` (new case, fails without the fix) |
| Usage-log detail preview used physical `text-left` and `ml-0.5` | `text-start`, `ms-0.5` | `components/__tests__/detail-preview.test.tsx` (new case, fails without the fix) |

## Tests added and fail-before evidence

| Test | Before the change | After |
| --- | --- | --- |
| `web/scripts/__tests__/check-fa.test.ts` (5 new cases) | old `check-fa.mjs`: `5 failed / 23 passed (28)` | `28 passed` |
| `web/src/lib/__tests__/display-date-locale.test.ts` (22) | code at `795d296`: 11 failed (all Persian cases and the new title helper); the 7 unchanged-Gregorian cases, invalid locale, dash and input cases pass on the old code | `22 passed` |
| `web/src/features/security/components/__tests__/login-session-dates.test.tsx` (3; en, en→fa without reload, fa→en) | `795d296`: the en→fa case fails (English `fromNow`, Gregorian expiry) | `3 passed` |
| `web/src/components/__tests__/activity-time-cell-dates.test.tsx` (2; en, en→fa without reload) | `795d296`: the fa case fails | `2 passed` |
| Combined run of the three date files at `795d296` | `13 failed / 14 passed (27)` | `27 passed` |

## Verification (feat/fa-locale)

All from `web/` unless noted.

| Command | Result |
| --- | --- |
| `git fetch upstream main` | `upstream/main` = `c2b7a9a`; no merge needed; `upstream` push URL `DISABLED` |
| `bun install` | 1203 packages installed |
| `bun run typecheck` | `tsgo -b`, exit 0 |
| `bun run lint` | exit 1: **178 errors, 66 warnings**; `upstream/main` (clean worktree): **182 errors, 66 warnings**; errors present only on this branch (by file, rule and message): **none** |
| `bunx oxlint -c .oxlintrc.json <129 files changed vs upstream/main>` | exit 0, **0 errors**, 8 warnings, all pre-existing (`sync-i18n.mjs` style, `no-danger` in footer, `self-closing-comp` in redemptions columns) |
| `bun run test` | `Test Files 185 passed (185)`, `Tests 2258 passed (2258)`, exit 0 |
| `bun run build` | exit 0 |
| `bun run i18n:sync` | exit 0; fa `partial`, missingCount 5426, extras 0, untranslated 0; the seven required locales missing 0 |
| `bun run i18n:check-fa` | `check-fa: 1352 keys, no findings`, exit 0 |
| `git diff --stat upstream/main -- web/src/i18n/locales/` | only `fa.json` (1356 insertions) |
| `go build -o <scratch>/new-api .` (repo root, Go 1.25.1) | exit 0, embeds the fresh `web/dist` |

### Running app

```
SQLITE_PATH="<scratch>/app/one-api.db?_busy_timeout=30000" PORT=3300 <scratch>/new-api --log-dir <scratch>/app/logs
python3 .fa-review/scripts/seed.py http://127.0.0.1:3300 <scratch>/app/one-api.db
GET  /api/setup                  -> {"data":{"status":false,"root_init":false,"database_type":"sqlite"},"success":true}
POST /api/setup                  -> {"message":"系统初始化成功","success":true}
POST /api/user/login             -> access_token
POST /api/user/  (demo-user)     -> {"success":true}
POST /api/user/manage add_quota  -> {"success":true}      # audit event + top-up row for demo-user
POST /api/token/ x2              -> {"success":true}      # token.create audit events
POST /api/verify (password, access_token.generate) -> proof_token
POST /api/user/token (X-Security-Proof)             -> {"data":"<system access token>","success":true}
GET  /api/user/self, /api/token/, /api/log/self with the system token  # access-token history records
INSERT top_ups DEMO-ORDER-1 (pending); POST /api/user/topup/complete -> {"success":true}  # billing history, top-up row, audit event
INSERT 3 consume logs; 2 legacy manage rows and 1 legacy login row with other.op
PUT  /api/user/self {"language":"fa"} -> {"message":"Update successful","success":true}
```

Playwright 1.56.1 (global), Chromium 141.0.7390.37 headless at `/opt/pw-browsers`, 1440×900, light theme, browser locale `fa-IR` (`node .fa-review/scripts/shots.mjs <url> <out> fa`):

```
page: dir=rtl lang=fa
audit time cell: «۱۴۰۵/۰۷/۰۳ ۱۶:۲۵:۵۷» title=2026-09-25 16:25:57
usage log time cell: «۱۴۰۵/۰۷/۰۳ ۱۶:۱۷:۰۰» title=2026-09-25 16:17:00
details column: ["ورود موفق با password",
  "بازنویسی سهمیۀ کاربر «⁨demo-user⁩» (شناسه: 2) · سهمیۀ درخواستی: ⁨‎$۵⁩ · ‎$۱ → ‎$۵",
  "عملیات ⁨disable⁩ روی کاربر ⁨demo-user⁩ انجام شد (شناسه: 2)",
  "管理员补单成功，充值金额: ＄20.000000，支付金额：20.000000",
  "افزایش سهمیۀ کاربر «⁨demo-user⁩» (شناسه: 2) · سهمیۀ درخواستی: ⁨‎$۵⁩ · ‎$۰ → ‎$۵",
  "استاندارد · ‎$۲٫۵ / ‎$۱۰/M"]
session line: آخرین فعالیت: ⁨۱ ثانیه پیش⁩ · انقضا: ⁨۱۴۰۵/۰۸/۰۳ ۱۶:۲۵⁩
billing date: «۱۴۰۵/۰۶/۳۱ ۱۶:۱۰:۰۰» title=2026-09-22 16:10:00
English run: usage log first cell «2026-09-25 16:17:00» title=null
console errors (every run): 401 on the pre-login session probe; ERR_CERT_AUTHORITY_INVALID for an external resource blocked by the sandbox proxy
```

Screenshots (new in this session):

- `17-audit-log-rtl.png`: audit log viewer
- `18-usage-logs-topup-manage-rtl.png`, `18b-usage-logs-details-column-rtl.png` (table scrolled to the details column): top-up, manage, login and consume rows
- `19-usage-log-details-rtl.png`: details dialog of a consume row
- `20-date-range-picker-rtl.png`: open usage-log range picker (Gregorian, by decision)
- `21-security-sessions-rtl.png`: login sessions with Persian relative times and Solar Hijri expiry (full page)
- `22-access-token-history-rtl.png`: access-token history sheet
- `23-wallet-billing-history-rtl.png`: wallet billing history (Solar Hijri date)
- `24-usage-logs-en.png`: usage logs in English, unchanged
- `25-delete-account-before-en.png`, `25-delete-account-after-en.png`, `26-delete-account-before-zh.png`, `26-delete-account-after-zh.png`: evidence for the upstream branch (D)

## D. Upstream branch fix/delete-account-confirm-label

Branched from `upstream/main` (`c2b7a9a`); head `747769c`; nothing Persian. See the final report in the session for the text before and after.

| Command (in a worktree of that branch) | Result |
| --- | --- |
| `bun run typecheck` | exit 0 |
| `bunx oxlint` on the 3 changed source files | exit 0, 0 errors, 0 warnings |
| `bunx oxfmt --check` on them | clean |
| new test `delete-account-dialog.test.tsx` | `3 passed`; with the upstream dialog: `1 failed / 2 passed` (zhCN case: no textbox named «输入 alice 以确认») |
| `bun run test` | `Test Files 167 passed (167)`, `Tests 2114 passed (2114)`, exit 0 |
| `bun run build` | exit 0 |
| `bun run i18n:sync` | exit 0; the seven locales missing 0, extras 0 (untranslated ja 4, ru 4, zh 3, as on upstream) |

Note: a first full run in that worktree used a symlinked `node_modules` and failed `model-badge.test.tsx` (155 cases, `expected null not to be null`), because Vite does not inline `@lobehub/*` through the symlink. With a real `bun install` the file passes (183 cases); the result above is from that install.

## Remaining RTL and locale issues

1. **Interpolated raw values stay English or Latin**: role names in `Created user … (role {{role}})` (`guest`, `user`, `admin`, `root` come from `AUDIT_ROLE_NAMES`), the login method in legacy login rows (`password`; `renderAuditContent` does not map it, the audit viewer does), `{{action}}` in `Performed {{action}} on user …` (`disable`), IDs and counts (Latin digits, as decided in session 3).
2. **Backend content is Chinese or English**: top-up completion rows show the Go string `管理员补单成功…` (Go i18n is en/zh only).
3. **Quota amounts inside audit descriptors** use `formatLogQuota` without a locale (`quota-audit-operation.ts`), so their digits follow the browser locale, not the interface language. Threading a locale through `buildAuditDetails` / `renderAuditContent` touches many callers.
4. **Date pickers and dashboard chart axes are Gregorian** (B above).
5. Still English on screens seen this session: the wallet Billing History dialog, the usage-log `Tokens` header, the date-range picker labels.
6. Earlier items still open: throughput `t/s 127` order, users page quota cell `-ml-1.5`, `mr-2`/`ml-2` on button spinners, `rtl:` also matching `:lang(fa)` when LTR is forced, carousel arrows, other `<pre>` blocks, the Public Sans font name mismatch, Go backend messages (en/zh only).

## New open questions

1. **Chart axes in Solar Hijri?** It needs `processChartData` / `processUserChartData` to sort by timestamp instead of by label, which also fixes the existing Gregorian year-boundary order. Do it in the fork, or leave charts Gregorian?
2. **Date pickers**: accept `@daypicker/persian` (with the prerelease `date-fns-jalali`) in the fork, or keep Gregorian pickers?
3. **Audit quota amounts and raw role and method values**: pass the interface locale and map roles and methods in `renderAuditContent` (touches the shared descriptors, useful for all languages), or leave as is?
4. **Next batch**: the wallet billing history dialog and the rest of the wallet, or another area?
