// If your plugin extends types from another plugin, you should import the plugin here.

// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import { Account, Transaction } from "@zilliqa-js/account";
import { Init } from "@zilliqa-js/contract";
import "hardhat/types/config";
import "hardhat/types/runtime";

import { ContractDeployer } from "./deployer/Deployer";
import {
  ScillaContract,
  UserDefinedLibrary,
} from "./deployer/ScillaContractDeployer";
import { ScillaContracts } from "./parser/ScillaContractsInfoUpdater";
// Called ZilliqaHardhatObject to distinguish it from @zilliqa-js/zilliqa:Zilliqa
import { ZilliqaHardhatObject } from "./ZilliqaHardhatObject";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    zilliqa: ZilliqaHardhatObject;
    scillaContracts: ScillaContracts;
    contractDeployer: ContractDeployer;

    interactWithScillaContract: (
      contractAddress: string
    ) => Promise<ScillaContract | undefined>;
    deployScillaContract: (
      contractName: string,
      ...args: any[]
    ) => Promise<ScillaContract>;
    deployScillaContractWithLib: (
      contractName: string,
      userDefinedLibraries: UserDefinedLibrary[],
      ...args: any[]
    ) => Promise<ScillaContract>;
    deployScillaLibrary: (contractName: string) => Promise<ScillaContract>;
    deployScillaFile: (
      contractName: string,
      init: Init
    ) => Promise<[Transaction, ScillaContract]>;
    getZilliqaChainId: () => number;
    getNetworkUrl: () => string;
    getPrivateKeys: () => string[];
    setActiveAccount: (indexOrAccount: number | Account) => void;
    setScillaDefaults: (params: any) => void;
  }
}
