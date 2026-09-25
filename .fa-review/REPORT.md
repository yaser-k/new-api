# Persian (fa) locale: foundation and first batch

Temporary review folder. Delete `.fa-review/` before any upstream PR.

Branch: `feat/fa-locale`, created from `upstream/main` at `c2b7a9a`.

## What changed and where

### Wiring (web/src/i18n, web/src/context)
- `web/src/i18n/languages.ts`
  - `fa` added to `INTERFACE_LANGUAGE_OPTIONS` with label فارسی and `dir: 'rtl'`.
  - `PARTIAL_INTERFACE_LANGUAGES = ['fa']` documents which locales may be incomplete.
  - `getInterfaceLanguageDirection()` returns `rtl` for fa and `ltr` for every other language.
  - `convertDetectedLanguage()` maps `fa`, `fa-IR` and any `fa-*` browser tag to `fa`. `normalizeInterfaceLanguage()` does the same.
  - `toIntlLocale('fa')` returns `PERSIAN_INTL_LOCALE`.
  - **Digit constant:** `PERSIAN_INTL_LOCALE` at `web/src/i18n/languages.ts:43`. It is `'fa'`, the Intl default, which gives Persian digits. Change it to `'fa-u-nu-latn'` for Latin digits.
- `web/src/i18n/config.ts`: `fa` added to `resources` and `supportedLngs`. The existing `fallbackLng: 'en'` gives the per-key English fallback.
- `web/src/context/direction-provider.tsx`: the language now sets the default direction, and the provider sets `html dir` and `html lang` (via `toIntlLocale`). The manual LTR/RTL toggle in the config drawer is kept as an override (same `dir` cookie). The override is cleared when the language changes, so choosing fa gives rtl and choosing any other language gives ltr.
- `web/src/components/layout/components/app-sidebar.tsx`: the sidebar docks on the right in rtl. Without this, the fixed sidebar stayed at the physical left and covered the content in RTL. This bug also affects the existing manual RTL toggle upstream. It is the only RTL layout fix in this batch.

### Tooling
- `web/scripts/sync-i18n.mjs`: new `PARTIAL_LOCALES = new Set(['fa'])`. For a partial locale, missing keys are reported (`missingCount`, `partial: true` in `_sync-report.json`) but not filled with English. The seven existing locales behave exactly as before; the sync leaves their files byte-identical (checked with md5). Also fixed one pre-existing `curly` lint error in this file, because web/AGENTS.md requires touched files to be lint-clean.
- `web/scripts/check-fa.mjs` + `bun run i18n:check-fa`: Persian typography check, exits 1 on any finding.
- `.agents/skills/i18n-translate/SKILL.md`: fa documented as the optional eighth locale. The script template now creates `fa.json` if missing, rejects fa keys that are not in `en.json`, and ends with the check script.
- `AGENTS.md` (language list, CLI tools, pointer to the glossary) and `web/AGENTS.md` (regression tests must cover all interface languages, now including fa).

### Glossary and style guide
- `docs/i18n/fa.md`: glossary (47 terms with reasons), terms that stay in English, the typography rules, style notes, and what the check script can and cannot detect.

### Translations
- `web/src/i18n/locales/fa.json`: **397 keys** translated, 6381 keys fall back to English.
- Scope: sign-in, sign-up, forgot/reset password, OTP, passkey and secure verification, OAuth callback, form validation messages; main sidebar and the system-settings sidebar groups; top bar (top-nav links, search, command menu, language switcher, theme switcher, notifications, profile menu, sign-out dialog, config drawer); public header and footer; shared data-table UI (pagination, filters, bulk actions); common actions and labels (save, cancel, delete, confirm, search, edit, …).
- Written through the skill's `add-missing-keys.mjs` script (deleted afterwards, as the skill says), then `bun run i18n:sync`.
- Keys where the correct Persian text is the English text (brand names such as Gemini and Claude, `name@example.com`, `New API`) were left out, so they fall back.

### Tests added
- `web/src/i18n/__tests__/languages.test.ts`: `toIntlLocale` for all 8 languages plus an invalid tag, Persian digits by default, fa/fa-IR detection, direction per language, and per-key English fallback using the real `fa.json` and `en.json`.
- `web/src/context/__tests__/direction-provider.test.tsx`: rtl and lang=fa on switching to fa, ltr on switching away, manual override until the next language change, manual ltr for a Persian user, override restored from the cookie. 4 of 5 fail against the old provider.
- `web/src/components/layout/components/__tests__/app-sidebar-direction.test.tsx`: sidebar side in ltr and after switching to fa. The rtl case fails without the fix.
- `web/scripts/__tests__/check-fa.test.ts`: clean input exits 0; each of the 20 rules is triggered by one input and exits 1. (Added to `vitest.config.ts` and `tsconfig.node.json`.)
- `web/scripts/oxlint/__tests__/intl-locale.test.ts`: `"fa"` added to the fixed-tag case that must not be reported.

## Verification (run in `web/`)

| Command | Result |
| --- | --- |
| `bun install` | 1202 packages installed, exit 0 |
| `bun run typecheck` | exit 0, no errors |
| `bun run lint` | exit 1. 181 errors, all in files this branch does not touch. `upstream/main` has 182 (measured in a clean worktree); the difference is the `curly` fix in `sync-i18n.mjs`. 0 errors in changed files (`bunx oxlint -c .oxlintrc.json <changed files>` exits 0) |
| `bun run test` | 170 files, 2166 tests passed, exit 0 |
| `bun run build` | exit 0 |
| `bun run i18n:sync` | exit 0. fa: `partial: true`, missingCount 6381, extras 0, untranslated 0. Other locales unchanged |
| `bun run i18n:check-fa` | `check-fa: 397 keys, no findings`, exit 0 |
| `bun run format` | applied to changed files only (the repo-wide `format:check` already fails on many upstream files) |

Final test run on the committed tree: `Test Files 170 passed (170)`, `Tests 2166 passed (2166)`, exit 0. `bun run build` exit 0.

### Proof that the check fails

A temporary copy of `fa.json` with 21 planted mistakes (one per rule, plus a second Arabic-letter case) was checked, then deleted:

```
$ node scripts/check-fa.mjs <scratch>/fa.planted.json
"API Keys": [latin-spacing] Latin word or number touching Persian text; separate with one space
"Are you sure you want to sign out? …": [mi-prefix-space] space after the می/نمی verb prefix; use ZWNJ
"Channels": [plural-space] space before the plural ها; use ZWNJ
"Close": [empty-value] value is empty or not a string
"Copy": [arabic-yeh-kaf] Arabic ي or ك; use Persian ی (U+06CC) and ک (U+06A9)
"Delete": [irregular-space] tab, no-break or other irregular space
"Don't have an account?": [space-before-mark] space before a punctuation mark (or after «)
"Edit": [misplaced-zwnj] ZWNJ must sit between two Persian letters
"Enter password (8–128 characters)": [arabic-indic-digit] Arabic-Indic digit (٠ to ٩)
"Forgot password?": [latin-punctuation] Latin , ; ? or " in Persian text; use ، ؛ ؟ « »
"Go to page {{page}}": [markup-mismatch] placeholders or markup differ from the English source
"Learn more": [comparative-space] space before تر/ترین; use ZWNJ
"More": [comparative-joined] تر/ترین joined to the word; use ZWNJ: بیشتر
"Open": [edge-whitespace] leading or trailing whitespace
"Passkey is not supported on this device": [mi-prefix-joined] … use ZWNJ: نمیکند
"Search": [double-space] more than one space in a row
"Sign in": [arabic-yeh-kaf] Arabic ي or ك; …
"Subscriptions": [plural-joined] plural ها joined to the word; use ZWNJ: اشتراکها
"Unknown version": [heh-hamza] ه followed by U+0654; use the single character ۀ (U+06C0)
"Welcome back!": [em-dash] em dash in Persian text
"This key does not exist in English": [unknown-key] key does not exist in en.json

check-fa: 21 finding(s) in 398 keys
exit=1
```

21 planted, 21 caught. The first run on my own draft also caught 5 joined plurals (کلیدهای، کدهای، فیلترها ×2، رمزهای), which I fixed before writing.

### Browser check

Ran the real app: Go binary built from this branch (embeds the fresh `web/dist`), SQLite in a scratch directory, local admin created through `/api/setup`, Playwright Chromium with browser locale `fa-IR` and empty storage:

```
sign-in (browser fa-IR): dir=rtl lang=fa     <- detected from the browser language
dashboard: dir=rtl lang=fa i18nextLng=fa
after switching to English: dir=ltr lang=en
after switching back to Persian: dir=rtl lang=fa
```

Screenshots:
- `01-sign-in-rtl.png`, `02-sign-up-rtl.png`, `07-sign-in-mobile-rtl.png` (390 px wide)
- `03-dashboard-rtl.png`: main dashboard in RTL (after the sidebar fix)
- `04-language-switcher-rtl.png`, `05-config-drawer-rtl.png`
- `06-dashboard-english-ltr.png`: same session after switching to English

## Things that look broken or unfinished in RTL

Only the sidebar docking was fixed. The rest is reported, not fixed:

1. **Fonts.** The theme fonts (Public Sans, Lora) have no Arabic-script glyphs, so Persian falls back to whatever the OS has. In the screenshots that is DejaVu Sans, which looks rough. A Persian web font (for example Vazirmatn) is needed; see open question 1.
2. **Currency does not re-render on a language change.** After switching fa → English without a reload, the balance cards still show Persian digits (`$۲۰۰` in `06-dashboard-english-ltr.png`). The same will happen when switching into fa. This is a pre-existing reactivity bug in the dashboard's currency display, not in `toIntlLocale`.
3. **Config drawer close button** overlaps the title «تنظیمات ظاهر» in RTL (`05-config-drawer-rtl.png`).
4. **Directional icons don't flip.** Examples: sidebar collapsible chevrons (`nav-group.tsx`, `chat-presets-item.tsx`), sidebar view back chevron (`sidebar-view-header.tsx`), pagination prev/next chevrons (`data-table/core/pagination.tsx`), the forgot-password submit arrow, dashboard card arrows.
5. **Code and English text in an RTL container.** The curl sample on the dashboard is right-aligned and truncated on the wrong side; untranslated English sentences show their full stop on the left (".A focused home…") and list numbers as ".1". Code blocks need `dir="ltr"`; the rest goes away as keys get translated (or with `dir="auto"` on those elements).
6. **Physical CSS classes.** Several files use `text-left`, `ml-*`, `left-*` instead of logical `text-start`/`ms-*`/`start-*`, e.g. `legal-consent.tsx` (`text-left`), `ui/sidebar.tsx` (inset `ml-0`/`ml-2`), badge and data-table cells. Not visible in the screenshots taken, but they will misalign in RTL.
7. **Hard-coded English in `legal-consent.tsx`.** The joiner `' and the '` between the two legal links is a literal string, not `t('and')`, so Persian users will see «… توافق‌نامۀ کاربری and the سیاست حریم خصوصی.»
8. **Key collision "Type".** The same key is used as a noun (column "Type" → «نوع») and as a verb in the delete-account dialog ("Type <username> to confirm"). The Persian noun is right almost everywhere but makes that sentence wrong. It needs a separate key upstream.
9. **Top-nav links** are drawn under the "welcome back" toast in both directions. That is existing behaviour, not RTL-specific.
10. **Backend messages.** API error messages come from the Go `i18n/` package (en, zh, zh-TW only), so Persian users get English server errors. This is out of scope for the web locale.

## Open questions

1. **Persian font:** OK to add a Persian web font (for example `@fontsource-variable/vazirmatn`, SIL OFL) and use it when `lang=fa`? That adds a dependency, so I did not do it without asking.
2. **Comparatives:** your rules say تر/ترین always take ZWNJ, so I wrote «بیش‌تر» (the "More" button, "Learn more"). The Academy of Persian Language guide makes an exception for بیشتر، کمتر، بهتر (written joined). Keep the strict rule, or allow those exceptions? If you allow them, the checker's comparative list needs the change too.
3. **Plurals after non-joining letters:** also per your rules, I wrote کلید‌های، کد‌های، رمز‌های، فیلتر‌ها with ZWNJ even though the letter before ها does not join. Confirm that's intended.
4. **Digits inside translations:** runtime numbers follow `PERSIAN_INTL_LOCALE`, but digits typed into a string don't. I avoided them where possible («شش‌رقمی») and used Persian digits where unavoidable («۸ تا ۱۲۸ کاراکتر»). If you switch the constant to Latin digits, those strings need updating too. `{{count}}` interpolations are not Intl-formatted, so they always show Latin digits («5 دقیقه پیش»). OK?
5. **Terminology to confirm:** top-up = «شارژ», redemption code = «کد شارژ», playground = «محیط آزمایش», Model Square = «ویترین مدل‌ها», usage log = «گزارش مصرف», ratio = «ضریب», passkey = «کلید عبور», profile = «پروفایل» (not «نمایه»), sidebar group "Admin" = «مدیر» (the same key is used as the role name).
6. **Fixing the RTL issues above:** should the next session fix items 3 to 7 before more translation, or keep translating first?
