/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const english = {
  'Sign in': 'Sign in',
  'Go to page {{page}}': 'Go to page {{page}}',
  'Learn more': 'Learn more',
}

// [rule, key, planted Persian value]
const cases = [
  ['arabic-yeh-kaf', 'Sign in', 'ورود به سيستم'],
  ['arabic-indic-digit', 'Sign in', 'ورود ٢'],
  ['heh-hamza', 'Sign in', 'صفحهٔ ورود'],
  ['em-dash', 'Sign in', 'ورود — حساب'],
  ['double-space', 'Sign in', 'ورود  حساب'],
  ['irregular-space', 'Sign in', 'ورود حساب'],
  ['misplaced-zwnj', 'Sign in', '‌ورود'],
  ['latin-punctuation', 'Sign in', 'ورود?'],
  ['space-before-mark', 'Sign in', 'ورود ؟'],
  ['latin-spacing', 'Sign in', 'ورودAPI'],
  ['mi-prefix-space', 'Sign in', 'وارد می شوید'],
  ['mi-prefix-joined', 'Sign in', 'وارد میشوید'],
  ['plural-space', 'Sign in', 'حساب ها'],
  ['plural-joined', 'Sign in', 'حسابها'],
  ['comparative-space', 'Learn more', 'اطلاعات بیش تر'],
  ['comparative-joined', 'Learn more', 'اطلاعات بیشتر'],
  ['markup-mismatch', 'Go to page {{page}}', 'رفتن به صفحۀ {{number}}'],
  ['unknown-key', 'Not in English', 'ناشناخته'],
  ['empty-value', 'Sign in', ''],
  ['edge-whitespace', 'Sign in', ' ورود'],
] as const

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
let directory: string

function runCheck(translation: Record<string, string>) {
  const faPath = join(
    directory,
    `fa-${Math.random().toString(36).slice(2)}.json`
  )
  writeFileSync(faPath, JSON.stringify({ translation }))
  return spawnSync(
    process.execPath,
    [
      join(root, 'scripts/check-fa.mjs'),
      faPath,
      '--en',
      join(directory, 'en.json'),
    ],
    { cwd: root, encoding: 'utf8' }
  )
}

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'new-api-check-fa-'))
  writeFileSync(
    join(directory, 'en.json'),
    JSON.stringify({ translation: english })
  )
})

afterAll(() => {
  rmSync(directory, { recursive: true, force: true })
})

describe('check-fa', () => {
  it('exits 0 for text that follows the typography rules', () => {
    const result = runCheck({
      'Sign in': 'با کلید API وارد می‌شوید، سرویس‌ها «فعال» هستند؟',
      'Go to page {{page}}': 'رفتن به صفحۀ {{page}}',
      'Learn more': 'اطلاعات بیش‌تر و میانگین نتیجه‌ها',
    })

    expect(result.stdout).toContain('no findings')
    expect(result.status).toBe(0)
  })

  it.each(cases)('reports %s and exits 1', (rule, key, value) => {
    const result = runCheck({ [key]: value })

    expect(result.stdout).toContain(`[${rule}]`)
    expect(result.status).toBe(1)
  })
})
