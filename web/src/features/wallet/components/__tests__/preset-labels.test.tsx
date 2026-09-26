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

import type { TopupInfo } from '../../types'
import { RechargeFormCard } from '../recharge-form-card'

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

const topupInfo = {
  enable_online_topup: true,
  enable_stripe_topup: false,
  pay_methods: [],
  min_topup: 5,
  stripe_min_topup: 0,
  amount_options: [100],
  discount: {},
} as TopupInfo

async function renderPresets(lng: string) {
  const i18n = await createAppI18n(lng)
  const noop = () => {}
  render(
    <I18nextProvider i18n={i18n}>
      <RechargeFormCard
        topupInfo={topupInfo}
        presetAmounts={[{ value: 100, discount: 0.8 }]}
        selectedPreset={null}
        onSelectPreset={noop}
        topupAmount={0}
        onTopupAmountChange={noop}
        paymentAmount={0}
        calculating={false}
        onPaymentMethodSelect={noop}
        paymentLoading={null}
        redemptionCode=''
        onRedemptionCodeChange={noop}
        onRedeem={noop}
        redeeming={false}
      />
    </I18nextProvider>
  )
}

describe('top-up preset labels', () => {
  it.each([
    ['en', '20% OFF', 'Pay 80 • Save 20', 'Minimum 5'],
    ['zhCN', '优惠 20%', '支付 80 • 节省 20', '最低 5'],
  ])(
    'in %s, shows the discount, price, saving and minimum in the interface language',
    async (lng, discount, priceLine, minimum) => {
      await renderPresets(lng)
      const preset = screen.getByText(discount).closest('button')
      expect(preset).not.toBeNull()
      const texts = [...(preset?.querySelectorAll('div') ?? [])].map(
        (element) => element.textContent
      )
      expect(texts).toContain(priceLine)
      expect(screen.getByRole('spinbutton')).toHaveAttribute(
        'placeholder',
        minimum
      )
    }
  )
})
