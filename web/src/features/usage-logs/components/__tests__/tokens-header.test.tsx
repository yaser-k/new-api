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
import { renderHook } from '@testing-library/react'
import { createInstance, type i18n as I18n } from 'i18next'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh.json'

import { useCommonLogsColumns } from '../columns/common-logs-columns'

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

async function renderTokensHeader(lng: string) {
  const i18n = await createAppI18n(lng)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  )
  const { result } = renderHook(() => useCommonLogsColumns(true, true), {
    wrapper,
  })
  const column = result.current.find(
    (item) => 'accessorKey' in item && item.accessorKey === 'prompt_tokens'
  )
  return column?.header
}

describe('usage log tokens column header', () => {
  it.each([
    ['en', 'Tokens'],
    ['zhCN', 'Token'],
  ])('in %s, shows the translated header', async (lng, expected) => {
    expect(await renderTokensHeader(lng)).toBe(expected)
  })
})
