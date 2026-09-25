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
import { createInstance, type i18n as I18n } from 'i18next'
import { beforeAll, describe, expect, test } from 'vitest'

import { toIntlLocale } from '@/i18n/languages'
import en from '@/i18n/locales/en.json'
import fa from '@/i18n/locales/fa.json'
import zh from '@/i18n/locales/zh.json'

import type { LogOtherData } from '../../types'
import { renderAuditContent } from '../format'

const FSI = '⁨'
const PDI = '⁩'

async function createI18n(lng: string): Promise<I18n> {
  const i18n = createInstance()
  await i18n.init({
    lng,
    fallbackLng: 'en',
    resources: { en, fa, zh },
    interpolation: { escapeValue: false },
  })
  return i18n
}

const userCreate: LogOtherData = {
  op: { action: 'user.create', params: { username: 'alice', role: 100 } },
}
const passwordLogin: LogOtherData = {
  op: { action: 'login', params: { method: 'password' } },
}
const githubLogin: LogOtherData = {
  op: { action: 'login', params: { method: 'oauth:github' } },
}
// quota 500000 is $1 with the default currency settings.
const quotaAdd: LogOtherData = {
  op: {
    action: 'user.quota_add',
    params: {
      target_username: 'alice',
      target_user_id: 2,
      quota: 500000,
      from: 0,
      to: 500000,
    },
  },
}

describe('renderAuditContent values', () => {
  let enI18n: I18n
  let faI18n: I18n
  let zhI18n: I18n

  beforeAll(async () => {
    enI18n = await createI18n('en')
    faI18n = await createI18n('fa')
    zhI18n = await createI18n('zh')
  })

  test('in English, a created user shows the role label instead of the raw role', () => {
    expect(renderAuditContent(userCreate, enI18n.t, toIntlLocale('en'))).toBe(
      'Created user alice (role Super Admin)'
    )
  })

  test('in Persian, a created user shows the Persian role label', () => {
    expect(renderAuditContent(userCreate, faI18n.t, toIntlLocale('fa'))).toBe(
      `کاربر ${FSI}alice${PDI} ساخته شد (نقش ${FSI}مدیر ارشد${PDI})`
    )
  })

  test('in Chinese, a created user shows the Chinese role label', () => {
    expect(
      renderAuditContent(userCreate, zhI18n.t, toIntlLocale('zhCN'))
    ).toContain('超级管理员')
  })

  test('an unknown role number stays as recorded', () => {
    const other: LogOtherData = {
      op: { action: 'user.create', params: { username: 'alice', role: 7 } },
    }
    expect(renderAuditContent(other, enI18n.t, toIntlLocale('en'))).toBe(
      'Created user alice (role 7)'
    )
  })

  test('in English, a login shows the sign-in method label', () => {
    expect(
      renderAuditContent(passwordLogin, enI18n.t, toIntlLocale('en'))
    ).toBe('Logged in successfully via Password')
    expect(renderAuditContent(githubLogin, enI18n.t, toIntlLocale('en'))).toBe(
      'Logged in successfully via OAuth · GitHub'
    )
  })

  test('in Persian, a login shows the Persian sign-in method label', () => {
    expect(
      renderAuditContent(passwordLogin, faI18n.t, toIntlLocale('fa'))
    ).toBe('ورود موفق با رمز عبور')
  })

  test('the generic descriptor keeps the recorded HTTP method', () => {
    const other: LogOtherData = {
      op: { action: 'generic', params: { method: 'POST', route: '/api/x' } },
    }
    expect(renderAuditContent(other, enI18n.t, toIntlLocale('en'))).toBe(
      'POST /api/x'
    )
  })

  test('quota amounts follow the interface locale', () => {
    const english = renderAuditContent(quotaAdd, enI18n.t, toIntlLocale('en'))
    const persian = renderAuditContent(quotaAdd, faI18n.t, toIntlLocale('fa'))

    expect(english).toContain('Requested quota: $1')
    expect(english).toContain('$0 → $1')
    expect(persian).toContain('۱')
    expect(persian).not.toMatch(/\$1\b/)
  })
})
