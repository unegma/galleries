import {FixedPrice, StartEndPrice} from "./PriceRules";
import {AllowListers, NFTHolders, SBTHolders} from "./AccessGroups";

export interface Phase {
  start: string,
  pricing: FixedPrice|StartEndPrice,
  walletCap: number,
  allowedGroups?: NFTHolders[] | SBTHolders[] | AllowListers[]
}
