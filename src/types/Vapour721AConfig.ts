import type { Contract } from "ethers"
import {ERC20Info} from "./ERC20Info";
import {Phase} from "./Phase";

// Config
export interface Vapour721AConfig {
  name: string,
  symbol: string,
  description: string,
  imageFile: File,
  maxSupply: number,
  currency: string,
  royalty: number,
  recipient: string,
  owner: string,
  admin: string,
  useNativeToken: boolean,
  currencyContract: Contract,
  phases: Phase[],
  soulbound: boolean,
  erc20info: ERC20Info,
  mediaUploadResp: any,
  baseURI: string,
  image?: string
}
