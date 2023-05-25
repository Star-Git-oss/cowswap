import { useWalletDetails, useWalletInfo } from 'modules/wallet'
import { ConfirmationPendingContent } from 'common/pure/ConfirmationPendingContent'
import { shortenAddress } from 'legacy/utils'
import { GpModal } from 'common/pure/Modal'
import { useWeb3React } from '@web3-react/core'
import { getStatusIcon } from 'modules/account/containers/AccountDetails'
import { useZeroApprovalState } from 'common/state/useZeroApprovalState'
import { useCallback, useEffect, useState } from 'react'

interface ZeroApprovalModalProps {
  onDismiss?: () => void
}

export function ZeroApprovalModal({ onDismiss = () => {} }: ZeroApprovalModalProps) {
  const { account } = useWalletInfo()
  const walletDetails = useWalletDetails()
  const { connector } = useWeb3React()
  const { isApproving, currency } = useZeroApprovalState()
  const [hasUserClosedModal, setHasUserClosedModal] = useState(false)

  const shouldShow = isApproving && !hasUserClosedModal

  const handleDismiss = useCallback(() => {
    setHasUserClosedModal(true)
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    if (!isApproving && hasUserClosedModal) {
      setHasUserClosedModal(false)
    }
  }, [isApproving, hasUserClosedModal])

  const { walletName, ensName } = walletDetails
  const walletAddress = ensName || (account ? shortenAddress(account) : '')
  const symbol = currency?.symbol?.toUpperCase() ?? 'Unknown Currency' // This should never happen.

  return (
    <GpModal isOpen={shouldShow} onDismiss={handleDismiss}>
      <ConfirmationPendingContent
        onDismiss={handleDismiss}
        statusIcon={getStatusIcon(connector, walletDetails, 56)}
        title={
          <>
            Reset <strong>{symbol}</strong> allowance
          </>
        }
        description={`Reset ${symbol} allowance to 0 before setting new spending cap`}
        operationSubmittedMessage="The token approval is submitted."
        walletNameLabel={walletName}
        walletAddress={walletAddress}
        operationLabel="token approval"
      />
    </GpModal>
  )
}
