export enum PricingRules {
  FixedPrice,
  StartEndPrice,
  // LinearIncrease
}

export interface FixedPrice {
  type: PricingRules.FixedPrice
  startPrice: number
}

export interface StartEndPrice {
  type: PricingRules.StartEndPrice
  startPrice: number,
  endPrice: number
}
