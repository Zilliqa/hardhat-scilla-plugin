import { Account, Transaction } from "@zilliqa-js/account";
import { CallParams, Contract, Init, State } from "@zilliqa-js/contract";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as ScillaContractProxy from "./ScillaContractProxy";
import { ContractInfo } from "./ScillaContractsInfoUpdater";
import { ScillaContract, Value } from "./ScillaContractDeployer";
import * as ScillaContractDeployer from "./ScillaContractDeployer";
import * as ScillaContractsInfoUpdater from "./ScillaContractsInfoUpdater";
import { createHash } from "crypto";
import {
  ContractName,
  ParsedContract,
  parseScilla,
  parseScillaLibrary,
} from "./ScillaParser";
import {
  Field,
  Fields,
  generateTypeConstructors,
  isNumeric,
  TransitionParam,
} from "./ScillaParser";
import * as ZilliqaUtils from './ZilliqaUtils';

export async function contractFromAddress(hre: HardhatRuntimeEnvironment, address: string) : Promise<ScillaContract | undefined> {
  // Fetch the code from the blockchain
  if (ScillaContractDeployer.setup === null) {
    throw new HardhatPluginError("hardhat-scilla-plugin", "Please call the initZilliqa function.");
  }
  let setup = ScillaContractDeployer.setup
  let zilliqa = setup.zilliqa
  let codeResult = await zilliqa.blockchain.getSmartContractCode(address);
  if (codeResult !== undefined && codeResult.result !== undefined
    && codeResult.result.code !== undefined) {
    let codeText = codeResult.result.code;
    // Now parse it. Sadly, need a file for this. Even more sadly, there's no good way to do it
    // generically (tempy causes us to throw module errors :-( )
    let tempFile = ZilliqaUtils.createTemporaryFile('contract', 'scilla');
    fs.writeFileSync( tempFile, codeText );
    let parsed = await parseScilla(tempFile);
    let hash = ScillaContractsInfoUpdater.getFileHash(tempFile);
    let contractInfo : ContractInfo  = {
      hash: hash,
      path: address,
      parsedContract: parsed
    };

    ZilliqaUtils.deleteTemporaryFile(tempFile);
    // OK. Now I need to create a contract factory ..
    // We don't actually need the ABI
    let contract = zilliqa.contracts.at( address, undefined );
    // Now we can fill the proxies in.
    ScillaContractProxy.injectConnectors(setup, contract);
    // Set the default deployer
    const deployer = setup.zilliqa.wallet.defaultAccount ?? setup.accounts[0];
    contract.connect(deployer);

    // Now build a ContractInfo
    ScillaContractProxy.injectProxies(setup!, contractInfo, contract);
    return contract;
  }

  return undefined;
}
