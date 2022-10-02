import type { BigNumber } from "ethers"

export interface ERC20Info {
  ready: boolean,
  name: string,
  symbol: string,
  decimals: BigNumber,
  balance: BigNumber,
}
