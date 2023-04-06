import { execSync } from "child_process";
import clc from "cli-color";
import { glob } from "glob";
import { task } from "hardhat/config";

import { updateContractsInfo as updateScillaContractsInfo } from "./ScillaContractsInfoUpdater";

task(
  "scilla-check",
  "Parsing scilla contracts and performing a number of static checks including typechecking."
)
  .addParam("libdir", "Path to Scilla stdlib")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "An optional list of files to check",
    []
  )
  .setAction(async (taskArgs, hre, runSuper) => {
    let files: string[] = [];
    if (taskArgs.contracts.length === 0) {
      files = glob.sync("contracts/**/*.scilla");
    } else {
      files = taskArgs.contracts;
    }
    files.forEach((file) => {
      try {
        console.log(clc.greenBright.bold(`🔍Checking ${file}...`));
        const value = execSync(
          `scilla-checker -gaslimit 10000 -libdir ${taskArgs.libdir} ${file}`
        );
        console.log(value.toString());
      } catch (error) {
        console.error("Failed to run scilla-checker");
      }
    });
  });

task("compile").setAction(async (taskArgs, hre, runSuper) => {
  console.log(clc.blue.bold("Scilla Contracts: "));
  await updateScillaContractsInfo();
  return runSuper();
});
