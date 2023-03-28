import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import { updateContractsInfo as updateScillaContractsInfo } from "../src/ScillaContractsInfoUpdater";

declare module "mocha" {
  interface Context {
    hre: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(fixtureProjectName: string) {
  beforeEach("Loading hardhat environment", function () {
    process.chdir(path.join(__dirname, "fixture-projects", fixtureProjectName));
    updateScillaContractsInfo();
    this.hre = require("hardhat");
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });
}
