import { TxParams } from "@zilliqa-js/account";

import {
  OptionalUserDefinedLibraryList,
  UserDefinedLibrary,
} from "./ScillaContractDeployer";

export class DeployBuilder {
  private contractName: string;
  private compress: boolean;
  private userDefinedLibraries: OptionalUserDefinedLibraryList;
  private txParams: TxParams | null;
  private contractParams: any[];

  constructor() {
    this.contractName = "";
    this.compress = false;
    this.userDefinedLibraries = null;
    this.txParams = null;
    this.contractParams = [];
  }

  reset(): DeployBuilder {
    this.contractName = "";
    this.compress = false;
    this.userDefinedLibraries = null;
    this.txParams = null;
    this.contractParams = [];
    return this;
  }

  withName(contractName: string): DeployBuilder {
    this.contractName = contractName;
    return this;
  }

  withContractParams(params: any[]): DeployBuilder {
    this.contractParams = params;
    return this;
  }

  withTxParams(params: TxParams): DeployBuilder {
    this.txParams = params;
    return this;
  }

  withContractCompression(): DeployBuilder {
    this.compress = true;
    return this;
  }

  withUserDefinedLibraries(libraries: UserDefinedLibrary[]) {
    this.userDefinedLibraries = libraries;
    return this;
  }

  build(): Deployment {
    return new Deployment(
      this.contractName,
      this.compress,
      this.userDefinedLibraries,
      this.txParams,
      this.contractParams
    );
  }
}

class Deployment {
  constructor(
    private contractName: string,
    private compress: boolean,
    private userDefinedLibraries: OptionalUserDefinedLibraryList,
    private txParams: TxParams | null,
    private contractParams: any[]
  ) {}
}
