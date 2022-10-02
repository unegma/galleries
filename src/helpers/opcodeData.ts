import * as rainSDK from "rain-sdk";
import {BigNumber, BytesLike, ethers} from "ethers";
import {StateConfig} from "rain-sdk";
import { concat, Hexable, hexlify, zeroPad } from "ethers/lib/utils";
import {Opcode} from "./web3Functions";

export function op(code: number, erand = 0): Uint8Array {
  return concat([bytify(code), bytify(erand)]);
}

/**
 * Converts a value to raw bytes representation. Assumes `value` is less than or equal to 1 byte, unless a desired `bytesLength` is specified.
 *
 * @param value - value to convert to raw bytes format
 * @param bytesLength - (defaults to 1) number of bytes to left pad if `value` doesn't completely fill the desired amount of memory. Will throw `InvalidArgument` error if value already exceeds bytes length.
 * @returns {Uint8Array} - raw bytes representation
 */
export function bytify(
  value: number | BytesLike | Hexable,
  bytesLength = 1
): BytesLike {
  return zeroPad(hexlify(value), bytesLength);
}

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
