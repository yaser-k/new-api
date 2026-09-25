// Usage: node shots.mjs <base-url> <out-dir> <mode>
//   mode "fa": Persian screenshots; mode "en": English usage logs;
//   mode "delete-dialog": English delete-account dialog (upstream branch)
import { chromium } from 'playwright'

const [base, out, mode] = process.argv.slice(2)
const PASSWORD = 'DemoPass-2026!'

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const lang = mode === 'fa' ? 'fa' : 'en'
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: lang === 'fa' ? 'fa-IR' : 'en-US',
  colorScheme: 'light',
})
await context.addInitScript((l) => {
  localStorage.setItem('i18nextLng', l)
}, lang)
const page = await context.newPage()
const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

async function settle() {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(800)
}

await page.goto(`${base}/sign-in`)
await settle()
await page.locator('input[name="username"], input#username').first().fill('admin')
await page.locator('input[type="password"]').first().fill(PASSWORD)
await page.locator('button[type="submit"]').first().click()
await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'), {
  timeout: 20000,
})
await settle()

async function shot(name, options = {}) {
  await page.screenshot({ path: `${out}/${name}.png`, ...options })
  console.log(`saved ${name}.png`)
}

const info = await page.evaluate(() => ({
  dir: document.documentElement.dir,
  lang: document.documentElement.lang,
  ua: navigator.userAgent,
}))
console.log(`page: dir=${info.dir} lang=${info.lang}`)
console.log(`browser: ${browser.version()} ${info.ua}`)

if (mode === 'fa') {
  // Audit log viewer
  await page.goto(`${base}/usage-logs/audit`)
  await settle()
  const auditTime = page.locator('table tbody tr td span[title]').first()
  if (await auditTime.count()) {
    console.log(
      `audit time cell: «${await auditTime.innerText()}» title=${await auditTime.getAttribute('title')}`
    )
  }
  await shot('17-audit-log-rtl')

  // Usage logs with top-up and manage rows
  await page.goto(`${base}/usage-logs`)
  await settle()
  const logTime = page.locator('table tbody tr td span[title]').first()
  if (await logTime.count()) {
    console.log(
      `usage log time cell: «${await logTime.innerText()}» title=${await logTime.getAttribute('title')}`
    )
  }
  await shot('18-usage-logs-topup-manage-rtl')
  // Scroll the table to its far (left) end so the details column shows.
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollWidth > el.clientWidth + 20 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX)) {
        el.scrollLeft = -el.scrollWidth
      }
    }
  })
  await page.waitForTimeout(400)
  const contents = await page.locator('table tbody tr button[title]').allInnerTexts()
  console.log('details column: ' + JSON.stringify(contents))
  await shot('18b-usage-logs-details-column-rtl')

  // One usage-log detail dialog: the top-up row
  const detailsButtons = page.locator('table tbody tr button[title]')
  if (await detailsButtons.count()) {
    await detailsButtons.last().click()
    await settle()
    await shot('19-usage-log-details-rtl')
    await page.keyboard.press('Escape')
    await settle()
  } else {
    console.log('no details button found on usage logs')
  }

  // Open date-range picker
  const rangeTrigger = page.locator('button:has(svg.lucide-calendar-days)').first()
  if (await rangeTrigger.count()) {
    await rangeTrigger.click()
    await settle()
    await shot('20-date-range-picker-rtl')
    await page.keyboard.press('Escape')
  } else {
    console.log('no range picker trigger found')
  }

  // Security page: login sessions (relative times) and access-token history
  await page.goto(`${base}/security`)
  await settle()
  const sessionLine = page.getByText(/آخرین فعالیت/).first()
  if (await sessionLine.count()) {
    console.log(`session line: ${await sessionLine.innerText()}`)
    await sessionLine.scrollIntoViewIfNeeded()
  }
  await shot('21-security-sessions-rtl', { fullPage: true })
  const history = page.getByRole('button', { name: 'سوابق دسترسی' })
  if (await history.count()) {
    await history.first().click()
    await settle()
    await shot('22-access-token-history-rtl')
    await page.keyboard.press('Escape')
  } else {
    console.log('no access records button found')
  }

  // Wallet billing history (dates)
  await page.goto(`${base}/wallet`)
  await settle()
  const billing = page.getByRole('button', { name: /تاریخچۀ سفارش/ })
  if (await billing.count()) {
    await billing.first().click()
    await settle()
    const billingDate = page.locator('[role="dialog"] div[title]').first()
    if (await billingDate.count()) {
      console.log(
        `billing date: «${await billingDate.innerText()}» title=${await billingDate.getAttribute('title')}`
      )
    }
    await shot('23-wallet-billing-history-rtl')
  } else {
    console.log('no billing history button found')
    await shot('23-wallet-billing-history-rtl')
  }
}

if (mode === 'en') {
  await page.goto(`${base}/usage-logs`)
  await settle()
  const logTime = page.locator('table tbody tr td span').first()
  console.log(`usage log first cell (en): «${await logTime.innerText()}» title=${await logTime.getAttribute('title')}`)
  await shot('24-usage-logs-en')
}

if (mode === 'delete-dialog') {
  await page.goto(`${base}/security`)
  await settle()
  await page.getByRole('button', { name: 'Delete Account' }).first().click()
  await settle()
  const label = page.locator('[role="alertdialog"] label, [role="dialog"] label').first()
  console.log(`label text: «${await label.innerText()}»`)
  console.log(`label html: ${await label.innerHTML()}`)
  await shot(process.argv[5] || 'delete-account-dialog')
}

console.log(`console errors: ${consoleErrors.length}`)
for (const error of consoleErrors) console.log(`  ${error.slice(0, 300)}`)
await browser.close()
