import clc from "cli-color";
import { task } from "hardhat/config";

import { runScillaChecker } from "./hardhat-tasks/ScillaChecker";
import { updateContractsInfo as updateScillaContractsInfo } from "./parser/ScillaContractsInfoUpdater";

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
  .setAction(async (taskArgs, _hre, _runSuper) => {
    await runScillaChecker(taskArgs.contracts, taskArgs.libdir);
  });

task("compile").setAction(async (taskArgs, hre, runSuper) => {
  console.log(clc.blue.bold("Scilla Contracts: "));
  await updateScillaContractsInfo();
  return runSuper();
});
