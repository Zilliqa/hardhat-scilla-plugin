import { Account, Transaction } from "@zilliqa-js/account";
import { Init } from "@zilliqa-js/contract";
import { extendEnvironment } from "hardhat/config";
import { lazyFunction, lazyObject } from "hardhat/plugins";

import {
  deploy,
  deployFromFile,
  deployLibrary,
  ScillaContract,
  UserDefinedLibrary,
  updateSetup,
  setAccount,
} from "./ScillaContractDeployer";
import { contractFromAddress } from "./ScillaContractInteractor";
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
  UserDefinedLibrary,
} from "./ScillaContractDeployer";
export { ZilliqaHardhatObject } from "./ZilliqaHardhatObject";
export { BN } from "@zilliqa-js/util";

export { scillaChaiEventMatcher } from "./ScillaChaiMatchers";

extendEnvironment((hre) => {
  // We add a field to the Hardhat Runtime Environment here.
  // We use lazyObject to avoid initializing things until they are actually
  // needed.
  hre.scillaContracts = lazyObject(() => loadScillaContractsInfo());
  hre.setScillaDefaults = lazyFunction(() => (params) => {
    return updateSetup(params);
  });

  hre.interactWithScillaContract = lazyFunction(
    () =>
      async (contractAddress: string): Promise<ScillaContract | undefined> => {
        return contractFromAddress(hre, contractAddress);
      }
  );

  hre.deployScillaContract = lazyFunction(
    () =>
      async (contractName: string, ...args: any[]): Promise<ScillaContract> => {
        return deploy(hre, contractName, [], ...args);
      }
  );

  hre.deployScillaContractWithLib = lazyFunction(
    () =>
      async (
        contractName: string,
        userDefinedLibraries: UserDefinedLibrary[],
        ...args: any[]
      ): Promise<ScillaContract> => {
        return deploy(hre, contractName, userDefinedLibraries, ...args);
      }
  );

  hre.deployScillaLibrary = lazyFunction(
    () =>
      async (libraryName: string): Promise<ScillaContract> => {
        return deployLibrary(hre, libraryName);
      }
  );

  hre.deployScillaFile = lazyFunction(
    () =>
      async (
        contractPath: string,
        init: Init
      ): Promise<[Transaction, ScillaContract]> => {
        return deployFromFile(contractPath, init, {});
      }
  );

  hre.zilliqa = lazyObject(() => loadZilliqaHardhatObject(hre));
  hre.getZilliqaChainId = lazyFunction(
    () => (): number => (hre as any).network.config.chainId! & 0x7fff
  );
  hre.getNetworkUrl = lazyFunction(() => (): string => {
    return (hre as any).network.config.url;
  });
  hre.getPrivateKeys = lazyFunction(() => (): string[] => {
    return (hre as any).network.config.accounts;
  });
  hre.setActiveAccount = lazyFunction(
    () =>
      (indexOrAccount: number | Account): void => {
        setAccount(indexOrAccount);
      }
  );
});
