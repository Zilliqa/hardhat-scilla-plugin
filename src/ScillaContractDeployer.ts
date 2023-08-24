// This is necessary so that tsc can resolve some of the indirect types for
// sc_call, otherwise it errors out - richard@zilliqa.com 2023-03-09
import { Account, Transaction } from "@zilliqa-js/account";
import { CallParams, Contract, Init, State } from "@zilliqa-js/contract";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ContractInfo } from "./ScillaContractsInfoUpdater";
import {
  Field,
  Fields,
  generateTypeConstructors,
  isNumeric,
  TransitionParam,
} from "./ScillaParser";

interface Value {
  vname: string;
  type: string;
  value: string;
}
interface ADTValue {
  constructor: string;
  argtypes: string[];
  arguments: Array<string | ADTValue>;
}

export interface Setup {
  zilliqa: Zilliqa;
  readonly attempts: number;
  readonly timeout: number;
  readonly version: number;
  readonly gasPrice: BN;
  readonly gasLimit: Long;
  accounts: Account[];
}

export let setup: Setup | null = null;

// The optional params are listed in popularity order.
export const initZilliqa = (
  zilliqaNetworkUrl: string,
  chainId: number,
  privateKeys: string[],
  attempts: number = 10,
  timeoutMs: number = 1000,
  gasPriceQa: number = 2000,
  gasLimit: number = 50000
): Setup => {
  const zilliqaObject = new Zilliqa(zilliqaNetworkUrl);
  const accounts: Account[] = [];

  privateKeys.forEach((pk) => {
    zilliqaObject.wallet.addByPrivateKey(pk);
    accounts.push(new Account(pk));
  });

  setup = {
    zilliqa: zilliqaObject,
    version: bytes.pack(chainId, 1),
    gasPrice: units.toQa(gasPriceQa.toString(), units.Units.Li),
    gasLimit: Long.fromNumber(gasLimit),
    attempts,
    timeout: timeoutMs,
    accounts,
  };

  return setup;
};

function read(f: string) {
  const t = fs.readFileSync(f, "utf8");
  return t;
}

export function setAccount(account: number | Account) {
  if (setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call initZilliqa function."
    );
  }

  if (account instanceof Account) {
    setup.zilliqa.wallet.defaultAccount = account;
  } else {
    setup.zilliqa.wallet.defaultAccount = setup.accounts[account];
  }
}

export type ContractFunction<T = any> = (...args: any[]) => Promise<T>;

declare module "@zilliqa-js/contract" {
  interface Contract {
    executer?: Account;
    [key: string]: ContractFunction | any;
    connect: (signer: Account) => Contract;
  }
}

export type ScillaContract = Contract;

function handleParam(param: Field, arg: any): Value {
  if (typeof param.typeJSON === "undefined") {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Parameters were incorrectly parsed. Try clearing your scilla.cache file."
    );
  } else if (typeof param.typeJSON === "string") {
    return {
      vname: param.name,
      type: param.type,
      value: arg.toString(),
    };
  } else {
    const values: Value[] = [];
    param.typeJSON.argtypes.forEach((param: Field, index: number) => {
      values.push(handleUnnamedParam(param, arg[index]));
    });
    const argtypes = param.typeJSON.argtypes.map((x) => x.type);
    /*
      We use JSON.parse(JSON.strigify()) because we need to create a JSON with a constructor
      field. Typescript expects this constructor to have the same type as an object
      constructor which is not possible as it should be a string for our purposes. This trick
      allows forces the typescript compiler to enforce this.
    */
    const value = JSON.parse(
      JSON.stringify({
        constructor: param.typeJSON.ctor,
        argtypes,
        arguments: values,
      })
    );
    return {
      vname: param.name,
      type: param.type,
      value,
    };
  }
}

function handleUnnamedParam(param: Field, arg: any): Value {
  if (typeof param.typeJSON === "undefined") {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Parameters were incorrectly parsed. Try clearing your scilla.cache file."
    );
  } else if (typeof param.typeJSON === "string") {
    return arg.toString();
  } else {
    const values: Value[] = [];
    param.typeJSON.argtypes.forEach((param: Field, index: number) => {
      values.push(handleUnnamedParam(param, arg[index]));
    });
    const argtypes = param.typeJSON.argtypes.map((x) => x.type);
    /*
      We use JSON.parse(JSON.strigify()) because we need to create a JSON with a constructor
      field. Typescript expects this constructor to have the same type as an object
      constructor which is not possible as it should be a string for our purposes. This trick
      allows forces the typescript compiler to enforce this.
    */
    return JSON.parse(
      JSON.stringify({
        vname: param.name,
        type: param.type,
        constructor: param.typeJSON.ctor,
        argtypes,
        arguments: values,
      })
    );
  }
}

export interface UserDefinedLibrary {
  name: string;
  address: string;
}

type OptionalUserDefinedLibraryList = UserDefinedLibrary[] | null;

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  userDefinedLibraries: OptionalUserDefinedLibraryList,
  ...args: any[]): Promise<ScillaContract> {
  const contractInfo: ContractInfo = hre.scillaContracts[contractName];
  if (contractInfo === undefined) {
    throw new Error(`Scilla contract ${contractName} doesn't exist.`);
  }

  let sc: ScillaContract;
  let tx: Transaction;
  const init: Init = fillInit(
    contractName,
    userDefinedLibraries,
    contractInfo.parsedContract.constructorParams,
    ...args
  );

  [tx, sc] = await deployFromFile(contractInfo.path, init);
  sc.deployed_by = tx;

  contractInfo.parsedContract.transitions.forEach((transition) => {
    sc[transition.name] = async (...args: any[]) => {
      let callParams: CallParams = {
        version: setup!.version,
        gasPrice: setup!.gasPrice,
        gasLimit: setup!.gasLimit,
        amount: new BN(0),
      };

      if (args.length === transition.params.length + 1) {
        // The last param is Tx info such as amount
        const txParams = args.pop();
        callParams = { ...callParams, ...txParams };
      } else if (args.length !== transition.params.length) {
        throw new Error(
          `Expected to receive ${transition.params.length} parameters for ${transition.name} but got ${args.length}`
        );
      }

      const values: Value[] = [];
      transition.params.forEach((param: TransitionParam, index: number) => {
        values.push(handleParam(param, args[index]));
      });

      return sc_call(sc, transition.name, values, callParams);
    };
  });

  contractInfo.parsedContract.fields.forEach((field) => {
    sc[field.name] = async () => {
      const state = await sc.getState();
      if (isNumeric(field.type)) {
        return Number(state[field.name]);
      }
      return state[field.name];
    };
  });

  if (contractInfo.parsedContract.constructorParams) {
    contractInfo.parsedContract.constructorParams.forEach((field) => {
      sc[field.name] = async () => {
        const states: State = await sc.getInit();
        const state = states.filter(
          (s: { vname: string }) => s.vname === field.name
        )[0];

        if (isNumeric(field.type)) {
          return Number(state.value);
        }
        return state.value;
      };
    });
  }

  // Will shadow any transition named ctors. But done like this to avoid changing the signature of deploy.
  const parsedCtors = contractInfo.parsedContract.ctors;
  sc.ctors = generateTypeConstructors(parsedCtors);

  return sc;
}

export const deployLibrary = async (
  hre: HardhatRuntimeEnvironment,
  libraryName: string,
): Promise<ScillaContract> => {
  const contractInfo: ContractInfo = hre.scillaContracts[libraryName];
  if (contractInfo === undefined) {
    throw new Error(`Scilla contract ${libraryName} doesn't exist.`);
  }

  let sc: ScillaContract;
  let tx: Transaction;
  const init: Init = fillLibraryInit();

  [tx, sc] = await deployFromFile(contractInfo.path, init);
  sc.deployed_by = tx;

  return sc;
};

const fillLibraryInit = (): Init => {
  const init = [
    {
      vname: "_scilla_version",
      type: "Uint32",
      value: "0",
    },
    {
      vname: "_library",
      type: "Bool",
      value: {
        constructor: "True",
        argtypes: [],
        arguments: [],
      },
    },
  ];
  return init;
};

const fillInit = (
  contractName: string,
  userDefinedLibraries: OptionalUserDefinedLibraryList,
  contractParams: Fields | null,
  ...userSpecifiedArgs: any[]
): Init => {
  const init: Init = [{ vname: "_scilla_version", type: "Uint32", value: "0" }];

  if (userDefinedLibraries) {
    // Underlying zilliqa-js doesn't support push such an object to Init
    (init as any).push({
      vname: "_extlibs",
      type: "List(Pair String ByStr20)",
      value: userDefinedLibraries.map((lib) => ({
        constructor: "Pair",
        argtypes: ["String", "ByStr20"],
        arguments: [lib.name, lib.address],
      })),
    });
  }

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
export async function deployFromFile(
  path: string,
  init: Init,
): Promise<[Transaction, ScillaContract]> {
  if (setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call initZilliqa function."
    );
  }

  const deployer = setup.zilliqa.wallet.defaultAccount ?? setup.accounts[0];
  const code = read(path);
  const contract = setup.zilliqa.contracts.new(code, init);
  const [tx, sc] = await contract.deploy(
    { ...setup, pubKey: deployer.publicKey },
    setup.attempts,
    setup.timeout,
    false
  );

  // Let's add this function for further signer/executer changes.
  sc.connect = (signer: Account) => {
    sc.executer = signer;

    // If account is not added already, add it to the list.
    if (setup?.accounts.findIndex((acc) => acc.privateKey === signer.privateKey) === -1) {
      setup?.zilliqa.wallet.addByPrivateKey(signer.privateKey);
      setup?.accounts.push(signer);
    }
    return sc;
  }

  sc.connect(deployer);

  return [tx, sc];
}

// call a smart contract's transition with given args and an amount to send from a given public key
export async function sc_call(
  sc: ScillaContract,
  transition: string,
  args: Value[] = [],
  callParams: CallParams
) {
  if (setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call initZilliqa function."
    );
  }

  if (callParams.pubKey === undefined && sc.executer) {
    callParams.pubKey = sc.executer.publicKey;
  }

  return sc.call(
    transition,
    args,
    callParams,
    setup.attempts,
    setup.timeout,
    true
);
}