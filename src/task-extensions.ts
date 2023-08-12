import { execSync } from "child_process";
import clc from "cli-color";
import { glob } from "glob";
import { task } from "hardhat/config";

import { updateContractsInfo as updateScillaContractsInfo } from "./ScillaContractsInfoUpdater";
import { runScillaChecker } from "./ScillaChecker";

task(
  "scilla-check",
  "Parsing scilla contracts and performing a number of static checks including typechecking."
)
  .addOptionalParam("libdir", "Path to Scilla stdlib", undefined)
  .addOptionalVariadicPositionalParam(
    "contracts",
    "An optional list of files to check",
    []
  )
  .setAction(async (taskArgs, hre, runSuper) => {
    await runScillaChecker(taskArgs.contracts, taskArgs.libdir)
  });

task("compile").setAction(async (taskArgs, hre, runSuper) => {
  console.log(clc.blue.bold("Scilla Contracts: "));
  await updateScillaContractsInfo();
  return runSuper();
});
