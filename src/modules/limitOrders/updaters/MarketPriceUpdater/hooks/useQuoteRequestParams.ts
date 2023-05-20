import { useLimitOrdersDerivedState } from 'modules/limitOrders/hooks/useLimitOrdersDerivedState'
import { LegacyFeeQuoteParams as FeeQuoteParams } from 'api/gnosisProtocol/legacy/types'
import { OrderKind } from '@cowprotocol/cow-sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useTypedValue } from 'modules/limitOrders/hooks/useTypedValue'
import { getAddress } from 'utils/getAddress'
import useENSAddress from 'legacy/hooks/useENSAddress'
import { NATIVE_CURRENCY_BUY_ADDRESS } from 'legacy/constants'
import { useWalletInfo } from 'modules/wallet'
import usePrevious from 'legacy/hooks/usePrevious'

export type LimitOrdersQuoteParams = Omit<FeeQuoteParams, 'validTo'> & { validTo?: number }

export function useQuoteRequestParams(): LimitOrdersQuoteParams | null {
  const { inputCurrency, outputCurrency, recipient, orderKind } = useLimitOrdersDerivedState()
  const { chainId, account } = useWalletInfo()
  const prevChainId = usePrevious(chainId)
  const { exactTypedValue } = useTypedValue()
  const { address: recipientEnsAddress } = useENSAddress(recipient)

  return useMemo(() => {
    if (!inputCurrency || !outputCurrency || !exactTypedValue || !chainId) {
      return null
    }

    if (prevChainId && prevChainId !== chainId) {
      return null
    }

    const sellToken = getAddress(inputCurrency)
    const buyToken = !outputCurrency.isNative ? getAddress(outputCurrency) : NATIVE_CURRENCY_BUY_ADDRESS
    const fromDecimals = inputCurrency?.decimals
    const toDecimals = outputCurrency?.decimals

    const amount =
      orderKind === OrderKind.SELL
        ? parseUnits(exactTypedValue, fromDecimals).toString()
        : parseUnits(exactTypedValue, toDecimals).toString()

    if (!amount || !sellToken || !buyToken) {
      return null
    }

    return {
      chainId,
      receiver: recipientEnsAddress || recipient || account,
      kind: orderKind,
      sellToken,
      buyToken,
      amount,
      fromDecimals,
      toDecimals,
      isEthFlow: false, // EthFlow is not compatible with limit orders
    }
  }, [
    prevChainId,
    account,
    chainId,
    exactTypedValue,
    inputCurrency,
    orderKind,
    outputCurrency,
    recipient,
    recipientEnsAddress,
  ])
}
