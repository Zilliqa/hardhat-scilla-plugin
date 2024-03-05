// This is necessary so that tsc can resolve some of the indirect types for
// sc_call, otherwise it errors out - richard@zilliqa.com 2023-03-09
import { Account, Transaction } from "@zilliqa-js/account";
import { Contract, Init } from "@zilliqa-js/contract";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import * as ScillaContractProxy from "../parser/ScillaContractProxy";
import { ContractInfo } from "../parser/ScillaContractsInfoUpdater";
import { Field, Fields, isNumeric } from "../parser/ScillaParser";

export interface Value {
  vname: string;
  type: string;
  value: string;
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

/// Allows you to change setup parameters. Available params:
/// gasPrice, gasLimit, attempts, timeout.
export function updateSetup(args: any) {
  if (setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call the initZilliqa function."
    );
  }
  const overrides: any = {};
  if (args.gasPrice) {
    overrides.gasPrice = units.toQa(args.gasPrice.toString(), units.Units.Li);
  }
  if (args.gasLimit) {
    overrides.gasLimit = Long.fromNumber(args.gasLimit);
  }
  if (args.timeout) {
    overrides.timeout = args.timeout;
  }
  if (args.attempts) {
    overrides.attempts = args.attempts;
  }
  const newSetup: Setup = { ...setup, ...overrides };
  setup = newSetup;
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

export interface UserDefinedLibrary {
  name: string;
  address: string;
}

export type OptionalUserDefinedLibraryList = UserDefinedLibrary[] | null;

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  compressContract: boolean,
  userDefinedLibraries: OptionalUserDefinedLibraryList,
  ...args: any[]
): Promise<ScillaContract> {
  const contractInfo: ContractInfo = hre.scillaContracts[contractName];
  if (contractInfo === undefined) {
    throw new Error(`Scilla contract ${contractName} doesn't exist.`);
  }

  let txParamsForContractDeployment = {};
  if (
    contractInfo.parsedContract.constructorParams &&
    args.length === contractInfo.parsedContract.constructorParams.length + 1
  ) {
    // The last param is Tx info such as amount, nonce, gasPrice
    txParamsForContractDeployment = args.pop();
  }

  const init: Init = fillInit(
    contractName,
    userDefinedLibraries,
    contractInfo.parsedContract.constructorParams,
    ...args
  );

  const [tx, sc] = await deployFromFile(
    contractInfo.path,
    init,
    txParamsForContractDeployment
  );
  sc.deployed_by = tx;

  ScillaContractProxy.injectProxies(setup!, contractInfo, sc);

  return sc;
}

export const deployLibrary = async (
  hre: HardhatRuntimeEnvironment,
  libraryName: string
): Promise<ScillaContract> => {
  const contractInfo: ContractInfo = hre.scillaContracts[libraryName];
  if (contractInfo === undefined) {
    throw new Error(`Scilla contract ${libraryName} doesn't exist.`);
  }

  const init: Init = fillLibraryInit();

  const [tx, sc] = await deployFromFile(contractInfo.path, init, {}); // FIXME: In  #45
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
      if (isNumeric(param.type)) {
        init.push({
          vname: param.name,
          type: param.type,
          value: userSpecifiedArgs[index].toString(),
        });
      } else {
        // It's an ADT or string
        init.push({
          vname: param.name,
          type: param.type,
          value: userSpecifiedArgs[index] as any,
        });
      }
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
  txParamsForContractDeployment: any
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
    { ...setup, pubKey: deployer.publicKey, ...txParamsForContractDeployment },
    setup.attempts,
    setup.timeout,
    false
  );

  // Let's add this function for further signer/executer changes.
  ScillaContractProxy.injectConnectors(setup, sc);

  sc.connect(deployer);

  return [tx, sc];
}
