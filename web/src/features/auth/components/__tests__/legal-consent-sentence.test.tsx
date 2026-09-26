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
import { LegalConsent } from '../legal-consent'

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

async function renderConsentText(
  lng: string,
  documents: { agreement: boolean; privacy: boolean }
) {
  const i18n = await createAppI18n(lng)
  const status = {
    user_agreement_enabled: documents.agreement,
    privacy_policy_enabled: documents.privacy,
  } as SystemStatus
  render(
    <I18nextProvider i18n={i18n}>
      <LegalConsent
        status={status}
        checked={false}
        onCheckedChange={() => {}}
      />
    </I18nextProvider>
  )
  return document.querySelector('label[for="legal-consent"]')?.textContent
}

describe('legal consent sentence', () => {
  it.each([
    [
      { agreement: true, privacy: true },
      'I have read and agree to the User Agreement and the Privacy Policy.',
    ],
    [
      { agreement: true, privacy: false },
      'I have read and agree to the User Agreement.',
    ],
    [
      { agreement: false, privacy: true },
      'I have read and agree to the Privacy Policy.',
    ],
  ])(
    'in English with documents %o, renders the same sentence as before',
    async (documents, expected) => {
      expect(await renderConsentText('en', documents)).toBe(expected)
    }
  )

  it('in English with both documents, links each document to its page', async () => {
    await renderConsentText('en', { agreement: true, privacy: true })
    expect(
      screen.getByRole('link', { name: 'User Agreement' })
    ).toHaveAttribute('href', '/user-agreement')
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/privacy-policy')
  })

  it.each([
    [{ agreement: true, privacy: true }, '我已阅读并同意用户协议和隐私政策。'],
    [{ agreement: true, privacy: false }, '我已阅读并同意用户协议。'],
    [{ agreement: false, privacy: true }, '我已阅读并同意隐私政策。'],
  ])(
    'in Simplified Chinese with documents %o, renders one sentence without English words',
    async (documents, expected) => {
      const text = await renderConsentText('zhCN', documents)
      expect(text).toBe(expected)
      expect(text).not.toMatch(/[A-Za-z]/)
    }
  )
})
