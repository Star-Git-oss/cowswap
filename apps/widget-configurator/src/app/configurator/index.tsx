import { useContext, useEffect, useState } from 'react'

import { TradeType } from '@cowprotocol/widget-lib'
import { CowSwapWidget } from '@cowprotocol/widget-react'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useAccount, useNetwork } from 'wagmi'

import { TRADE_MODES } from './consts'
import { CurrencyInputControl } from './controls/CurrencyInputControl'
import { CurrentTradeTypeControl } from './controls/CurrentTradeTypeControl'
import { NetworkControl, NetworkOption, NetworkOptions } from './controls/NetworkControl'
import { ThemeControl } from './controls/ThemeControl'
import { TradeModesControl } from './controls/TradeModesControl'
import { useProvider } from './hooks/useProvider'
import { useSyncWidgetNetwork } from './hooks/useSyncWidgetNetwork'
import { useWidgetParamsAndSettings } from './hooks/useWidgetParamsAndSettings'
import { ContentStyled, DrawerStyled, WalletConnectionWrapper, WrapperStyled } from './styled'
import { ConfiguratorState } from './types'

import { ColorModeContext } from '../../theme/ColorModeContext'
import { web3Modal } from '../../wagmiConfig'
import { EmbedDialog } from '../embedDialog'

const DEFAULT_STATE = {
  sellToken: 'COW',
  buyToken: 'USDC',
  sellAmount: 100000,
  buyAmount: 0,
}

export function Configurator({ title }: { title: string }) {
  const { mode } = useContext(ColorModeContext)

  const [isDrawerOpen, setIsDrawerOpen] = useState(true)

  const networkControlState = useState<NetworkOption>(NetworkOptions[0])
  const [{ chainId }, setNetworkControlState] = networkControlState

  const tradeTypeState = useState<TradeType>(TRADE_MODES[0])
  const [currentTradeType] = tradeTypeState

  const tradeModesState = useState<TradeType[]>(TRADE_MODES)
  const [enabledTradeTypes] = tradeModesState

  const sellTokenState = useState<string>(DEFAULT_STATE.sellToken)
  const sellTokenAmountState = useState<number>(DEFAULT_STATE.sellAmount)
  const [sellToken] = sellTokenState
  const [sellTokenAmount] = sellTokenAmountState

  const buyTokenState = useState<string>(DEFAULT_STATE.buyToken)
  const buyTokenAmountState = useState<number>(DEFAULT_STATE.buyAmount)
  const [buyToken] = buyTokenState
  const [buyTokenAmount] = buyTokenAmountState

  const { isDisconnected } = useAccount()
  const network = useNetwork()

  const walletChainId = network.chain?.id

  useSyncWidgetNetwork(chainId, setNetworkControlState)

  const provider = useProvider()

  const state: ConfiguratorState = {
    // Don't change chainId in the widget URL if the user is connected to a wallet
    // Because useSyncWidgetNetwork() will send a request to change the network
    chainId: isDisconnected || !walletChainId ? chainId : walletChainId,
    theme: mode,
    currentTradeType,
    enabledTradeTypes,
    sellToken,
    sellTokenAmount,
    buyToken,
    buyTokenAmount,
  }

  const params = useWidgetParamsAndSettings(provider, state)

  useEffect(() => {
    web3Modal.setThemeMode(mode)
  }, [mode])

  return (
    <Box sx={WrapperStyled}>
      <Drawer sx={DrawerStyled} variant="persistent" anchor="left" open={isDrawerOpen}>
        <Typography variant="h6" sx={{ width: '100%', textAlign: 'center', margin: '0 0 1.6rem', fontWeight: 'bold' }}>
          {title}
        </Typography>

        <Divider variant="middle">Wallet</Divider>

        <div style={WalletConnectionWrapper}>
          <w3m-button />
        </div>

        <Divider variant="middle">General</Divider>

        <ThemeControl />

        <TradeModesControl state={tradeModesState} />

        <CurrentTradeTypeControl state={tradeTypeState} />

        <NetworkControl state={networkControlState} />

        <Divider variant="middle">Token selection</Divider>

        <CurrencyInputControl
          label="Sell token"
          tokenIdState={sellTokenState}
          tokenAmountState={sellTokenAmountState}
        />

        <CurrencyInputControl label="Buy token" tokenIdState={buyTokenState} tokenAmountState={buyTokenAmountState} />

        <Divider variant="middle" />

        <Link href="#hide" onClick={() => setIsDrawerOpen(false)}>
          Hide drawer
        </Link>
      </Drawer>

      <Box sx={ContentStyled}>
        {params && (
          <>
            <EmbedDialog params={params} />
            <br />
            <CowSwapWidget provider={provider} params={params} />
          </>
        )}
      </Box>
    </Box>
  )
}
