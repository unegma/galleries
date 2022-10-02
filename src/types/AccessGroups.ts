// Access groups
export enum AllowedGroup {
  Allowlisters,
  NFTHolders,
  SBTHolders
}

export interface NFTHolders {
  type: AllowedGroup.NFTHolders
  contractAddress: string,
  minBalance: number
}

export interface SBTHolders {
  type: AllowedGroup.SBTHolders
  contractAddress: string,
  minBalance: number
}

export interface AllowListers {
  type: AllowedGroup.Allowlisters
  contractAddress: string,
}
