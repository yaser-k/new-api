// Session 7 screenshots.
// Usage: node shots7.mjs <base-url> <out-dir> <mode> [stage] [lang]
//   fa:    Persian channels list, channel edit drawer, models list, model
//          edit dialog, and the sign-up page with the legal consent
//   footer: the terms footer below the sign-in and sign-up forms, signed
//          out, saved as 90/91-terms-footer-<page>-<stage>-<lang>.png, or
//          92/93-terms-footer-<page>-rtl.png when lang is fa
//   fixes: the five upstream label fixes, saved as
//          8N-<fix>-<stage>-<lang>.png (stage: before or after; lang: en or
//          zhCN), and prints the text each one shows
//
// Every capture waits until the content is fully opaque (see shots6.mjs),
// then counts the colours of a sample of the image; a capture with fewer
// than 16 colours is reported as BLANK.
import { chromium } from 'playwright'

const [base, out, mode, stage, langArg] = process.argv.slice(2)
const PASSWORD = 'DemoPass-2026!'
const lang = mode === 'fa' ? 'fa' : langArg || 'en'
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

// Colour count of the screenshot (every 4th pixel), computed in the page.
async function colourCount(buffer) {
  return page.evaluate(async (b64) => {
    const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
    const colours = new Set()
    for (let i = 0; i < data.length; i += 16) {
      colours.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2])
    }
    return colours.size
  }, buffer.toString('base64'))
}

async function shot(name, options = {}) {
  const buffer = await page.screenshot({ path: `${out}/${name}.png`, ...options })
  const colours = await colourCount(buffer)
  console.log(
    `saved ${name}.png (${colours} colours${colours < 16 ? ', BLANK' : ''})`
  )
}

async function signIn() {
  await page.goto(`${base}/sign-in`)
  await settle()
  await page
    .locator('input[name="username"], input#username')
    .first()
    .fill('admin')
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  // The legal consent checkbox is a Base UI control; its hidden input is not
  // clickable, the visible role=checkbox element is.
  const consent = page.getByRole('checkbox').first()
  if (await consent.count()) await consent.click()
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

const clean = (text) => text.replace(/\s+/g, ' ').trim()

async function consentText() {
  const label = page.locator('label[for="legal-consent"]').first()
  await label.waitFor({ timeout: 20000 })
  return clean(await label.innerText())
}

if (mode === 'fa') {
  await openPage()
  console.log(`browser: Chromium ${browser.version()}`)

  // Sign-up page, signed out
  await page.goto(`${base}/sign-up`)
  await settle(1500)
  await waitOpaque('label[for="legal-consent"]')
  console.log(`sign-up consent: «${await consentText()}»`)
  const info = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
  }))
  console.log(`page: dir=${info.dir} lang=${info.lang}`)
  await shot('80-sign-up-consent-rtl')

  await signIn()

  // Channels list (card view by default) and the edit drawer of the tagged
  // Azure channel, the first card.
  await goto('/channels', 'main h1, main h2')
  await page.getByText('azure-east').first().waitFor()
  await page.waitForTimeout(800)
  await shot('81-channels-rtl')
  await page.getByRole('button', { name: 'باز کردن منو' }).first().click()
  await settle(400)
  await page.getByRole('menuitem', { name: 'ویرایش' }).first().click()
  await page.getByRole('dialog').first().waitFor()
  await settle(1500)
  await waitOpaque('[role="dialog"]')
  console.log(
    `channel drawer: «${clean(await page.getByRole('dialog').first().innerText()).slice(0, 400)}»`
  )
  await shot('82-channel-edit-drawer-rtl')
  await page.keyboard.press('Escape')
  await settle()

  // Models list and the edit dialog of gpt-4o
  await goto('/models')
  await page.waitForTimeout(800)
  console.log(
    `models header: ${JSON.stringify(await page.locator('table thead th').allInnerTexts())}`
  )
  await shot('83-models-rtl')
  const modelRow = page.locator('table tbody tr', { hasText: 'gpt-4o-mini' }).first()
  await modelRow.getByRole('button', { name: 'ویرایش' }).click()
  await page.getByRole('dialog').first().waitFor()
  await settle(1500)
  await waitOpaque('[role="dialog"]')
  console.log(
    `model dialog: «${clean(await page.getByRole('dialog').first().innerText()).slice(0, 400)}»`
  )
  await shot('84-model-edit-rtl')
}

if (mode === 'fixes') {
  const name = (n, fix) => `${n}-${fix}-${stage}-${lang}`
  await openPage()
  console.log(`browser: Chromium ${browser.version()}`)

  // 1. Legal consent line on the sign-up page (signed out)
  await page.goto(`${base}/sign-up`)
  await settle(1500)
  await waitOpaque('label[for="legal-consent"]')
  console.log(`legal consent: «${await consentText()}»`)
  await page.locator('label[for="legal-consent"]').first().scrollIntoViewIfNeeded()
  await shot(name(85, 'legal-consent'))

  await signIn()
  console.log(
    `page lang: ${await page.evaluate(() => document.documentElement.lang)}`
  )

  // 2. Usage-log Tokens column header
  await goto('/usage-logs/common')
  const headers = await page.locator('table thead th').allInnerTexts()
  console.log(`usage-log headers: ${JSON.stringify(headers.map(clean))}`)
  await shot(name(86, 'usage-log-tokens'))

  // 3. Top-up presets
  await goto('/wallet', 'main')
  const preset = page.locator('button', { hasText: /100/ }).filter({
    has: page.locator('.text-green-600'),
  })
  await preset.first().waitFor({ timeout: 20000 })
  await preset.first().scrollIntoViewIfNeeded()
  console.log(`top-up preset: «${clean(await preset.first().innerText())}»`)
  console.log(
    `amount placeholder: «${await page.locator('#topup-amount').getAttribute('placeholder')}»`
  )
  await shot(name(87, 'topup-presets'))

  // 4. Subscription plan status
  await goto('/subscriptions')
  const planRow = page.locator('table tbody tr', { hasText: 'Basic' }).first()
  console.log(`subscription row: «${clean(await planRow.innerText())}»`)
  await shot(name(88, 'subscription-status'))

  // 5. Redemption codes: delete-invalid dialog
  await goto('/redemption-codes')
  await page
    .getByRole('button', { name: /Delete Invalid|删除无效/ })
    .first()
    .click()
  await settle()
  await waitOpaque('[role="alertdialog"]')
  console.log(
    `delete invalid dialog: «${clean(await page.getByRole('alertdialog').first().innerText())}»`
  )
  await shot(name(89, 'redemption-delete-invalid'))
}

if (mode === 'footer') {
  await openPage()
  console.log(`browser: Chromium ${browser.version()}`)
  for (const [n, pagePath] of [
    [90, 'sign-in'],
    [91, 'sign-up'],
  ]) {
    await page.goto(`${base}/${pagePath}`)
    await settle(1500)
    const footer = page
      .locator('p', { has: page.locator('a[href="/privacy-policy"]') })
      .last()
    await footer.waitFor({ timeout: 20000 })
    await waitOpaque('form')
    console.log(`${pagePath} footer: «${clean(await footer.innerText())}»`)
    const info = await page.evaluate(() => document.documentElement.dir || 'ltr')
    console.log(`${pagePath} dir: ${info}`)
    const file =
      lang === 'fa'
        ? `${n + 2}-terms-footer-${pagePath}-rtl`
        : `${n}-terms-footer-${pagePath}-${stage}-${lang}`
    await shot(file)
  }
}

console.log(`console errors: ${consoleErrors.length}`)
for (const error of consoleErrors) console.log(`  ${error.slice(0, 300)}`)
await browser.close()
