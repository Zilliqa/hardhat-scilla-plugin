import { TxParams } from "@zilliqa-js/account";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  OptionalUserDefinedLibraryList,
  ScillaContract,
  UserDefinedLibrary,
} from "./ScillaContractDeployer";

export class ContractDeployer {
  private contractName: string;
  private compress: boolean;
  private userDefinedLibraries: OptionalUserDefinedLibraryList;
  private txParams: TxParams | null;
  private contractParams: any[];

  constructor(private hre: HardhatRuntimeEnvironment) {
    this.contractName = "";
    this.compress = false;
    this.userDefinedLibraries = null;
    this.txParams = null;
    this.contractParams = [];
  }

  reset(): ContractDeployer {
    this.contractName = "";
    this.compress = false;
    this.userDefinedLibraries = null;
    this.txParams = null;
    this.contractParams = [];
    return this;
  }

  withName(contractName: string): ContractDeployer {
    this.contractName = contractName;
    return this;
  }

  withContractParams(params: any[]): ContractDeployer {
    this.contractParams = params;
    return this;
  }

  withTxParams(params: TxParams): ContractDeployer {
    this.txParams = params;
    return this;
  }

  withContractCompression(): ContractDeployer {
    this.compress = true;
    return this;
  }

  withUserDefinedLibraries(libraries: UserDefinedLibrary[]) {
    this.userDefinedLibraries = libraries;
    return this;
  }

  async deploy(): Promise<ScillaContract> {
    if (!!this.contractName.trim()) {
      throw new HardhatPluginError(
        "hardhat-scilla-plugin",
        "You must specify the contract name in order to deploy it."
      );
    }
    if (this.txParams) {
      this.contractParams.push(this.txParams);
    }

    let contract;
    if (this.userDefinedLibraries) {
      contract = await this.hre.deployScillaContractWithLib(
        this.contractName,
        this.userDefinedLibraries,
        ...this.contractParams
      );
    } else {
      contract = await this.hre.deployScillaContract(
        this.contractName,
        ...this.contractParams
      );
    }

    this.reset();
    return contract;
  }
}
