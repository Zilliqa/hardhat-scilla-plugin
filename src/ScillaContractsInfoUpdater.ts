import clc from "cli-color";
import { createHash } from "crypto";
import fs from "fs";
import { glob } from "glob";
import path, { dirname } from "path";

import {
  ContractName,
  ParsedContract,
  parseScilla,
  parseScillaLibrary,
} from "./ScillaParser";

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

export const updateContractsInfo = async () => {
  let contractsInfo: ContractMapByName = {};
  const files = glob.sync("contracts/**/*(*.scilla|*.scillib)");
  if (files.length === 0) {
    console.log(
      clc.yellowBright("No scilla contracts were found in contracts directory.")
    );
    return;
  }

  contractsInfo = loadContractsInfo();

  let somethingChanged = false;
  for (const file of files) {
    if (
      file in contractsInfo &&
      contractsInfo[file].hash === getFileHash(file)
    ) {
      continue;
    }

    // Either the file is new or has been changed
    const contract = await parseScillaFile(file);
    console.log(`Parsing ${file}...`);
    if (contract) {
      somethingChanged = true;
      contractsInfo[file] = contract;
    } else {
      console.log(clc.redBright("  Failed!"));
    }
  }

  if (somethingChanged) {
    console.log("Cache updated.");
    saveContractsInfo(contractsInfo);
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

const loadContractsInfo = (): ContractMapByPath => {
  if (!fs.existsSync(CONTRACTS_INFO_CACHE_FILE)) {
    console.log("Cache file doesn't exist, creating a new one");
    return {};
  }

  const contents = fs.readFileSync(CONTRACTS_INFO_CACHE_FILE, "utf8");
  return JSON.parse(contents);
};

const saveContractsInfo = (contracts: ContractMapByPath) => {
  fs.mkdirSync(dirname(CONTRACTS_INFO_CACHE_FILE), { recursive: true });
  fs.writeFileSync(CONTRACTS_INFO_CACHE_FILE, JSON.stringify(contracts));
};

const getFileHash = (fileName: string): string => {
  const contents = fs.readFileSync(fileName, "utf8");
  const hashSum = createHash("md5");
  hashSum.update(contents);
  return hashSum.digest("hex");
};

const parseScillaFile = async (
  fileName: string
): Promise<ContractInfo | null> => {
  const contents = fs.readFileSync(fileName, "utf8");
  const hashSum = createHash("md5");
  hashSum.update(contents);

  let parsedContract;
  if (path.extname(fileName) === ".scillib") {
    parsedContract = await parseScillaLibrary(fileName);
  } else {
    parsedContract = parseScilla(fileName);
  }

  return { hash: hashSum.digest("hex"), path: fileName, parsedContract };
};
