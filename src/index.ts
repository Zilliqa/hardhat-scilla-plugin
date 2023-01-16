import { extendEnvironment } from "hardhat/config";
import { lazyFunction, lazyObject } from "hardhat/plugins";
import { deploy, ScillaContract } from "./ScillaContractDeployer";

import { loadScillaContractsInfo } from "./ScillaContractsInfoUpdater";
import "./task-extensions";
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";

export {ScillaContract, initZilliqa} from "./ScillaContractDeployer";

export {scillaChaiEventMatcher} from "./ScillaChaiMatchers";


extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.scillaContracts = lazyObject(() => loadScillaContractsInfo());
  hre.deployScilla = lazyFunction(() => async (contractName: string, ...args: any[]): Promise<ScillaContract> => {
    return deploy(hre, contractName, ...args);
  });
});
