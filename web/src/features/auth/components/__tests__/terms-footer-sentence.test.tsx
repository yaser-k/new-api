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
import { render, screen } from '@testing-library/react'
import { createInstance, type i18n as I18n } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh.json'

import type { SystemStatus } from '../../types'
import { TermsFooter } from '../terms-footer'

// Same interpolation and separator options as src/i18n/config.ts.
async function createAppI18n(lng: string): Promise<I18n> {
  const instance = createInstance()
  await instance.init({
    lng,
    fallbackLng: 'en',
    resources: { en, zhCN },
    nsSeparator: false,
    interpolation: { escapeValue: false },
  })
  return instance
}

type Variant = 'sign-in' | 'sign-up'

async function renderFooterText(
  lng: string,
  variant: Variant,
  documents: { agreement: boolean; privacy: boolean }
) {
  const i18n = await createAppI18n(lng)
  const status = {
    user_agreement_enabled: documents.agreement,
    privacy_policy_enabled: documents.privacy,
  } as SystemStatus
  const { container } = render(
    <I18nextProvider i18n={i18n}>
      <TermsFooter variant={variant} status={status} />
    </I18nextProvider>
  )
  return container.querySelector('p')?.textContent
}

const both = { agreement: true, privacy: true }
const agreementOnly = { agreement: true, privacy: false }
const privacyOnly = { agreement: false, privacy: true }

describe('terms footer sentence', () => {
  it.each([
    [
      'sign-in',
      both,
      'By clicking sign in, you agree to our User Agreement and Privacy Policy.',
    ],
    [
      'sign-in',
      agreementOnly,
      'By clicking sign in, you agree to our User Agreement.',
    ],
    [
      'sign-in',
      privacyOnly,
      'By clicking sign in, you agree to our Privacy Policy.',
    ],
    [
      'sign-up',
      both,
      'By creating an account, you agree to our User Agreement and Privacy Policy.',
    ],
    [
      'sign-up',
      agreementOnly,
      'By creating an account, you agree to our User Agreement.',
    ],
    [
      'sign-up',
      privacyOnly,
      'By creating an account, you agree to our Privacy Policy.',
    ],
  ] as const)(
    'in English, %s with documents %o renders the same sentence as before',
    async (variant, documents, expected) => {
      expect(await renderFooterText('en', variant, documents)).toBe(expected)
    }
  )

  it('in English with both documents, links each document to its page', async () => {
    await renderFooterText('en', 'sign-up', both)
    expect(
      screen.getByRole('link', { name: 'User Agreement' })
    ).toHaveAttribute('href', '/user-agreement')
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/privacy-policy')
  })

  it('with neither document configured, renders nothing', async () => {
    expect(
      await renderFooterText('en', 'sign-in', {
        agreement: false,
        privacy: false,
      })
    ).toBeUndefined()
  })

  it.each([
    ['sign-in', both, '点击登录即表示您同意我们的用户协议和隐私政策。'],
    ['sign-in', agreementOnly, '点击登录即表示您同意我们的用户协议。'],
    ['sign-in', privacyOnly, '点击登录即表示您同意我们的隐私政策。'],
    ['sign-up', both, '创建账户即表示您同意我们的用户协议和隐私政策。'],
    ['sign-up', agreementOnly, '创建账户即表示您同意我们的用户协议。'],
    ['sign-up', privacyOnly, '创建账户即表示您同意我们的隐私政策。'],
  ] as const)(
    'in Simplified Chinese, %s with documents %o renders one sentence without English words',
    async (variant, documents, expected) => {
      const text = await renderFooterText('zhCN', variant, documents)
      expect(text).toBe(expected)
      expect(text).not.toMatch(/[A-Za-z]/)
    }
  )
})
