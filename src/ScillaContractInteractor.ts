import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ScillaContract } from "./ScillaContractDeployer";
import * as ScillaContractDeployer from "./ScillaContractDeployer";
import * as ScillaContractProxy from "./ScillaContractProxy";
import { ContractInfo } from "./ScillaContractsInfoUpdater";
import * as ScillaContractsInfoUpdater from "./ScillaContractsInfoUpdater";
import { parseScilla } from "./ScillaParser";
import * as ZilliqaUtils from "./ZilliqaUtils";

export async function contractFromAddress(
  hre: HardhatRuntimeEnvironment,
  address: string
): Promise<ScillaContract | undefined> {
  // Fetch the code from the blockchain
  if (ScillaContractDeployer.setup === null) {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      "Please call the initZilliqa function."
    );
  }
  const setup = ScillaContractDeployer.setup;
  const zilliqa = setup.zilliqa;
  const codeResult = await zilliqa.blockchain.getSmartContractCode(address);
  if (
    codeResult !== undefined &&
    codeResult.result !== undefined &&
    codeResult.result.code !== undefined
  ) {
    const codeText = codeResult.result.code;
    // Now parse it. Sadly, need a file for this. Even more sadly, there's no good way to do it
    // generically (tempy causes us to throw module errors :-( )
    const tempFile = ZilliqaUtils.createTemporaryFile("contract", "scilla");
    fs.writeFileSync(tempFile, codeText);
    const parsed = await parseScilla(tempFile);
    const hash = ScillaContractsInfoUpdater.getFileHash(tempFile);
    const contractInfo: ContractInfo = {
      hash,
      path: address,
      parsedContract: parsed,
    };

    ZilliqaUtils.deleteTemporaryFile(tempFile);
    // OK. Now I need to create a contract factory ..
    // We don't actually need the ABI
    const contract = zilliqa.contracts.at(address, undefined);
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
