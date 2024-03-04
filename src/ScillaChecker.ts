import { execSync } from "child_process";
import clc from "cli-color";
import { glob } from "glob";
import path from "path";

import * as ZilliqaUtils from "./ZilliqaUtils";

export async function runScillaChecker(contracts: any, libdir: any) {
  let files: string[] = [];
  if (libdir === undefined && process.env.USE_NATIVE_SCILLA) {
    throw new Error("You must specify a libDir (to stdlib) if running scilla-checker natively")
  }

  if (contracts.length === 0) {
    files = glob.sync("contracts/**/*.scilla");
  } else {
    files = contracts;
    }
  files.forEach((file) => {
    try {
      console.log(clc.greenBright.bold(`🔍Checking ${file}...`));
      let value;
      if (ZilliqaUtils.useNativeScilla()) {
        value = execSync(
          `scilla-checker -gaslimit 10000 -libdir ${libdir} ${file}`
        );
      } else {
        let libArg;
        let programArg;
        const resolvedFilename = path.resolve(file)
        if (libdir === undefined) {
          programArg = "-libdir /scilla/0/src/stdlib"
          libArg = ""
        } else {
          const absPath = path.resolve(libdir)
          libArg = `-v ${absPath}:/stdlib`
          programArg = "-libdir /stdlib"
        }
          value = execSync(`docker run --rm -v ${resolvedFilename}:/tmp/input.scilla ${libArg} zilliqa/scilla:v0.13.3 /scilla/0/bin/scilla-checker -gaslimit 10000 ${programArg} /tmp/input.scilla`)
      }
      console.log(value.toString());
    } catch (error) {
      console.error("Failed to run scilla-checker");
    }
  });
}
