import { Atom, useAtomValue } from 'jotai'

import { useCurrencyAmountBalance } from '@cowprotocol/balances-and-allowances'
import { tryParseFractionalAmount } from '@cowprotocol/common-utils'
import { useTokenBySymbolOrAddress } from '@cowprotocol/tokens'

import { ExtendedTradeRawState } from 'modules/trade/types/TradeRawState'
import { useTradeUsdAmounts } from 'modules/usdAmount'

import { useSafeMemoObject } from 'common/hooks/useSafeMemo'

export function useBuildTradeDerivedState(stateAtom: Atom<ExtendedTradeRawState>) {
  const rawState = useAtomValue(stateAtom)

  const recipient = rawState.recipient
  const recipientAddress = rawState.recipientAddress
  const orderKind = rawState.orderKind

  const inputCurrency = useTokenBySymbolOrAddress(rawState.inputCurrencyId)
  const outputCurrency = useTokenBySymbolOrAddress(rawState.outputCurrencyId)
  const inputCurrencyAmount = tryParseFractionalAmount(inputCurrency, rawState.inputCurrencyAmount)
  const outputCurrencyAmount = tryParseFractionalAmount(outputCurrency, rawState.outputCurrencyAmount)

  const inputCurrencyBalance = useCurrencyAmountBalance(inputCurrency) || null
  const outputCurrencyBalance = useCurrencyAmountBalance(outputCurrency) || null

  const {
    inputAmount: { value: inputCurrencyFiatAmount },
    outputAmount: { value: outputCurrencyFiatAmount },
  } = useTradeUsdAmounts(inputCurrencyAmount, outputCurrencyAmount)

  // In limit orders and advanced orders we don't have "real" buy orders
  const slippageAdjustedSellAmount = inputCurrencyAmount

  return useSafeMemoObject({
    orderKind,
    recipient,
    recipientAddress,
    inputCurrency,
    outputCurrency,
    inputCurrencyAmount,
    outputCurrencyAmount,
    slippageAdjustedSellAmount,
    inputCurrencyBalance,
    outputCurrencyBalance,
    inputCurrencyFiatAmount,
    outputCurrencyFiatAmount,
  })
}
