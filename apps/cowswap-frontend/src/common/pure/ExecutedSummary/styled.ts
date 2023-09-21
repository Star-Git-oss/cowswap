import { TokenAmount, FiatAmount } from '@cowprotocol/ui'

import styled from 'styled-components/macro'

export const SummaryWrapper = styled.div`
  font-size: 1rem;

  > div {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0.6rem;
    }
  }
`

export const StyledTokenAmount = styled(TokenAmount)`
  font-size: 0.9rem;
  white-space: nowrap;
  font-weight: 600;
`

export const StyledFiatAmount = styled(FiatAmount)`
  font-weight: 600;
  font-size: 0.9rem;
  margin: 0;
`

export const SurplusAmount = styled.div`
  white-space: nowrap;
`

export const FiatWrapper = styled.span`
  margin-left: 5px;
`

export const SurplusWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  > span:first-child {
    margin-right: 5px;
  }
`
