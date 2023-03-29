// This is necessary so that tsc can resolve some of the indirect types for
// sc_call, otherwise it errors out - richard@zilliqa.com 2023-03-09
import { Transaction } from "@zilliqa-js/account";
import { Contract, Init } from "@zilliqa-js/contract";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { Account } from "@zilliqa-js/account";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { stringifyTransactionErrors } from "./ZilliqaUtils";

import { ContractInfo } from "./ScillaContractsInfoUpdater";
import { Field, Fields, isNumeric, TransitionParam, generateTypeConstructors } from "./ScillaParser";

const NIL_ADDRESS = '0x0000000000000000000000000000000000000000';

interface Value{
  vname: string;
  type: string;
  value: string;
}
interface ADTValue {
  constructor: string;
  argtypes: string[];
  arguments: (string | ADTValue)[];
}

interface CallParams {
    amount : BN;
    gasPrice : BN;
    gasLimit : Long;
    pubKey? : string;
    version : number;
};

interface DeployParams {
    gasPrice : BN;
    gasLimit : Long;
    pubKey? : string;
    version : number;
    toAddr : string;
}

export type AddressMap = { [address:string] : Account };

export interface Setup {
  zilliqa: Zilliqa;
  readonly attempts: number;
  readonly timeout: number;
  readonly version: number;
  readonly gasPrice: BN;
  readonly gasLimit: Long;
  accounts: AddressMap;
}

export let setup: Setup | null = null;

// The optional params are listed in popularity order.
export const initZilliqa = (
    zilliqaNetworkUrl: string,
    chainId: number,
    privateKeys: string[],
    // This used to be 10, but this is rather too few for testnet - rrw 2023-03-28
    attempts: number = 20,
    timeoutMs: number = 1000,
    gasPriceQa: number = 2000,
    gasLimit: number = 50000,
): Setup => {
    let zilliqaObject = new Zilliqa(zilliqaNetworkUrl);
    let accounts : AddressMap = {};

    privateKeys.forEach((pk) => {
        let account = new Account(pk);
        zilliqaObject.wallet.addByPrivateKey(pk);
        accounts[account.address] = account;
    });

    setup = {
        zilliqa: zilliqaObject,
        version: bytes.pack(chainId, 1),
        gasPrice: units.toQa(gasPriceQa.toString(), units.Units.Li),
        gasLimit: Long.fromNumber(gasLimit),
        attempts: attempts,
        timeout: timeoutMs,
        accounts : accounts
    };

    return setup;
};

function read(f: string) {
  const t = fs.readFileSync(f, "utf8");
  return t;
}

export type ContractFunction<T = any> = (...args: any[]) => Promise<T>;

export class ScillaContract extends Contract {
  // Transitions and fields
  [key: string]: ContractFunction | any;
}

function handleParam(param:Field, arg:any):Value{
  if (typeof param.typeJSON == 'undefined'){
    throw new HardhatPluginError("hardhat-scilla-plugin", "Parameters were incorrectly parsed. Try clearing your scilla.cache file.")
  } else if (typeof param.typeJSON == 'string'){
    return {
      vname: param.name,
      type: param.type,
      value: arg.toString(),
    }
  } else{
    const values : Value[] = [];
    param.typeJSON.argtypes.forEach((param:Field, index:number) => {
      values.push(handleUnnamedParam(param, arg[index]));
    });
    const argtypes = param.typeJSON.argtypes.map((x)=>x.type);
    /*
      We use JSON.parse(JSON.strigify()) because we need to create a JSON with a constructor
      field. Typescript expects this constructor to have the same type as an object
      constructor which is not possible as it should be a string for our purposes. This trick
      allows forces the typescript compiler to enforce this.
    */
    const value = JSON.parse(JSON.stringify({
      constructor: param.typeJSON.ctor,
      argtypes: argtypes,
      arguments: values
    }));
    return {
      vname: param.name,
      type: param.type,
      value: value
    }
  }
}

function handleUnnamedParam(param:Field, arg:any):Value{
  if (typeof param.typeJSON == 'undefined'){
    throw new HardhatPluginError("hardhat-scilla-plugin", "Parameters were incorrectly parsed. Try clearing your scilla.cache file.")
  } else if (typeof param.typeJSON == 'string'){
    return arg.toString();
  } else{
    const values : Value[] = [];
    param.typeJSON.argtypes.forEach((param:Field, index:number) => {
      values.push(handleUnnamedParam(param, arg[index]))
    });
    const argtypes = param.typeJSON.argtypes.map((x)=>x.type);
    /*
      We use JSON.parse(JSON.strigify()) because we need to create a JSON with a constructor
      field. Typescript expects this constructor to have the same type as an object
      constructor which is not possible as it should be a string for our purposes. This trick
      allows forces the typescript compiler to enforce this.
    */
    return JSON.parse(JSON.stringify({
      vname: param.name,
      type: param.type,
      constructor: param.typeJSON.ctor,
      argtypes: argtypes,
      arguments: values
    }));
  }
}

export async function deploy(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
  ...args: any[]
) {
    return deployWithAccount(hre, contractName, undefined, ...args)
}

/* Find a contract from an address */
export async function contractFromAddress(
    hre : HardhatRuntimeEnvironment,
    contractName: string,
    address : string,
    account : Account | undefined)
{
    const contractInfo: ContractInfo = hre.scillaContracts[contractName];
    if (contractInfo === undefined) {
        throw new Error(`Scilla contract ${contractName} doesn't exist.`);
    }
    if (setup === null) {
        throw new HardhatPluginError(
            "hardhat-scilla-plugin",
            "Please call initZilliqa function."
        );
    }

    let sc : ScillaContract = setup.zilliqa.contracts.at( address ) as ScillaContract;
    sc = await decorateContract(contractInfo, sc, account)

    return sc;
}


export async function deployWithAccount(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
    account : Account | undefined,
    ...args: any[]
) {
    const contractInfo: ContractInfo = hre.scillaContracts[contractName];
    if (contractInfo === undefined) {
        throw new Error(`Scilla contract ${contractName} doesn't exist.`);
    }

    let sc: ScillaContract;
    let tx: Transaction;
    const init: Init = fillInit(
        contractName,
        contractInfo.parsedContract.constructorParams,
        ...args
    );

    [tx,sc] = await deploy_from_file(contractInfo.path, init, account);
    sc['deploy_txn'] = tx
    sc = await decorateContract(contractInfo, sc, account)

    return sc;
}

async function decorateContract(
    contractInfo: ContractInfo,
    sc : ScillaContract,
    account: Account | undefined) : Promise<ScillaContract>
{
    contractInfo.parsedContract.transitions.forEach((transition) => {
        sc[transition.name] = async (...args: any[]) => {
            let amount = 0;
            if (args.length === transition.params.length + 1) {
                // The last param is Tx info such as amount
                const txParams = args.pop();
                amount = txParams.amount ?? 0;
            }
            else if (args.length !== transition.params.length) {
                throw new Error(
                    `Expected to receive ${transition.params.length} parameters for ${transition.name} but got ${args.length}`
                );
            }

            const values: Value[] = [];
            transition.params.forEach((param: TransitionParam, index: number) => {
                values.push(handleParam(param, args[index]));
            });

            return sc_call(sc, transition.name, values, new BN(amount), account);
        };

        contractInfo.parsedContract.fields.forEach((field) => {
            sc[field.name] = async () => {
                const state = await sc.getState();
                if (isNumeric(field.type)) {
                    return Number(state[field.name]);
                }
                return state[field.name];
            };
        });
    });

    // Will shadow any transition named ctors. But done like this to avoid changing the signature of deploy.
    const parsedCtors = contractInfo.parsedContract.ctors;
    sc.ctors = generateTypeConstructors(parsedCtors);

    return sc;
}

const fillInit = (
  contractName: string,
  contractParams: Fields | null,
  ...userSpecifiedArgs: any[]
): Init => {
  const init: Init = [{ vname: "_scilla_version", type: "Uint32", value: "0" }];

  if (contractParams) {
    if (userSpecifiedArgs.length !== contractParams.length) {
      throw new Error(
        `Expected to receive ${contractParams.length} parameters for ${contractName} deployment but got ${userSpecifiedArgs.length}`
      );
    }
    contractParams.forEach((param: Field, index: number) => {
      init.push({
        vname: param.name,
        type: param.type.toString(),
        value: userSpecifiedArgs[index].toString(),
      });
    });
  } else {
    if (userSpecifiedArgs.length > 0) {
      throw new Error(
        `Expected to receive 0 parameters for ${contractName} deployment but got ${userSpecifiedArgs.length}`
      );
    }
  }

  return init;
};

// deploy a smart contract whose code is in a file with given init arguments
async function deploy_from_file(
    path: string,
    init: Init,
    account? : Account
): Promise<[Transaction, ScillaContract]> {
    if (setup === null) {
        throw new HardhatPluginError(
            "hardhat-scilla-plugin",
            "Please call initZilliqa function."
        );
    }

    const code = read(path);
    const contract = setup.zilliqa.contracts.new(code, init);
    var params : DeployParams = { gasPrice: setup.gasPrice,
                              gasLimit : setup.gasLimit,
                              version: setup.version,
                              toAddr: NIL_ADDRESS };
    if (account !== undefined) {
        params.pubKey = account.publicKey
    };
    const [tx, sc] = await contract.deploy(
        params,
        setup.attempts,
        setup.timeout,
        false
    );
    if (!sc.isDeployed()) {
        let txnErrors = stringifyTransactionErrors(tx);
        throw new HardhatPluginError(`Scilla contract was not deployed - status ${sc.status} from ${tx.id}, errors: ${txnErrors}`)
    }
    return [tx, sc];
}

// call a smart contract's transition with given args and an amount to send from a given public key
export async function sc_call(
    sc: Contract,
    transition: string,
    args: Value[] = [],
    amt = new BN(0),
    account? : Account,
) {
    if (setup === null) {
        throw new HardhatPluginError(
            "hardhat-scilla-plugin",
            "Please call initZilliqa function."
        );
    }

    var params : CallParams = {
        version: setup.version,
        amount: amt,
        gasPrice: setup.gasPrice,
        gasLimit: setup.gasLimit,
        // pubKey: caller_pub_key
    };

    if (account !== undefined) {
        params.pubKey = account.publicKey
    };
    
    return sc.call(
        transition,
        args,
        params,
        setup.attempts,
        setup.timeout,
        true
    );
}
