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
import type { CellContext } from '@tanstack/react-table'
import { render, renderHook, screen } from '@testing-library/react'
import { createInstance, type i18n as I18n } from 'i18next'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh.json'

import type { PlanRecord } from '../../types'
import { useSubscriptionsColumns } from '../subscriptions-columns'

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

async function renderStatusCell(lng: string, enabled: boolean) {
  const i18n = await createAppI18n(lng)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
  )
  const { result } = renderHook(() => useSubscriptionsColumns(), { wrapper })
  const column = result.current.find((item) => item.id === 'enabled')
  if (typeof column?.cell !== 'function') {
    throw new Error('status column has no cell renderer')
  }
  const context = {
    row: { original: { plan: { enabled } } },
  } as unknown as CellContext<PlanRecord, unknown>
  render(<>{column.cell(context)}</>)
}

describe('subscription plan status label', () => {
  it.each([
    ['en', true, 'Enabled'],
    ['en', false, 'Disabled'],
    ['zhCN', true, '已启用'],
    ['zhCN', false, '已禁用'],
  ])(
    'in %s with enabled=%s, shows the status %s',
    async (lng, enabled, expected) => {
      await renderStatusCell(lng, enabled)
      expect(screen.getByText(expected)).toBeInTheDocument()
    }
  )
})
