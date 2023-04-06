import { extendEnvironment } from "hardhat/config";
import { lazyFunction, lazyObject } from "hardhat/plugins";

import {
  deploy,
  deployLibrary,
  ScillaContract,
  UserDefinedLibrary,
} from "./ScillaContractDeployer";
import { loadScillaContractsInfo } from "./ScillaContractsInfoUpdater";
import "./task-extensions";
// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import "./type-extensions";
import { loadZilliqaHardhatObject } from "./ZilliqaHardhatObject";

export {
  ScillaContract,
  Setup,
  initZilliqa,
  setAccount,
} from "./ScillaContractDeployer";

export { scillaChaiEventMatcher } from "./ScillaChaiMatchers";

extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.scillaContracts = lazyObject(() => loadScillaContractsInfo());

  hre.deployScilla = lazyFunction(
    () => async (
      contractName: string,
      ...args: any[]
    ): Promise<ScillaContract> => {
      return deploy(hre, contractName, [], ...args);
    }
  );

  hre.deployScillaWithLib = lazyFunction(
    () => async (
      contractName: string,
      userDefinedLibraries: UserDefinedLibrary[],
      ...args: any[]
    ): Promise<ScillaContract> => {
      return deploy(hre, contractName, userDefinedLibraries, ...args);
    }
  );

  hre.deployScillaLibrary = lazyFunction(
    () => async (libraryName: string): Promise<ScillaContract> => {
      return deployLibrary(hre, libraryName);
    }
  );

  hre.zilliqa = lazyObject(() => loadZilliqaHardhatObject(hre));
});
