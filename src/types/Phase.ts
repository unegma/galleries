import {FixedPrice, StartEndPrice} from "./PriceRules";
import {AllowListers, NFTHolders, SBTHolders} from "./AccessGroups";
import {BigNumber} from "ethers";

export interface Phase {
  start: string,
  pricing: FixedPrice|StartEndPrice,
  walletCap: number|BigNumber, // todo check this is ok being a BigNumber
  allowedGroups?: NFTHolders[] | SBTHolders[] | AllowListers[]
}
