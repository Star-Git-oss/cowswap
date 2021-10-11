import { OrderKind } from '@gnosis.pm/gp-v2-contracts'

import { ParaSwap, SwapSide, NetworkID } from 'paraswap'
import { OptimalRatesWithPartnerFees, APIError, RateOptions } from 'paraswap/build/types'
import { SupportedChainId as ChainId } from 'constants/chains'
import { getTokensFromMarket } from 'utils/misc'
import { getValidParams, PriceInformation, PriceQuoteParams } from 'utils/price'

type ParaSwapPriceQuote = OptimalRatesWithPartnerFees

const API_NAME = 'ParaSwap'
// Provided manually just to make sure it matches what GPv2 backend is using, although the value used  is the current SDK default
const API_URL = 'https://apiv4.paraswap.io/v2'

const paraSwapLibs: Map<ChainId, ParaSwap> = new Map()

function getParaswapChainId(chainId: ChainId): NetworkID | null {
  switch (chainId) {
    // Only Mainnnet and Ropsten supported
    //  See https://developers.paraswap.network/api/list-all-tokens
    case ChainId.MAINNET:
    case ChainId.ROPSTEN:
      return chainId

    default:
      // Unsupported network
      return null
  }
}

export function toPriceInformation(priceRaw: ParaSwapPriceQuote | null): PriceInformation | null {
  if (!priceRaw || !priceRaw.details) {
    return null
  }

  const { destAmount, srcAmount, details, side } = priceRaw
  if (side === SwapSide.SELL) {
    return {
      amount: destAmount,
      token: details.tokenTo,
    }
  } else {
    return {
      amount: srcAmount,
      token: details.tokenFrom,
    }
  }
}

function isGetRateSuccess(
  rateResult: OptimalRatesWithPartnerFees | APIError
): rateResult is OptimalRatesWithPartnerFees {
  return !!(rateResult as OptimalRatesWithPartnerFees).destAmount
}

function getPriceQuoteFromError(error: APIError): ParaSwapPriceQuote | null {
  if (error.message === 'ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT' && error.data && error.data.priceRoute) {
    // If the price impact is too big, it still give you the estimation
    return error.data.priceRoute
  } else {
    return null
  }
}

export async function getPriceQuote(params: PriceQuoteParams): Promise<ParaSwapPriceQuote | null> {
  const { baseToken, quoteToken, fromDecimals, toDecimals, amount, kind, chainId } = getValidParams(params)

  let paraSwap = paraSwapLibs.get(chainId)
  if (!paraSwap) {
    const networkId = getParaswapChainId(chainId)
    if (networkId == null) {
      // Unsupported network
      return null
    }
    paraSwap = new ParaSwap(networkId, API_URL)
    paraSwapLibs.set(chainId, paraSwap)
  }

  console.log(`[pricesApi:${API_NAME}] Get price from Paraswap`, params)

  // Buy/sell token and side (sell/buy)
  const { sellToken, buyToken } = getTokensFromMarket({ baseToken, quoteToken, kind })
  const swapSide = kind === OrderKind.BUY ? SwapSide.BUY : SwapSide.SELL

  // https://developers.paraswap.network/api/get-rate-for-a-token-pair
  const options: RateOptions | undefined = {
    maxImpact: 100,
    excludeDEXS: 'ParaSwapPool4',
  }

  // Get price
  const rateResult = await paraSwap.getRate(sellToken, buyToken, amount, swapSide, options, fromDecimals, toDecimals)

  if (isGetRateSuccess(rateResult)) {
    // Success getting the price
    return rateResult
  } else {
    // Error getting the price
    const priceQuote = getPriceQuoteFromError(rateResult)
    if (priceQuote) {
      return priceQuote
    } else {
      throw rateResult
    }
  }
}
