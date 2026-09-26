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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createInstance, type i18n as I18n } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'

import en from '@/i18n/locales/en.json'
import zhCN from '@/i18n/locales/zh.json'
import { api } from '@/lib/api'

import { ModelDetailsContent } from '../components/model-details'
import type { PricingModel } from '../types'

vi.mock('@visactor/react-vchart', () => ({ VChart: () => null }))

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

const tokenModel: PricingModel = {
  id: 1,
  model_name: 'gpt-4o-mini',
  quota_type: 0,
  model_ratio: 0.075,
  completion_ratio: 4,
  enable_groups: ['default'],
}

async function renderDetails(lng: string) {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { groups: [] } } })
  const i18n = await createAppI18n(lng)
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <ModelDetailsContent
          model={tokenModel}
          groupRatio={{ default: 1 }}
          usableGroup={{ default: { desc: '', ratio: 1 } }}
          endpointMap={{}}
          autoGroups={[]}
          priceRate={1}
          usdExchangeRate={1}
          tokenUnit='M'
        />
      </I18nextProvider>
    </QueryClientProvider>
  )
}

describe('model details price unit note', () => {
  it.each([
    ['en', 'Prices shown per 1M tokens'],
    ['zhCN', '价格按每 1M Token 显示'],
  ])(
    'in %s, shows the token price unit as one translated sentence',
    async (lng, expected) => {
      await renderDetails(lng)
      expect(screen.getByText(expected)).toBeInTheDocument()
    }
  )
})
