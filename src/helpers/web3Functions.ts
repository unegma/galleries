import {type BigNumberish, type BytesLike, Contract, ethers} from "ethers"; // todo is it necessary to use 'type'?
import axios from 'axios';
import VapourFactoryArtifact from "./abis/Vapour721AFactory.json";
import VapourArtifact from "./abis/Vapour721A.json";
import {Vapour721AConfig} from "../types/Vapour721AConfig";
import {
  AllStandardOps,
  Condition,
  ConditionGroup,
  Currency,
  Price,
  Quantity,
  Rule,
  RuleBuilder,
  StateConfig,
  VM
} from "rain-sdk";
import {concat, hexlify, parseUnits} from "ethers/lib/utils";
import {op} from "rain-sdk/dist/utils";
import {AllowedGroup, NFTHolders, SBTHolders, AllowListers} from "../types/AccessGroups";
import {Phase} from "../types/Phase";
import {alwaysFalse, alwaysTrue, maxCapForWallet} from "./opcodeData";
import {FixedPrice, PricingRules, StartEndPrice} from "../types/PriceRules";
import {ERC20Info} from "../types/ERC20Info";

const VAPOUR_FACTORY_ADDRESS = "0xE60Feb0C119692A03a6f92E9d47F97e054B92600";
const WARNING_MESSAGE="Are you connected with your Web3 Wallet? (Click the button at the top right)!\n\nYou also need to be connected to Polygon Mumbai Testnet (how to: https://www.youtube.com/watch?v=I4C5RkiNAYQ)!\n\nYou will also need testnet Matic tokens (https://faucet.polygon.technology/)";


/**
 * Generate metadata for every item in the collection
 * @param config
 */
export const generateMetadata = (config: Vapour721AConfig): any => {
  let metadata = []
  for (let i = 0; i < config.maxSupply; i++) {
    metadata[i] = {
      name: config.name,
      description: config.description,
      image: `ipfs://${config.mediaUploadResp.IpfsHash}`
    }
  }
  return metadata
}

/**
 * Pin to IPFS - used from rain-toolkit-gui
 * @param data
 * @param progressStore
 */
export const pin = async (data: Object[] | File, progressStore?: any) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  let formData = new FormData();
  // if we're pinning metadata (objets)
  if (data instanceof Array) {
    data = data as Object[]
    // @ts-ignore
    for (const [i, d] of data.entries()) {
      const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      formData.append(`file`, blob, `dir/${i}.json`);
    }
  }
  // or we're pinning the media file
  else {
    formData.append('file', data, data.name)
  }

  const response = await axios.request({
    url,
    method: 'post',
    headers: {
      "pinata_api_key": `${process.env.REACT_APP_PINATA_API_KEY}`,
      "pinata_secret_api_key": `${process.env.REACT_APP_PINATA_API_SECRET}`,
      "Content-Type": `multipart/form-data;`,
      "Authorization": `Bearer ${process.env.REACT_APP_PINATA_JWT}`
    },
    data: formData,
    onUploadProgress: ((p) => {
      console.log(`Uploading...  ${p.loaded} / ${p.total}`);
      progressStore.set(p.loaded / p.total);
    }),
  })
  return response.data
};

export type StateConfigStruct = {
  sources: BytesLike[];
  constants: BigNumberish[];
};

//todo is this needed, isn't it almost the same as vapour721config?
export type InitializeConfigStruct = {
  name: string;
  symbol: string;
  baseURI: string;
  supplyLimit: BigNumberish;
  recipient: string;
  owner: string;
  admin: string;
  royaltyBPS: BigNumberish;
  currency: string;
  vmStateConfig: StateConfigStruct;
};

enum LocalOpcodes {
  IERC721A_TOTAL_SUPPLY = AllStandardOps.length,
  IERC721A_TOTAL_MINTED = AllStandardOps.length + 1,
  IERC721A_NUMBER_MINTED = AllStandardOps.length + 2,
  IERC721A_NUMBER_BURNED = AllStandardOps.length + 3,
}

export const Opcode = {
  ...AllStandardOps,
  ...LocalOpcodes,
};


const prepareSoulConfig = (config: Vapour721AConfig): StateConfig => {
  return config.soulbound
    ? alwaysFalse()
    : alwaysTrue()
}


// @ts-ignore
const generateGroupCondition = (group: NFTHolders | SBTHolders | AllowListers): Condition => {

  // todo fix
  // @ts-ignore
  if (group.type == AllowedGroup.Allowlisters) {
    // @ts-ignore
    return {
      struct: {
        subject: 'has-any-tier',
        args: {
          tierAddress: group.contractAddress
        }
      },
      operator: 'true'
    }
  }

  else { // @ts-ignore
    if (group.type == AllowedGroup.NFTHolders || group.type == AllowedGroup.SBTHolders) {
        // @ts-ignore
      return {
          struct: {
            subject: 'user-erc721-balance',
            args: {
              tokenAddress: group.contractAddress
            }
          },
          struct2: {
            subject: 'constant',
            args: {
              value: ethers.BigNumber.from(group.minBalance)
            }
          },
          operator: "gte"
        }
      }
  }
}


const generateTimeCondition = (phase: Phase, context: { phases: Phase[], phaseIndex: number }): Condition|null => {
  // generate the start times for each phase
  const startTimes: number[] = context.phases.map(phase => new Date(phase.start).getTime() / 1000)
  if (phase.start == "now" && context.phases.length == 1) {
    return null
  }
  else if (phase.start == "now") {
    return {
      struct: {
        subject: "before-time",
        args: {
          timestamp: new Date(context.phases[context.phaseIndex + 1].start).getTime() / 1000
        },
      },
      operator: "true"
    }
  }
  else if (context.phaseIndex == context.phases.length - 1) {
    return {
      struct: {
        subject: "after-time",
        args: {
          timestamp: new Date(phase.start).getTime() / 1000
        }
      },
      operator: "true"
    }
  }
  else {
    return {
      struct: {
        subject: "between-times",
        args: {
          startTimestamp: new Date(phase.start).getTime() / 1000,
          endTimestamp: new Date(context.phases[context.phaseIndex + 1].start).getTime() / 1000
        }
      },
      operator: "true"
    }
  }
}

const generatePrice = (
  priceRule: FixedPrice | StartEndPrice,
  context: {
    phase: Phase,
    phases: Phase[],
    phaseIndex: number,
    currencyInfo: ERC20Info
  }): Price => {

  // if (priceRule.type == PricingRules.FixedPrice) {
    console.log('F:generatePrice')

    console.log(priceRule,context);

    return {
      struct: {
        subject: 'constant',
        args: {
          // value: parseUnits(priceRule.startPrice.toString(), context.currencyInfo.decimals)
          value: parseUnits(priceRule.startPrice.toString(), 18) // todo hard coding, need to figure out how to get the value from the native currency
        }
      }
    } as Price

  // } else if (priceRule.type == PricingRules.StartEndPrice) {
  //
  //   if (context.phaseIndex == context.phases.length - 1) {
  //     throw "Can't use startPrice > endPrice rule if it's the last phase."
  //   }
  //
  //   const startTimestamp = new Date(context.phase.start).getTime() / 1000
  //   const endTimestamp = new Date(context.phases[context.phaseIndex + 1].start).getTime() / 1000
  //
  //   return {
  //     struct: {
  //       subject: "increasing-by-time",
  //       args: {
  //         startValue: parseUnits(priceRule.startPrice.toString(), context.currencyInfo.decimals),
  //         endValue: parseUnits(priceRule.endPrice.toString(), context.currencyInfo.decimals),
  //         startTimestamp,
  //         endTimestamp
  //       }
  //     }
  //   } as Price
  // }

}

const prepareBuyConfig = (config: Vapour721AConfig): [StateConfig, Currency] => {
  const rules: Rule[] = config.phases.map((phase, phaseIndex, phases) => {
    // generate all the conditions for allowed groups
    // @ts-ignore
    const groupConditions: Condition[] = phase.allowedGroups.map((group) => {
      return generateGroupCondition(group)
    })
    const groupConditionsGroup: ConditionGroup = { conditions: groupConditions, operator: 'and' }

    // generate the condition for the time
    const timeCondition: Condition|null = generateTimeCondition(phase, { phases, phaseIndex })

    // combine them, or if we got back null for time condition just use the group conditions
    // let conditions: ConditionGroup // todo why is this not working?
    let conditions: any

    if (!timeCondition && !groupConditions.length) {
      conditions = { conditions: [{ struct: alwaysTrue(), operator: "true" }], operator: "true" }
    }
    else if (!timeCondition && groupConditions.length == 1) {
      conditions = { conditions: groupConditions, operator: "true" }
    } else if (!timeCondition && groupConditions.length > 1) {
      conditions = { conditions: groupConditions, operator: "and" }
    } else if (timeCondition && !groupConditions.length) {
      conditions = { conditions: [timeCondition], operator: "true" }
    } else if (timeCondition && groupConditions.length == 1) {
      conditions = { conditions: [...groupConditions, timeCondition], operator: "and" }
    } else if (timeCondition && groupConditions.length > 1) {
      conditions = { conditions: [groupConditionsGroup, timeCondition], operator: "and" }
    }

    // quantity and price
    const quantity: Quantity = { struct: maxCapForWallet(ethers.BigNumber.from(phase.walletCap || ethers.constants.MaxUint256)) }
    const price: Price = generatePrice(phase.pricing, { phase, phases, phaseIndex, currencyInfo: config.erc20info })

    return {
      priceConditions: conditions,
      quantityConditions: conditions,
      quantity,
      price
    }
  })

  const currency: Currency = {
    rules,
    default: {
      quantity: { struct: alwaysFalse() },
      price: { struct: alwaysTrue() }
    },
    pick: {
      quantities: "max",
      prices: "min"
    }
  }
  // console.log(JSON.stringify(currency, null, 2))
  return [new RuleBuilder([currency]), currency]
}

export const getNewChildFromReceipt = (receipt: any, parentContract: any) => {
  return ethers.utils.defaultAbiCoder.decode(
    ["address", "address"],
    receipt.events.filter(
      (event: any) =>
        event.event == "NewChild" &&
        event.address.toUpperCase() == parentContract.address.toUpperCase()
    )[0].data
  )[1];
};

/**
 * Formatting functions for data to be deployed
 * @param config
 */
export const prepare = (config: Vapour721AConfig): [InitializeConfigStruct, Currency] => {
  const [buyConfig, rules]: [StateConfig, Currency] = prepareBuyConfig(config)
  const soulConfig: StateConfig = prepareSoulConfig(config)
  const vmStateConfig = VM.combiner(soulConfig, buyConfig, { numberOfSources: 0 })
  const royaltyBPS = (config.royalty / 100) * 10000;
  const currency = config.useNativeToken ? ethers.constants.AddressZero : config.currency

  return [{
    name: config.name,
    symbol: config.symbol,
    baseURI: config.baseURI,
    supplyLimit: config.maxSupply,
    recipient: config.recipient,
    owner: config.owner,
    admin: config.admin,
    royaltyBPS,
    currency: currency,
    vmStateConfig
  }, rules]
}

export const hexlifySources = (currency: Currency): Currency => {
  const traverse = (data: any) => {
    Object.entries(data).forEach(([key, value]: [any, any]) => {
      if (value?.sources) {
        data[key].sources.forEach((source: any, i: any) => {
          data[key].sources[i] = hexlify(data[key].sources[i])
        })
      }
      else if (typeof value === "object") {
        traverse(value)
      }
    })
    return data
  }
  return traverse(currency)
}


/**
 * Functions for deploying the NFT
 * @param signer
 * @param account
 * @param config
 */
export async function deploy721A (signer: any, account: string, config: Vapour721AConfig|any) {
  let deploying = true;
  console.log('here')

  // let config = {
  //   name: collectionName,
  //   symbol: collectionSymbol,
  //   description: description,
  //   imageFile: File,
  //   maxSupply: supply,
  //   currency: currency,
  //   royalty: royaltyPercentage,
  //   recipient: account,
  //   owner: account,
  //   admin: account,
  //   useNativeToken: true,
  //   currencyContract: Contract,
  //   phases: Phase[],
  //   soulbound: true,
  //   erc20info: ERC20Info,
  //   mediaUploadResp: any,
  //   baseURI: string,
  //   image?: string
  // }

  try {
    if (account === "" || typeof account === 'undefined') {
      alert(WARNING_MESSAGE);
      return;
    }

    // todo hard code for now

    config.mediaUploadResp = {
      IpfsHash: "QmbzLvSCLxjZbVfdcGCnSoxfvbpWLqsAoMzb9bmWa1BtnK",
      PinSize: 409592,
      Timestamp: "2022-10-02T18:45:29.917Z",
      isDuplicate: true
    }


    // todo not sure how this is being generated
    config.baseURI = "ipfs://QmRZvLLo1unbbX8C1RUc135LQxfrsqWWiPYsp5UAwsNprL";

    // config.currency = "0x25a4Dd4cd97ED462EB5228de47822e636ec3E31A"; // matic?
    config.currency = "0x0000000000000000000000000000000000000000";
  // todo add currency contract
    // todo add erc20 info



    config.maxSupply = parseInt(config.maxSupply);
    config.soulbound = true;
    config.royalty = parseInt(config.royalty);

    config.phases = [
      {
        "start": "now",
        "pricing": {
          "type": 0,
          "startPrice": 1
        },
        "allowedGroups": [],
        "walletCap": ""
      }
    ]

    // todo hard code for now

    console.log('config');
    console.log(config);
    // return;

    let uploadComplete = false;
    let progress = 0;
    console.log('config', config)
    const metadatas = generateMetadata(config);
    console.log('metadatas')
    console.log(metadatas)

    // todo remove pinning for now
    // const mediaUploadResp = await pin(metadatas, progress);


    const mediaUploadResp = {
      "IpfsHash": "QmRZvLLo1unbbX8C1RUc135LQxfrsqWWiPYsp5UAwsNprL",
      "PinSize": 3614,
      "Timestamp": "2022-10-02T18:46:11.453Z",
      "isDuplicate": true
    }

    // if (mediaUploadResp?.name == "AxiosError") {
    //   throw new Error('IPFS Error');
    // } else {
    //   uploadComplete = true;
    // }

    config.baseURI = `ipfs://${mediaUploadResp.IpfsHash}`;
    // numberOfRules = getNumberOfRules(config); // for showing rain script
    const [args, rules] = prepare(config);

    // may want to split the above into a different function as it is ipfs specific

    const factory = new ethers.Contract(
      VAPOUR_FACTORY_ADDRESS,
      VapourFactoryArtifact.abi,
      signer
    );
    let address;

    // console.log(args);

    const tx = await factory.createChildTyped(args);
    const receipt = await tx.wait();
    address = getNewChildFromReceipt(receipt, factory);

    console.log('completed');
    console.log(receipt);
    console.log(address)

    deploying = false;
    console.log(deploying)


    // todo figure out what the replacer function is
    // window.localStorage.setItem(
    //   address,
    //   JSON.stringify(hexlifySources(rules), replacer)
    // );

    return new ethers.Contract(address, VapourArtifact.abi, signer);

  } catch (err) {
    deploying = false;
    console.log(err)
  }
};




//
// export const initVapourConfig = (signerAddress): Vapour721AConfig => {
//   console.log('initVapourConfig')
//   return {
//     name: "josh",
//     symbol: "test",
//     description: "a description",
//     imageFile: null,
//     maxSupply: 20,
//     currency: "0x25a4Dd4cd97ED462EB5228de47822e636ec3E31A",
//     royalty: 20,
//     recipient: signerAddress,
//     owner: signerAddress,
//     admin: signerAddress,
//     useNativeToken: false,
//     currencyContract: null,
//     phases: [
//       {
//         "start": "now",
//         "pricing": {
//           "type": 0,
//           "startPrice": 1
//         },
//         "allowedGroups": [
//           {
//             "type": 0,
//             "contractAddress": "0x08E46BB0510180bB5e763E73bF3Ae5d49004D6D5"
//           }
//         ],
//         "walletCap": 5
//       },
//       {
//         "start": "2022-08-07T23:38",
//         "pricing": {
//           "type": 0,
//           "startPrice": 10
//         },
//         "allowedGroups": [
//           {
//             "type": 1,
//             "contractAddress": "0x8d88dfb98ba02a6a15784966ed9e6ffa734ad4a6",
//             "minBalance": 1
//           }
//         ],
//         "walletCap": 20
//       }
//     ],
//     soulbound: true,
//     erc20info: {
//       ready: false,
//       name: null,
//       symbol: null,
//       decimals: null,
//       balance: null,
//     },
//     mediaUploadResp: null,
//     baseURI: null
//   }
//   return {
//     name: null,
//     symbol: null,
//     description: null,
//     imageFile: null,
//     maxSupply: null,
//     currency: null,
//     royalty: null,
//     recipient: signerAddress,
//     owner: signerAddress,
//     admin: signerAddress,
//     useNativeToken: false,
//     currencyContract: null,
//     phases: [initVapourPhase()],
//     soulbound: false,
//     erc20info: {
//       ready: false,
//       name: null,
//       symbol: null,
//       decimals: null,
//       balance: null,
//     },
//     mediaUploadResp: null,
//     baseURI: null
//   }
// }

// export const initVapourPhase = (): Phase => {
//   return {
//     start: null,
//     pricing: {
//       type: PricingRules.FixedPrice as PricingRules.FixedPrice,
//       startPrice: null,
//     },
//     allowedGroups: [],
//     walletCap: null
//   }
// }

//
//
// //
// // const WARNING_MESSAGE="Are you connected with your Web3 Wallet? (Click the button at the top right)!\n\nYou also need to be connected to Polygon Mumbai Testnet (how to: https://www.youtube.com/watch?v=I4C5RkiNAYQ)!\n\nYou will also need testnet Matic tokens (https://faucet.polygon.technology/)";
// //
// // /**
// //  * Deploy a Sale and Start it (2txs)
// //  */
// // export async function deployToken(
// //   signer: any,  setButtonLock: any, setLoading: any, reserveName: string, reserveSymbol: string, account: string,
// //   reserveDecimals: string, reserveClaimable: string
// // ) {
// //   try {
// //     if (account === "" || typeof account === 'undefined') {
// //       alert(WARNING_MESSAGE);
// //       return;
// //     }
// //
// //     setButtonLock(true);
// //     setLoading(true);
// //
// //     const emissionsERC20Config = {
// //       allowDelegatedClaims: false, // can mint on behalf of someone else
// //       erc20Config: {
// //         name: reserveName,
// //         symbol: reserveSymbol,
// //         distributor: account, // initialSupply is given to the distributor during the deployment of the emissions contract
// //         initialSupply: ethers.utils.parseUnits("0", reserveDecimals), // todo change this to 0 if possible, or tell the deployer that they will get an amoujnt of tokens
// //       },
// //       vmStateConfig: {
// //         // todo should really change 'initialSupply' to now be 'faucetSupply' or something
// //         constants: [ethers.utils.parseUnits(reserveClaimable, reserveDecimals)], // mint a set amount at a time (infinitely), if set to 10, will mint 10 at a time, no more no less (infinitely)
// //         sources: [
// //           ethers.utils.concat([
// //             rainSDK.utils.op(rainSDK.Sale.Opcodes.VAL, 0),
// //           ]),
// //         ],
// //         stackLength: 1,
// //         argumentsLength: 0,
// //       },
// //     };
// //
// //     console.log(`Deploying and Minting ERC20 Token with the following parameters:`, emissionsERC20Config);
// //     // @ts-ignore
// //     const emissionsErc20 = await rainSDK.EmissionsERC20.deploy(signer, emissionsERC20Config);
// //     // // todo claim function will mint another token (in addition to initial supply)??
// //     const emissionsERC20Address = emissionsErc20.address;
// //     console.log(`Result: deployed emissionsErc20, with address: ${emissionsERC20Address}.`, emissionsErc20);
// //     console.log('Info: to see the tokens in your Wallet, add a new token with the address above. ALSO, REMEMBER TO NOTE DOWN THIS ADDRESS, AS IT WILL BE USED AS RESERVE_TOKEN IN FUTURE TUTORIALS.');
// //
// //     // wait so subgraph has time to index
// //     setTimeout(() => {
// //       console.log(`Redirecting to Token Faucet: ${emissionsERC20Address}`);
// //       window.location.replace(`${window.location.origin}/${emissionsERC20Address}`);
// //     }, 5000)
// //   } catch (err) {
// //     console.log(err);
// //     setLoading(false);
// //     setButtonLock(false);
// //     alert('Failed Deployment.');
// //   }
// // }
// //
// // /**
// //  * Called within the modal for making a buy
// //  * THIS MUST NOT BE SHOWN BEFORE getSaleData() HAS FINISHED OR THE DATA WILL BE FROM .ENV
// //  */
// // export async function initiateClaim(
// //   signer: any, setButtonLock: any, setLoading: any, account: string, setConsoleData: any, setConsoleColor: any, tokenAddress: string, setClaimComplete: any
// // ) {
// //   try {
// //     if (account === "" || typeof account === 'undefined') {
// //       alert(WARNING_MESSAGE);
// //       return;
// //     }
// //
// //     setButtonLock(true);
// //     setLoading(true);
// //
// //     // @ts-ignore
// //     const emissionsErc20 = new rainSDK.EmissionsERC20(tokenAddress, signer);
// //
// //     // TODO FIGURE OUT WHAT IS HAPPENING WITH ADDRESSZERO
// //     const claimTransaction = await emissionsErc20.claim(account, ethers.constants.AddressZero);
// //     const claimReceipt = await claimTransaction.wait();
// //     console.log('Success', claimReceipt);
// //
// //     setConsoleData(`Complete!`);
// //     setConsoleColor(`green`); // todo add to struct
// //     setClaimComplete(true);
// //     //   setButtonLock(false); // don't set to true to disincentive users from continuing to click it
// //     setLoading(false);
// //   } catch(err) {
// //     setLoading(false);
// //     setButtonLock(false);
// //     setConsoleData(`Claim Failed (Check console for more data).`);
// //     setConsoleColor(`red`); // todo add to struct
// //     console.log(`Info: Something went wrong:`, err);
// //   }
// // }
// //
// // /**
// //  * Reserve Token Balance for User
// //  */
// // export async function getReserveBalance(signer: any, account: string, reserveTokenAddress: string, setReserveTokenBalance: any) {
// //   try {
// //     console.log(`Reserve token address`, reserveTokenAddress)
// //     const token = new rainSDK.EmissionsERC20(reserveTokenAddress, signer);
// //
// //     let balance = await token.balanceOf(account);
// //     let humanReadableBalance = `${parseInt(balance.toString())/10**18}`;
// //
// //     console.log(`User Balance`, humanReadableBalance)
// //     setReserveTokenBalance(humanReadableBalance); // todo does it need /10**18?
// //
// //   } catch(err) {
// //     console.log(`Info: Something went wrong:`, err);
// //   }
// // }
