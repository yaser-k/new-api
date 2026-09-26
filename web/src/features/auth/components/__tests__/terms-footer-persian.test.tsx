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
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import en from '@/i18n/locales/en.json'
import fa from '@/i18n/locales/fa.json'

import type { SystemStatus } from '../../types'
import { TermsFooter } from '../terms-footer'

describe('terms footer in Persian', () => {
  it.each([
    [
      'sign-in',
      'با کلیک روی «ورود»، توافق‌نامۀ کاربری و سیاست حریم خصوصی ما را می‌پذیرید.',
    ],
    [
      'sign-up',
      'با ساخت حساب کاربری، توافق‌نامۀ کاربری و سیاست حریم خصوصی ما را می‌پذیرید.',
    ],
  ] as const)(
    'on %s, renders one Persian sentence with both links',
    async (variant, expected) => {
      const i18n = createInstance()
      await i18n.init({
        lng: 'fa',
        fallbackLng: 'en',
        resources: { en, fa },
        nsSeparator: false,
        interpolation: { escapeValue: false },
      })
      const status = {
        user_agreement_enabled: true,
        privacy_policy_enabled: true,
      } as SystemStatus
      const { container } = render(
        <I18nextProvider i18n={i18n}>
          <TermsFooter variant={variant} status={status} />
        </I18nextProvider>
      )
      expect(container.querySelector('p')?.textContent).toBe(expected)
      expect(
        screen.getByRole('link', { name: 'سیاست حریم خصوصی' })
      ).toHaveAttribute('href', '/privacy-policy')
    }
  )
})
