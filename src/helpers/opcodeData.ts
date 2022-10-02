import * as rainSDK from "rain-sdk";
import {BigNumber, ethers} from "ethers";
import {StateConfig} from "rain-sdk";
import {concat} from "ethers/lib/utils";
import {op} from "rain-sdk/dist/utils";
import {Opcode} from "./web3Functions";

export const maxCapForWallet = (cap: BigNumber): StateConfig => {
  return {
    sources: [
      concat([
        op(Opcode.CONSTANT, 0), // cap
        op(Opcode.CONTEXT, 0), // address of minter
        op(Opcode.IERC721A_NUMBER_MINTED), // number they've minted
        op(Opcode.SATURATING_SUB, 2) // (the cap) - (what they've minted so far)
      ])
    ],
    constants: [cap]
  }
}

export const alwaysFalse = (): StateConfig => {
  return {
    sources: [
      concat([
        op(Opcode.CONSTANT, 0)
      ]),
    ],
    constants: [0]
  }
}

export const alwaysTrue = (): StateConfig => {
  return {
    sources: [
      concat([
        op(Opcode.CONSTANT, 0)
      ]),
    ],
    constants: [ethers.constants.MaxUint256]
  }
}
