// This is necessary so that tsc can resolve some of the indirect types for
// sc_call, otherwise it errors out - richard@zilliqa.com 2023-03-09
import { Transaction } from "@zilliqa-js/account";
import { Contract, Init, Value } from "@zilliqa-js/contract";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { Account } from "@zilliqa-js/account";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { stringifyTransactionErrors } from "./ZilliqaUtils";

import { ContractInfo } from "./ScillaContractsInfoUpdater";
import { Fields, isNumeric, TransitionParam } from "./ScillaParser";

export interface Setup {
  zilliqa: Zilliqa;
  readonly attempts: number;
  readonly timeout: number;
  readonly version: number;
  readonly gasPrice: BN;
  readonly gasLimit: Long;
  accounts: Account[]
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
    gasLimit: number = 50000,
): Setup => {
    let zilliqa = new Zilliqa(zilliqaNetworkUrl);
    let accounts : Account[] = [ ];

    privateKeys.forEach((pk) => {
        zilliqa.wallet.addByPrivateKey(pk);
        accounts.push(new Account(pk));
    });

    setup = {
        zilliqa: new Zilliqa(zilliqaNetworkUrl),
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

export async function deploy(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
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

  [tx,sc] = await deploy_from_file(contractInfo.path, init);
  sc['deployed_by'] = tx
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
        values.push({
          vname: param.name,
          type: param.type,
          value: args[index].toString(),
        });
      });

      return sc_call(sc, transition.name, values, new BN(amount));
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
    contractParams.forEach((param: TransitionParam, index: number) => {
      init.push({
        vname: param.name,
        type: param.type,
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
  init: Init
): Promise<[Transaction, ScillaContract]> {
  if (setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call initZilliqa function."
    );
  }

  const code = read(path);
  const contract = setup.zilliqa.contracts.new(code, init);
  const [tx, sc] = await contract.deploy(
    { ...setup },
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
  amt = new BN(0)
  // caller_pub_key = setup.pub_keys[0]
) {
  if (setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call initZilliqa function."
    );
  }

  return sc.call(
    transition,
    args,
    {
      version: setup.version,
      amount: amt,
      gasPrice: setup.gasPrice,
      gasLimit: setup.gasLimit,
      // pubKey: caller_pub_key
    },
    setup.attempts,
    setup.timeout,
    true
  );
}
