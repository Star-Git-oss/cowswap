import { SwapFlowContext } from '../types'
import { tradeFlowAnalytics } from '../../../trade/utils/analytics'
import { signAndPostOrder } from 'legacy/utils/trade'
import { presignOrderStep } from './steps/presignOrderStep'
import { addPendingOrderStep } from 'modules/trade/utils/addPendingOrderStep'
import { logTradeFlow } from 'modules/trade/utils/logger'
import { getSwapErrorMessage } from 'modules/trade/utils/swapErrorHelper'
import { PriceImpact } from 'legacy/hooks/usePriceImpact'
import { Percent } from '@uniswap/sdk-core'

export async function swapFlow(
  input: SwapFlowContext,
  priceImpactParams: PriceImpact,
  confirmPriceImpactWithoutFee: (priceImpact: Percent) => Promise<boolean>
) {
  logTradeFlow('SWAP FLOW', 'STEP 1: confirm price impact')
  if (priceImpactParams?.priceImpact && !(await confirmPriceImpactWithoutFee(priceImpactParams.priceImpact))) {
    return
  }

  logTradeFlow('SWAP FLOW', 'STEP 2: send transaction')
  tradeFlowAnalytics.swap(input.swapFlowAnalyticsContext)
  input.swapConfirmManager.sendTransaction(input.context.trade)

  try {
    logTradeFlow('SWAP FLOW', 'STEP 3: sign and post order')
    const { id: orderId, order } = await signAndPostOrder(input.orderParams).finally(() => {
      input.callbacks.closeModals()
    })

    logTradeFlow('SWAP FLOW', 'STEP 4: presign order (optional)')
    const presignTx = await (input.flags.allowsOffchainSigning
      ? Promise.resolve(null)
      : presignOrderStep(orderId, input.contract))

    logTradeFlow('SWAP FLOW', 'STEP 5: add pending order step')
    addPendingOrderStep(
      {
        id: orderId,
        chainId: input.context.chainId,
        order: {
          ...order,
          presignGnosisSafeTxHash: input.flags.isGnosisSafeWallet && presignTx ? presignTx.hash : undefined,
        },
      },
      input.dispatch
    )

    logTradeFlow('SWAP FLOW', 'STEP 6: add app data to upload queue')
    input.callbacks.uploadAppData({ chainId: input.context.chainId, orderId, appData: input.appDataInfo })

    logTradeFlow('SWAP FLOW', 'STEP 7: show UI of the successfully sent transaction', orderId)
    input.swapConfirmManager.transactionSent(orderId)
    tradeFlowAnalytics.sign(input.swapFlowAnalyticsContext)
  } catch (error: any) {
    logTradeFlow('SWAP FLOW', 'STEP 8: ERROR: ', error)
    const swapErrorMessage = getSwapErrorMessage(error)

    tradeFlowAnalytics.error(error, swapErrorMessage, input.swapFlowAnalyticsContext)

    input.swapConfirmManager.setSwapError(swapErrorMessage)
  }
}
