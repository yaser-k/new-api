// Session 6 screenshots.
// Usage: node shots6.mjs <base-url> <out-dir> <mode> [prefix]
//   fa:      Persian screens (dashboard across the year boundary and Nowruz,
//            home, profile, pricing, usage-log timing, users, redemption
//            codes, subscriptions, audit log)
//   audit-en: English audit log and details dialog, saved as <prefix>*.png;
//            prints the texts so two servers can be compared
//   billing: billing history dialog, saved as <prefix>.png, in the language
//            given as the last argument (en or zhCN)
//
// The dashboard range rolls back from "now", so those screens fake the page
// clock. Playwright's clock replays its whole log on every page load, which
// moves the page's performance.now() ahead of the real document timeline by
// the time since the first clock call. Motion starts its page-enter opacity
// animations from performance.now(), so after an earlier clock change they
// stay at opacity 0 for several seconds (the blank 31-dashboard-nowruz-rtl.png
// of session 5). Each faked time therefore gets its own browser context, and
// every capture waits until the content is fully opaque.
import { chromium } from 'playwright'

const [base, out, mode, prefix, langArg] = process.argv.slice(2)
const PASSWORD = 'DemoPass-2026!'
// Interface language: fa for the Persian modes, otherwise the optional last
// argument (en or zhCN), stored in localStorage before the page loads.
const lang = mode === 'fa' || mode === 'audit-fa' ? 'fa' : langArg || 'en'
const browserLocales = { fa: 'fa-IR', zhCN: 'zh-CN', en: 'en-US' }

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const contextOptions = {
  viewport: { width: 1440, height: 900 },
  locale: browserLocales[lang] ?? 'en-US',
  timezoneId: 'UTC',
  colorScheme: 'light',
}
const consoleErrors = []
let page

async function openPage() {
  if (page) await page.context().close()
  const context = await browser.newContext(contextOptions)
  await context.addInitScript((l) => {
    localStorage.setItem('i18nextLng', l)
    localStorage.setItem(
      'dashboard_models_chart_preferences',
      JSON.stringify({ defaultTimeRangeDays: 7, defaultTimeGranularity: 'day' })
    )
    localStorage.setItem('data_export_default_time', 'day')
  }, lang)
  page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))
}

async function settle(ms = 800) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

// Wait until the element and all its ancestors are fully opaque.
async function waitOpaque(selector) {
  await page.waitForFunction(
    (sel) => {
      let el = document.querySelector(sel)
      if (!el) return false
      while (el) {
        if (getComputedStyle(el).opacity !== '1') return false
        el = el.parentElement
      }
      return true
    },
    selector,
    { timeout: 30000 }
  )
}

async function shot(name, options = {}) {
  await page.screenshot({ path: `${out}/${name}.png`, ...options })
  const text = await page.evaluate(
    () => (document.querySelector('main') ?? document.body).innerText.length
  )
  console.log(`saved ${name}.png (main text: ${text} chars)`)
}

async function signIn() {
  await page.goto(`${base}/sign-in`)
  await settle()
  await page
    .locator('input[name="username"], input#username')
    .first()
    .fill('admin')
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), {
    timeout: 20000,
  })
  await settle()
}

async function goto(path, selector = 'main h1, main h2, main table') {
  await page.goto(`${base}${path}`)
  await settle(1200)
  await waitOpaque(selector)
}

async function dashboardAt(isoTime, name) {
  await openPage()
  await signIn()
  await page.clock.setSystemTime(new Date(isoTime))
  await page.goto(`${base}/dashboard/models`)
  await settle(1500)
  await page.locator('canvas').first().waitFor({ timeout: 60000 })
  await waitOpaque('canvas')
  await page.waitForTimeout(1500)
  const axis = await page.evaluate(() => document.title)
  console.log(`${name}: page clock ${isoTime}, title ${axis}`)
  await shot(name)
}

async function openDialogByButton(name) {
  await page.getByRole('button', { name }).first().click()
  await settle()
  await waitOpaque('[role="alertdialog"], [role="dialog"]')
}

// Audit log: the rows on the first page, then the details of the user.create
// event (role and actor role), paging forward until it is found.
async function auditShots(listName, detailsName, cleanRow) {
  await goto('/usage-logs/audit')
  const rows = await page.locator('table tbody tr').allInnerTexts()
  console.log('audit rows: ' + JSON.stringify(rows.slice(0, 8).map(cleanRow)))
  await shot(listName)
  const created = /demo-user\u2069? ساخته شد|Created user demo-user/
  for (let i = 0; i < 8; i++) {
    const row = page.locator('table tbody tr', { hasText: created })
    if (await row.count()) break
    await page
      .getByRole('button', { name: /Go to next page|رفتن به صفحۀ بعد/ })
      .first()
      .click()
    await settle()
  }
  const row = page.locator('table tbody tr', { hasText: created }).first()
  console.log('user.create row: ' + JSON.stringify(cleanRow(await row.innerText())))
  await row.getByRole('button').last().click()
  await settle()
  await waitOpaque('[role="dialog"]')
  console.log(
    'audit dialog: ' +
      JSON.stringify(
        (await page.getByRole('dialog').first().innerText())
          .replace(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/g, '<time>')
          .replace(/[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2} [۰-۹:]{8}/g, '<time>')
          .replace(/Request ID \d+|شناسۀ درخواست \d+/g, '<request id>')
          .replace(/\s+/g, ' ')
      )
  )
  await shot(detailsName)
}

if (mode === 'fa') {
  await dashboardAt('2026-01-03T18:00:00Z', '30-dashboard-year-boundary-rtl')
  await dashboardAt('2026-03-23T18:00:00Z', '31-dashboard-nowruz-rtl')

  await openPage()
  await signIn()
  const info = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
  }))
  console.log(`page: dir=${info.dir} lang=${info.lang}`)
  console.log(`browser: Chromium ${browser.version()}`)

  // Home: terminal demo
  await page.goto(`${base}/`)
  await settle(1500)
  const terminal = page.getByText('curl', { exact: true }).first()
  await terminal.scrollIntoViewIfNeeded()
  console.log(
    `home terminal dir: ${await terminal.evaluate((el) => el.closest('[dir]')?.getAttribute('dir'))}`
  )
  await shot('60-home-terminal-rtl')

  // Profile: @handle
  await goto('/profile')
  const handle = page.getByText('@admin', { exact: true }).first()
  console.log(
    `profile handle: «${await handle.innerText()}» dir=${await handle.getAttribute('dir')}`
  )
  await shot('61-profile-rtl')

  // Pricing: token unit toggles and performance values
  await goto('/pricing', 'main')
  await page.waitForTimeout(1000)
  const toggles = await page
    .locator('button bdi[dir="ltr"]')
    .allInnerTexts()
  console.log(`pricing toggles: ${JSON.stringify(toggles)}`)
  const perf = await page.locator('dd bdi[dir="ltr"]').allInnerTexts()
  console.log(`pricing perf values: ${JSON.stringify(perf.slice(0, 6))}`)
  await shot('62-pricing-rtl')

  // Usage logs: timing cell
  await goto('/usage-logs')
  const tps = page.getByText(/ t\/s$/).first()
  if (await tps.count()) {
    await tps.scrollIntoViewIfNeeded()
    console.log(
      `usage-log throughput: «${await tps.innerText()}» dir=${await tps.getAttribute('dir')}`
    )
  } else {
    console.log('usage-log throughput: none shown')
  }
  await page.waitForTimeout(400)
  await shot('63-usage-logs-timing-rtl')

  // Users, user drawer
  await goto('/users')
  await shot('64-users-rtl')
  const demoRow = page.locator('table tbody tr', { hasText: 'demo-user' }).first()
  await demoRow.getByRole('button', { name: 'ویرایش' }).click()
  await page.getByRole('dialog').first().waitFor()
  await settle(1500)
  await shot('64b-user-drawer-rtl')
  await page.keyboard.press('Escape')
  await settle()

  // Redemption codes and the "delete invalid" sentence
  await goto('/redemption-codes')
  await shot('65-redemption-codes-rtl')
  await openDialogByButton('حذف کدهای نامعتبر')
  console.log(
    `delete invalid dialog: «${(await page.getByRole('alertdialog').first().innerText()).replace(/\s+/g, ' ')}»`
  )
  await shot('65b-redemption-delete-invalid-rtl')
  await page.keyboard.press('Escape')
  await settle()

  // Subscriptions
  await goto('/subscriptions')
  await shot('66-subscriptions-rtl')

  // Audit log: roles and sign-in methods
  await auditShots('67-audit-log-rtl', '67b-audit-log-details-rtl', (r) =>
    r.replace(/\s+/g, ' ')
  )
}

if (mode === 'audit-fa') {
  await openPage()
  await signIn()
  await auditShots('67-audit-log-rtl', '67b-audit-log-details-rtl', (r) =>
    r.replace(/\s+/g, ' ')
  )
}

if (mode === 'audit-en') {
  await openPage()
  await signIn()
  console.log(`browser: Chromium ${browser.version()}`)
  // Drop the time column so two servers seeded at different times compare.
  await auditShots(prefix, `${prefix}-details`, (r) =>
    r
      .split('\n')
      .filter((c) => !/^\d{4}-\d\d-\d\d/.test(c))
      .join(' | ')
  )
}

if (mode === 'billing') {
  await openPage()
  await signIn()
  console.log(`browser: Chromium ${browser.version()}`)
  await goto('/wallet', 'main')
  const lng = await page.evaluate(() => document.documentElement.lang)
  const button = page.getByRole('button', {
    name: /Order History|订单历史/,
  })
  await button.first().click()
  await settle()
  await waitOpaque('[role="dialog"]')
  const dialog = page.getByRole('dialog').first()
  await dialog.getByText('DEMO-ORDER-3').first().waitFor()
  const badges = await dialog
    .locator('[data-slot="status-badge"], .rounded-lg.border span')
    .allInnerTexts()
  console.log(`page lang: ${lng}`)
  console.log(
    `billing dialog: ${JSON.stringify((await dialog.innerText()).replace(/\s+/g, ' ').slice(0, 700))}`
  )
  console.log(`badge-like texts: ${JSON.stringify([...new Set(badges)].slice(0, 20))}`)
  await shot(prefix)
}

console.log(`console errors: ${consoleErrors.length}`)
for (const error of consoleErrors) console.log(`  ${error.slice(0, 300)}`)
await browser.close()
