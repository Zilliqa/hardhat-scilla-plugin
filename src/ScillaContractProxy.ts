// Routines to construct proxies for Scilla contracts.
import { Account } from "@zilliqa-js/account";
import { CallParams, State } from "@zilliqa-js/contract";
import { BN } from "@zilliqa-js/util";
import { HardhatPluginError } from "hardhat/plugins";

import * as ScillaContractDeployer from './ScillaContractDeployer';
import { ScillaContract, Value, Setup } from './ScillaContractDeployer';
import { ContractInfo } from "./ScillaContractsInfoUpdater";
import {
  Field,
  generateTypeConstructors,
  isNumeric,
  TransitionParam,
} from "./ScillaParser";

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
    param.typeJSON.argtypes.forEach((p: Field, index: number) => {
      values.push(handleUnnamedParam(p, arg[index]));
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
    param.typeJSON.argtypes.forEach((f: Field, index: number) => {
      values.push(handleUnnamedParam(f, arg[index]));
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

export function injectConnectors(setup: Setup, sc: ScillaContract) {
  sc.connect = (signer: Account) => {
    sc.executer = signer;

    // If account is not added already, add it to the list.
    if (setup?.accounts.findIndex((acc) => acc.privateKey === signer.privateKey) === -1) {
      setup?.zilliqa.wallet.addByPrivateKey(signer.privateKey);
      setup?.accounts.push(signer);
    }
    return sc;
  }
}

// Inject proxy functions into a contract. 
export function injectProxies(setup: Setup, contractInfo: ContractInfo, sc: ScillaContract) {
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
}

// call a smart contract's transition with given args and an amount to send from a given public key
export async function sc_call(
  sc: ScillaContract,
  transition: string,
  args: Value[] = [],
  callParams: CallParams
) {

  if (ScillaContractDeployer.setup === null) { 
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
    ScillaContractDeployer.setup.attempts,
    ScillaContractDeployer.setup.timeout,
    true
);
}
