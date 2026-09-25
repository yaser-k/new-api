# Persian (fa) translation guide

This guide applies to every Persian string in `web/src/i18n/locales/fa.json`. Follow it in every translation session, together with the i18n workflow in `.agents/skills/i18n-translate/SKILL.md`.

## Locale status

- `fa` is a partial locale. A key that is missing from `fa.json` shows the English text for that key. `bun run i18n:sync` reports missing Persian keys but does not fill them with English.
- Only put a key in `fa.json` when it has a real Persian translation. If the correct Persian text is identical to the English (a brand name, for example), leave the key out.
- Persian is right-to-left. Selecting it sets `dir="rtl"` and `lang="fa"` on the page.
- Numbers and dates formatted through `Intl` use the constant `PERSIAN_INTL_LOCALE` in `web/src/i18n/languages.ts`. It is `fa`, which gives Persian digits (۱۲۳). Set it to `fa-u-nu-latn` for Latin digits (123).
- Write all locale changes through the script described in the i18n skill, then run `bun run i18n:sync` and `bun run i18n:check-fa` from `web/`. The check must report no findings.

## Glossary

Use these terms consistently. If a new recurring term comes up, add it here first.

| English | Persian | Reason |
| --- | --- | --- |
| token (unit of text counted by a model) | توکن | The established loanword in Persian AI writing; a translation such as «نشانه» is not recognized by users. |
| API key | کلید API | «کلید» is the common Persian term for a credential; API stays English. |
| token, when it means an API key (token group, token name) | کلید API / گروه کلید | Older strings call API keys "tokens". Translate by meaning so it is not confused with text tokens. The bare label "Token" stays «توکن» because several screens share it. |
| access token | توکن دسترسی | Standard term in Persian security writing. |
| channel | کانال | Short, familiar loanword; describes a configured upstream connection. |
| model | مدل | Standard term. |
| group | گروه | Standard term. |
| quota | سهمیه | The natural word for an allotted amount of usage. |
| balance | موجودی | What Persian banking and wallet apps use. |
| top-up, recharge | شارژ (verb: شارژ کردن) | What Persian users say for adding credit to an account or wallet. |
| redemption code | کد شارژ | A code that adds credit, the same idea as a prepaid top-up code; «کد بازخرید» is a word-for-word calque. |
| redeem | ثبت کد | Describes the action the user performs. |
| wallet | کیف پول | Standard term in Persian payment apps. |
| subscription | اشتراک | Standard term. |
| subscription plan | طرح اشتراک | «طرح» is common for plans; «پلن» is too informal. |
| usage log | گزارش مصرف | «گزارش» reads naturally for end users; «لاگ» is developer jargon. |
| audit log, task log | گزارش حسابرسی، گزارش وظایف | Same reason as usage log. |
| pricing | قیمت‌گذاری | Standard term. |
| price | قیمت | Standard term. |
| ratio, multiplier | ضریب | It is a billing multiplier; «نسبت» would suggest a fraction. |
| playground | محیط آزمایش | Says what the page is for; «زمین بازی» is a literal calque. |
| dashboard | داشبورد | Widely used loanword. |
| console | کنسول | Widely used loanword; also fits the browser console. |
| model square (model catalog page) | ویترین مدل‌ها | A catalog of models with prices; «ویترین» is the natural Persian image. |
| user, admin | کاربر، مدیر | Standard terms. |
| sign in, sign up, sign out | ورود، ثبت‌نام، خروج | Standard terms on Persian websites. |
| password | رمز عبور | Standard term. |
| verification code | کد تأیید | Standard term. |
| passkey | کلید عبور | The term Persian platform interfaces use. |
| two-factor authentication | احراز هویت دومرحله‌ای | Standard term. |
| authenticator app | برنامۀ احراز هویت | Describes the app, not a brand. |
| session | نشست | Standard term for a sign-in session. |
| profile | پروفایل | More familiar to users than «نمایه». |
| settings | تنظیمات | Standard term. |
| provider (upstream AI service) | ارائه‌دهنده | Standard term. |
| upstream | بالادستی | Standard technical term. |
| task (asynchronous job) | وظیفه | Neutral term for a background job. |
| plugin | افزونه | Standard term. |
| deployment | استقرار | Standard technical term. |
| rate limit | محدودیت نرخ | Standard technical term. |
| link | پیوند | Standard term. |
| theme | پوسته | Standard term in Persian interfaces. |
| sidebar | نوار کناری | Standard term. |
| clipboard | کلیپ‌بورد | Widely used loanword. |
| reset (a password or settings) | بازنشانی | Standard term. |
| refresh | تازه‌سازی | Standard term. |
| announcement, notification | اطلاعیه، اعلان | Standard terms. |

## Terms that stay in English

- Model names and model IDs (gpt-4o, claude-sonnet, gemini-2.5-pro).
- API, JSON, YAML, SDK, URL, HTTP, SMTP, SSRF, OAuth, OIDC, TOTP, IP, QR (as in «کد QR»), UTC.
- Provider, product and brand names: OpenAI, Anthropic, Claude, Gemini, DeepSeek, GitHub, Discord, Telegram, WeChat, LinuxDO, Stripe, Cloudflare, and the product name itself.
- Code: identifiers, JSON keys, file paths, environment variables, HTTP headers, command lines, keyboard key names (Escape, Enter).
- i18next placeholders and markup, exactly as in the English source.

## Typography rules

1. Use ZWNJ (U+200C, نیم‌فاصله) between a word and its affixes, never a space and never fully joined:
   - the verb prefixes می and نمی: می‌شود، نمی‌کند
   - the plural ها: سرویس‌ها، کلید‌های API
   - تر and ترین: بیش‌تر، تازه‌ترین
   ZWNJ is only valid between two Persian letters.
2. Use Persian ی (U+06CC) and ک (U+06A9), never Arabic ي or ك.
3. Never use Arabic-Indic digits (٠ to ٩). Digits written inside a translation use Persian digits (۰ to ۹), to match the Intl default; prefer words for small numbers (شش‌رقمی، یک دقیقه).
4. Write ۀ as the single character U+06C0 (صفحۀ ورود), never ه followed by U+0654.
5. Use Persian punctuation ، ؛ ؟ and « », with no space before the mark. Use … for an ellipsis.
6. No em dash in Persian text.
7. A Latin word or number next to Persian text gets exactly one space on each side: «ورود با GitHub». Never attach a Persian affix to a Latin word; rephrase instead (کلید‌های API, not APIها).
8. Keep i18next placeholders such as `{{count}}` and any markup exactly as in the English source.
9. Write natural, concise product Persian, as a native speaker would write it, not a word-for-word translation.

## Style

- Address the user politely with the plural «شما» and plural imperatives (وارد کنید، تلاش کنید).
- Drop "please" in most prompts and validation messages; Persian interfaces sound more natural without «لطفاً» on every line.
- Buttons and menu items are short: a noun or verbal noun (ذخیره، حذف، ورود) rather than a full sentence.
- Status messages use the past tense (ذخیره شد، ارسال شد); failures use «ناموفق بود».
- Some English keys are sentence fragments that the code joins around a link (for example "I have read and agree to the" + link). Choose wording that still reads naturally in that fixed order.
- Check the call site before translating: the same English key can be a noun in one place and a verb in another.

## Automated check

`bun run i18n:check-fa` (from `web/`) runs `web/scripts/check-fa.mjs` against `fa.json` and exits with code 1 on any finding. It checks rules 1 to 8 plus empty values, stray whitespace, and keys that do not exist in `en.json`.

Its ZWNJ checks for joined words are heuristics:

- Joined می or نمی is detected on any word starting with them, except a short list of real words (میان، میزان، میانگین، میلیون and similar) kept in the script.
- Joined plural ها is detected on any word ending in ها, های or هایی, except a short list of real words (تنها، نهایی and similar).
- Joined تر and ترین are detected only on a list of common adjectives.

Extend those lists in the script when a real word is flagged, and review joined comparatives by eye. Natural phrasing and correct terminology still need a human review.
