import clc from "cli-color";
import { createHash } from "crypto";
import fs from "fs";
import { glob } from "glob";
import path, { dirname } from "path";

import { ContractName, ParsedContract, parseScilla } from "./ScillaParser";

// For some reason, hardhat deletes json files in artifacts, so it couldn't be scilla.json
const CONTRACTS_INFO_CACHE_FILE = "artifacts/scilla.cache";

export interface ContractInfo {
  hash: string;
  path: string;
  parsedContract: ParsedContract;
}

type ContractPath = string;
type ContractMapByName = Record<ContractName, ContractInfo>;
export type ScillaContracts = ContractMapByName;
type ContractMapByPath = Record<ContractPath, ContractInfo>;

export const updateContractsInfo = (fromDir? : string) => {
  let contractsInfo: ContractMapByName = {};
  const rawFiles = glob.sync(fromDir ? path.join(fromDir, "/**/*.scilla") : "**/*.scilla");
  const nodeModules = fromDir ? path.join(fromDir, "node_modules/") : "node_modules/";
  const files = rawFiles.filter( (f: string) => { console.log(`F= ${f}`); return !f.startsWith( nodeModules ) } )
  if (files.length === 0) {
    console.log(
      clc.yellowBright("No scilla contracts were found in contracts directory.")
    );
    return;
  }

  contractsInfo = loadContractsInfo(fromDir);

  let somethingChanged = false;
  files.forEach((file) => {
    if (
      file in contractsInfo &&
      contractsInfo[file].hash === getFileHash(file)
    ) {
      return; // Nothing to do
    }

    // Either the file is new or has been changed
    const contract = parseScillaFile(file);
    console.log(`Parsing ${file}...`);
    if (contract) {
      somethingChanged = true;
      contractsInfo[file] = contract;
    } else {
      console.log(clc.redBright("  Failed!"));
    }
  });

  if (somethingChanged) {
      saveContractsInfo(contractsInfo, fromDir);
  } else {
    console.log("Nothing changed since last compile.");
  }
};

export const loadScillaContractsInfo = (): ContractMapByName => {
  const contractsInfo = loadContractsInfo();
  return convertToMapByName(contractsInfo);
};

const convertToMapByName = (
  contracts: ContractMapByPath
): ContractMapByName => {
  const contractsByName: ContractMapByName = {};
  for (const key in contracts) {
    const elem = contracts[key];
    const contractName: ContractName = elem.parsedContract.name;
    contractsByName[contractName] = elem;
  }

  return contractsByName;
};

const loadContractsInfo = (fromDir? : string): ContractMapByPath => {
  let cachePath = fromDir ? path.join(fromDir, CONTRACTS_INFO_CACHE_FILE) : CONTRACTS_INFO_CACHE_FILE;
  if (!fs.existsSync(cachePath)) {
    return {};
  }

  const contents = fs.readFileSync(cachePath, "utf8");
  return JSON.parse(contents);
};

const saveContractsInfo = (contracts: ContractMapByPath, fromDir?: string) => {
    let cachePath = fromDir ? path.join(fromDir, CONTRACTS_INFO_CACHE_FILE) : CONTRACTS_INFO_CACHE_FILE;
    console.log(`Saving contract info to ${cachePath}`);
  fs.mkdirSync(dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(contracts));
};

const getFileHash = (fileName: string): string => {
  const contents = fs.readFileSync(fileName, "utf8");
  const hashSum = createHash("md5");
  hashSum.update(contents);
  return hashSum.digest("hex");
};

const parseScillaFile = (fileName: string): ContractInfo | null => {
  const contents = fs.readFileSync(fileName, "utf8");
  const hashSum = createHash("md5");
  hashSum.update(contents);

  const parsedContract = parseScilla(fileName);

  return { hash: hashSum.digest("hex"), path: fileName, parsedContract };
};
