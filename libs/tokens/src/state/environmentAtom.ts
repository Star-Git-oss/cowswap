import { atom } from 'jotai'
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import { atomWithPartialUpdate, getCurrentChainIdFromUrl } from '@cowprotocol/common-utils'

interface TokensModuleEnvironment {
  chainId: SupportedChainId
  widgetAppCode?: string
  selectedLists?: string[]
}
export const { atom: environmentAtom, updateAtom: updateEnvironmentAtom } = atomWithPartialUpdate(
  atom<TokensModuleEnvironment>({
    chainId: getCurrentChainIdFromUrl(),
  })
)
