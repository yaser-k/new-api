// Session 5 screenshots.
// Usage: node shots5.mjs <base-url> <out-dir> <mode> [prefix]
//   mode "fa": Persian screens; "en": English dashboard and date picker;
//   "chart-en": English dashboard chart across a year boundary only
//   (for the upstream branch, before and after), saved as <prefix>.png.
import { chromium } from 'playwright'

const [base, out, mode, prefix] = process.argv.slice(2)
const PASSWORD = 'DemoPass-2026!'
const lang = mode === 'fa' ? 'fa' : 'en'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const contextOptions = {
  viewport: { width: 1440, height: 900 },
  locale: lang === 'fa' ? 'fa-IR' : 'en-US',
  timezoneId: 'UTC',
  colorScheme: 'light',
}
const initScript = (l) => {
  localStorage.setItem('i18nextLng', l)
  // Dashboard: 7 days, one point per day.
  localStorage.setItem(
    'dashboard_models_chart_preferences',
    JSON.stringify({ defaultTimeRangeDays: 7, defaultTimeGranularity: 'day' })
  )
  localStorage.setItem('data_export_default_time', 'day')
}
const consoleErrors = []
let page

// A fake page clock stalls the page transitions, so screens that do not need
// it get a fresh context without one.
async function openPage() {
  const context = await browser.newContext(contextOptions)
  await context.addInitScript(initScript, lang)
  page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(String(err)))
}
await openPage()

async function settle(ms = 800) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function shot(name, options = {}) {
  await page.screenshot({ path: `${out}/${name}.png`, ...options })
  console.log(`saved ${name}.png`)
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

// The dashboard range rolls back from "now", so move the page clock (it keeps running).
async function dashboardAt(isoTime, name) {
  await page.clock.setSystemTime(new Date(isoTime))
  await page.goto(`${base}/dashboard/models`)
  await settle(2500)
  if (new URL(page.url()).pathname.startsWith('/sign-in')) {
    console.log(`signed out at ${isoTime}; signing in again`)
    await signIn()
    await page.goto(`${base}/dashboard/models`)
    await settle(2500)
  }
  const chart = page.locator('canvas').first()
  await chart.waitFor({ timeout: 60000 })
  await chart.scrollIntoViewIfNeeded()
  await page.waitForTimeout(2500)
  await shot(name)
}

async function openDashboardDatePicker(name) {
  const filterButton = page
    .getByRole('button', { name: lang === 'fa' ? /فیلتر/ : /Filter/ })
    .first()
  await filterButton.waitFor({ timeout: 60000 })
  await filterButton.click()
  await settle()
  const dialog = page.getByRole('dialog').first()
  const trigger = dialog.locator('button:has(svg.lucide-chevron-down)').first()
  console.log(`date picker trigger: «${(await trigger.innerText()).trim()}»`)
  await trigger.click()
  await settle(1500)
  const grid = page.getByRole('grid').first()
  console.log(`calendar grid label: «${await grid.getAttribute('aria-label')}»`)
  console.log(
    `calendar dir: ${await page.locator('[data-slot="calendar"]').first().getAttribute('dir')}`
  )
  await shot(name)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await settle()
}

await signIn()
const info = await page.evaluate(() => ({
  dir: document.documentElement.dir,
  lang: document.documentElement.lang,
  ua: navigator.userAgent,
}))
console.log(`page: dir=${info.dir} lang=${info.lang}`)
console.log(`browser: Chromium ${browser.version()}`)

if (mode === 'chart-en') {
  await dashboardAt('2026-01-03T18:00:00Z', prefix)
}

if (mode === 'en') {
  await dashboardAt('2026-01-03T18:00:00Z', '40-dashboard-year-boundary-en')
  await openDashboardDatePicker('41-date-picker-en')
}

if (mode === 'fa') {
  await dashboardAt('2026-01-03T18:00:00Z', '30-dashboard-year-boundary-rtl')
  await dashboardAt('2026-03-23T18:00:00Z', '31-dashboard-nowruz-rtl')
  await openDashboardDatePicker('32-date-picker-rtl')
  await openPage()
  await signIn()

  // Usage-log range picker: Solar Hijri trigger text, open popover
  await page.goto(`${base}/usage-logs`)
  await settle()
  const rangeTrigger = page
    .locator('button:has(svg.lucide-calendar-days)')
    .first()
  if (await rangeTrigger.count()) {
    console.log(`range trigger: «${(await rangeTrigger.innerText()).trim()}»`)
    await rangeTrigger.click()
    await settle()
    const startInput = page.getByLabel('زمان شروع').first()
    if (await startInput.count()) {
      console.log(`range start input value: ${await startInput.inputValue()}`)
    }
    await shot('33-usage-log-range-picker-rtl')
    await page.keyboard.press('Escape')
  }
  // Details column: login method and legacy rows
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (
        el.scrollWidth > el.clientWidth + 20 &&
        ['auto', 'scroll'].includes(getComputedStyle(el).overflowX)
      ) {
        el.scrollLeft = -el.scrollWidth
      }
    }
  })
  await page.waitForTimeout(400)
  const contents = await page
    .locator('table tbody tr button[title]')
    .allInnerTexts()
  console.log('usage-log details column: ' + JSON.stringify(contents))
  await shot('34-usage-logs-details-rtl')

  // Audit log: roles and sign-in methods
  await page.goto(`${base}/usage-logs/audit`)
  await settle()
  const events = await page.locator('table tbody tr').allInnerTexts()
  console.log(
    'audit rows: ' +
      JSON.stringify(events.slice(0, 8).map((row) => row.replace(/\s+/g, ' ')))
  )
  await shot('35-audit-log-rtl')
  const userCreate = page.locator('table tbody tr', { hasText: 'demo-user' })
  const detailsButton = userCreate.last().getByRole('button').last()
  if (await detailsButton.count()) {
    await detailsButton.click()
    await settle()
    const dialogText = await page.getByRole('dialog').first().innerText()
    console.log(
      'audit dialog excerpt: ' +
        JSON.stringify(dialogText.replace(/\s+/g, ' ').slice(0, 400))
    )
    await shot('36-audit-log-details-rtl')
    await page.keyboard.press('Escape')
    await settle()
  }

  // Wallet and billing history
  await page.goto(`${base}/wallet`)
  await settle()
  await shot('37-wallet-rtl', { fullPage: true })
  const billing = page.getByRole('button', { name: /تاریخچۀ سفارش/ })
  if (await billing.count()) {
    await billing.first().click()
    await settle()
    await shot('38-wallet-billing-history-rtl')
    await page.keyboard.press('Escape')
    await settle()
  } else {
    console.log('no billing history button found')
  }

  // Pricing and model detail
  await page.goto(`${base}/pricing`)
  await settle(1500)
  await shot('39-pricing-rtl')
  const firstModel = await page.evaluate(async () => {
    const res = await fetch('/api/pricing')
    const body = await res.json()
    return body?.data?.[0]?.model_name ?? null
  })
  console.log(`first pricing model: ${firstModel}`)
  if (firstModel) {
    await page.goto(`${base}/pricing/${encodeURIComponent(firstModel)}`)
    await settle(1500)
    await shot('39b-model-detail-rtl', { fullPage: true })
  }

  // Home, profile, error page, about
  await page.goto(`${base}/`)
  await settle(1500)
  await shot('42-home-rtl', { fullPage: true })
  await page.goto(`${base}/profile`)
  await settle(1500)
  await shot('43-profile-rtl', { fullPage: true })
  await page.goto(`${base}/404`).catch((error) => console.log(`404 page: ${error.message.split("\n")[0]}`))
  await settle()
  await shot('44-error-404-rtl')
  await page.goto(`${base}/about`)
  await settle()
  await shot('45-about-rtl')
}

console.log(`console errors: ${consoleErrors.length}`)
for (const error of consoleErrors) console.log(`  ${error.slice(0, 300)}`)
await browser.close()
