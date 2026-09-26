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
import userEvent from '@testing-library/user-event'
import { createInstance, type i18n as I18n } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh.json'

import { RedemptionsPrimaryButtons } from '../redemptions-primary-buttons'
import { RedemptionsProvider } from '../redemptions-provider'

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

async function openDeleteInvalidDialog(lng: string) {
  const i18n = await createAppI18n(lng)
  render(
    <I18nextProvider i18n={i18n}>
      <RedemptionsProvider>
        <RedemptionsPrimaryButtons />
      </RedemptionsProvider>
    </I18nextProvider>
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('Delete Invalid') })
  )
  return screen.findByRole('alertdialog')
}

describe('delete invalid redemption codes dialog', () => {
  it.each([
    [
      'en',
      'This will delete all used, disabled, and expired redemption codes.',
      ['used', 'disabled', 'expired'],
    ],
    [
      'zhCN',
      '这将删除所有已使用、已禁用和已过期的兑换码。',
      ['已使用', '已禁用', '已过期'],
    ],
  ])(
    'in %s, describes the deleted codes in one sentence',
    async (lng, sentence, statuses) => {
      const dialog = await openDeleteInvalidDialog(lng)
      expect(dialog.textContent).toContain(sentence)
      const bold = [...dialog.querySelectorAll('strong')].map(
        (element) => element.textContent
      )
      expect(bold).toEqual(statuses)
    }
  )
})
