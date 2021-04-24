import { ChainId, Currency } from '@uniswap/sdk-core'
import { Pool, Route } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { useActiveWeb3React } from './index'
import { useV3SwapPools } from './useV3SwapPools'

function computeAllRoutes(
  currencyIn: Currency,
  currencyOut: Currency,
  pools: Pool[],
  chainId: ChainId,
  currentPath: Pool[] = [],
  allPaths: Route[] = [],
  startCurrencyIn: Currency = currencyIn,
  maxHops = 2
): Route[] {
  const tokenIn = wrappedCurrency(currencyIn, chainId)
  const tokenOut = wrappedCurrency(currencyOut, chainId)

  if (!tokenIn || !tokenOut) {
    throw new Error('Could not wrap currencies')
  }

  for (const pool of pools) {
    if (currentPath.indexOf(pool) !== -1 || !pool.involvesToken(tokenIn)) continue

    const outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0
    if (outputToken.equals(tokenOut)) {
      allPaths.push(new Route([...currentPath, pool], startCurrencyIn, currencyOut))
    } else if (maxHops > 1) {
      computeAllRoutes(
        outputToken,
        currencyOut,
        pools,
        chainId,
        [...currentPath, pool],
        allPaths,
        startCurrencyIn,
        maxHops - 1
      )
    }
  }

  return allPaths
}

/**
 * Returns all the routes from an input currency to an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
export function useAllV3Routes(currencyIn?: Currency, currencyOut?: Currency): Route[] {
  const { chainId } = useActiveWeb3React()
  const { pools } = useV3SwapPools(currencyIn, currencyOut)

  return useMemo(() => {
    if (!chainId || !pools || !currencyIn || !currencyOut) return []

    return computeAllRoutes(currencyIn, currencyOut, pools, chainId)
  }, [chainId, currencyIn, currencyOut, pools])
}
