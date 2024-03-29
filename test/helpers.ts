import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";

import { initZilliqa } from "../src/deployer/ScillaContractDeployer";
import { updateContractsInfo } from "../src/parser/ScillaContractsInfoUpdater";
import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";

declare module "mocha" {
  interface Context {
    hre: HardhatRuntimeEnvironment;
    zobj: ZilliqaHardhatObject.ZilliqaHardhatObject;
  }
}

export function useEnvironment(fixtureProjectName: string) {
  before("Loading hardhat environment", async function () {
    process.chdir(path.join(__dirname, "fixture-projects", fixtureProjectName));
    this.hre = require("hardhat");
    initZilliqa(
      process.env.ZILLIQA_API_URL || this.hre.getNetworkUrl(),
      this.hre.getZilliqaChainId(),
      this.hre.getPrivateKeys(),
      30
    );
    await updateContractsInfo();
    this.zobj = this.hre.zilliqa;
  });

  after("Resetting hardhat", function () {
    resetHardhatContext();
  });
}
