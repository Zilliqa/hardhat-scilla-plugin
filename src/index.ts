import { extendEnvironment } from "hardhat/config";
import { lazyFunction, lazyObject } from "hardhat/plugins";
import { Init} from "@zilliqa-js/contract";
import { Transaction } from "@zilliqa-js/account";

import {
  deploy,
  deployLibrary,
  ScillaContract,
  UserDefinedLibrary,
  deployFromFile
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
  UserDefinedLibrary
} from "./ScillaContractDeployer";

export { scillaChaiEventMatcher } from "./ScillaChaiMatchers";

extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.scillaContracts = lazyObject(() => loadScillaContractsInfo());

  hre.deployScillaContract = lazyFunction(
    () => async (
      contractName: string,
      ...args: any[]
    ): Promise<ScillaContract> => {
      return deploy(hre, contractName, [], ...args);
    }
  );

  hre.deployScillaContractWithLib = lazyFunction(
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

  hre.deployScillaFile = lazyFunction(
    () => async (contractPath: string, init: Init): Promise<[Transaction, ScillaContract]> => {
      return deployFromFile(contractPath, init);
    }
  );

  hre.zilliqa = lazyObject(() => loadZilliqaHardhatObject(hre));
});
