import { execSync } from "child_process";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import path from "path";
import readline from "readline";

import * as ZilliqaUtils from "../ZilliqaUtils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const parse: any = require("s-expression");

export const isNumeric = (type: string | ADTField) => {
  if (typeof type === "string") {
    switch (type) {
      case "Int64":
      case "Int128":
      case "Int256":
      case "Uint32":
      case "Uint64":
      case "Uint128":
      case "Uint256":
        return true;

      default:
        return false;
    }
  } else {
    return false;
  }
};

export interface TransitionParam {
  type: string;
  name: string;
}

export interface Transition {
  type: string;
  name: string;
  params: TransitionParam[];
}

export interface Field {
  typeJSON?: string | ADTField; // Type in JSON format.
  name: string;
  type: string;
}

export interface ADTField {
  ctor: string;
  argtypes: Field[];
}

export type Transitions = Transition[];
export type ContractName = string;
export type Fields = Field[];

export interface ParsedContract {
  name: ContractName;
  constructorParams: Fields | null;
  transitions: Transitions;
  fields: Fields;
  ctors: ScillaConstructor[];
}

export interface ScillaConstructor {
  typename: string;
  ctorname: string;
  argtypes: string[];
}

export const parseScillaLibrary = async (
  filename: string
): Promise<ParsedContract> => {
  if (!fs.existsSync(filename)) {
    throw new Error(`${filename} doesn't exist.`);
  }

  const fileStream = fs.createReadStream(filename);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let libraryName;
  for await (const line of rl) {
    if (line.trim().startsWith("library")) {
      libraryName = line.trim().split(" ")[1];
      break;
    }
  }

  return {
    name: libraryName || "",
    transitions: [],
    fields: [],
    constructorParams: [],
    ctors: [],
  };
};

export const parseScilla = (filename: string): ParsedContract => {
  const resolvedFilename = path.resolve(filename);
  if (!fs.existsSync(resolvedFilename)) {
    throw new Error(`${resolvedFilename} doesn't exist.`);
  }

  let sexp;
  if (ZilliqaUtils.useNativeScilla()) {
    sexp = execSync(`scilla-fmt --sexp --human-readable ${filename}`);
  } else {
    sexp = execSync(
      `docker run --rm -v ${resolvedFilename}:/tmp/input.scilla -i zilliqa/scilla:v0.13.3 /scilla/0/bin/scilla-fmt --sexp --human-readable /tmp/input.scilla`
    );
  }
  const result: any[] = parse(sexp.toString());

  const libr = result.filter((row: string[]) => row[0] === "libs")[0][1];
  const contr = result.filter((row: string[]) => row[0] === "contr")[0][1];

  const ctors = extractTypes(libr);

  const contractName = extractContractName(contr);
  const contractParams = extractContractParams(contr);

  const cfields = contr.filter((row: string[]) => row[0] === "cfields")[0][1];
  const fields = extractContractFields(cfields);

  const ccomps = contr.filter((row: string[]) => row[0] === "ccomps")[0][1];
  const transitions = extractTransitions(ccomps);

  return {
    name: contractName,
    transitions,
    fields,
    constructorParams: contractParams,
    ctors,
  };
};

const extractTypes = (lib: any) => {
  const ctors: ScillaConstructor[] = [];
  if (lib.length > 0) {
    const lentries = lib[0][1][1];
    for (const lentry of lentries) {
      switch (lentry[0]) {
        case "LibVar":
          break;
        case "LibTyp":
          for (const typector of lentry[2]) {
            const typename = lentry[1][1][1];
            const typectorname = typector[0][1][1][1];
            const typectorargtypes = typector[1][1].map(parseField);

            const userADT: ScillaConstructor = {
              typename,
              ctorname: typectorname,
              argtypes: typectorargtypes,
            };
            ctors.push(userADT);
          }
          break;
      }
    }
  }
  return ctors;
};

const extractContractName = (contrElem: any[]): ContractName => {
  return contrElem
    .filter((row: string[]) => row[0] === "cname")[0][1]
    .filter((row: string[]) => row[0] === "SimpleLocal")[0][1];
};

const extractContractParams = (contrElem: any[]): Fields | null => {
  if (contrElem[1][0] !== "cparams") {
    throw new Error(`Index 0 is not cparams: ${contrElem}`);
  }

  if (contrElem[1][1].length === 0) {
    return null;
  }

  return extractContractFields(contrElem[1][1]);
};

const extractContractFields = (cfieldsElem: any[]): Fields => {
  return cfieldsElem.map((row: any[]): Field => {
    const identData = row[0];
    if (identData[0] !== "Ident") {
      throw new Error(`Index 0 is not Ident: ${identData}`);
    }

    const fieldNameData = identData[1];
    if (fieldNameData[0] !== "SimpleLocal") {
      throw new Error(`Index 0 is not SimpleLocal: ${fieldNameData}`);
    }

    const fieldTypeData = row[1];
    // Currently we just parse PrimType, for the rest we don't parse it completely.
    if (fieldTypeData[0] === "PrimType") {
      return {
        type: fieldTypeData[1],
        name: fieldNameData[1],
      };
    } else if (fieldTypeData[0] === "ADT") {
      const adt = parseAdt(fieldTypeData);
      return {
        typeJSON: adt,
        type:
          adt.ctor + adt.argtypes.map((arg: Field) => " " + arg.type).join(" "),
        name: fieldNameData[1],
      };
    } else if (fieldTypeData[0] === "MapType") {
      return {
        type: "Map",
        name: fieldNameData[1],
      };
    } else if (fieldTypeData[0] === "Address") {
      return {
        type: "Address",
        name: fieldNameData[1],
      };
    } else {
      throw new Error(`Data type is unknown: ${fieldTypeData}`);
    }
  });
};

const extractTransitions = (ccompsElem: any[]): Transitions => {
  return ccompsElem.map((row: any[]) => {
    const compTypeData = row[0];
    if (compTypeData[0] !== "comp_type") {
      throw new Error(`Index 0 is not comp_type ${compTypeData}`);
    }
    const compType = compTypeData[1];

    const compNameData = row[1];
    if (compNameData[0] !== "comp_name") {
      throw new Error(`Index 0 is not comp_name ${compNameData}`);
    }

    const compName = compNameData[1][1];
    if (compName[0] !== "SimpleLocal") {
      throw new Error(`Index 0 is not SimpleLocal: ${compName}`);
    }

    const compParamsData = row[2];

    if (compParamsData[0] !== "comp_params") {
      throw new Error(`Index 0 is not comp_params: ${compParamsData}`);
    }

    const compParams = compParamsData[1].map((r: any[][][]) => {
      const param = parseField(r[1]);
      param.name = r[0][1][1];
      return param;
    });
    return {
      type: compType,
      name: compName[1],
      params: compParams,
    };
  });
};

function parseAdt(row: any): ADTField {
  const ctor = row[1][1][1];
  const argtypes = row[2].map(parseField);
  return {
    ctor,
    argtypes,
  };
}

function generateAdtType(field: ADTField): string {
  if (field.argtypes.length === 0) {
    return field.ctor;
  }

  const type = `${field.ctor} ${field.argtypes
    .map((arg: Field) => {
      // Here we're sure that type is ADTField
      const typeJson: ADTField = arg.typeJSON as ADTField;
      if (["Pair", "List"].includes(typeJson.ctor)) return `(${arg.type})`;
      else return arg.type;
    })
    .reduce((prev, current) => `${prev} ${current}`)}`;
  return type;
}

function parseField(row: any): Field {
  const field_type = row[0];

  if (field_type === "PrimType") {
    const type = row[1];
    return {
      name: "",
      typeJSON: type,
      type,
    };
  } else if (field_type === "ADT") {
    const adt = parseAdt(row);
    const name = row[0][1][1];
    return {
      typeJSON: adt,
      type: generateAdtType(adt),
      name,
    };
  } else if (field_type === "Address") {
    const type = "ByStr20";
    return {
      name: "",
      typeJSON: type,
      type,
    };
  } else {
    throw new HardhatPluginError(
      "hardhat-scilla-plugin",
      `Encountered unexpected field type ${row}`
    );
  }
}

export function generateTypeConstructors(parsedCtors: ScillaConstructor[]) {
  const functions: { [Key: string]: any } = {};
  for (const parsedCtor of parsedCtors) {
    // We need to copy parsedCtor as it is placed in the closure of the function we are declaring so we do
    // not want it to be modified by the floor loop.
    const ctorForClosure: ScillaConstructor = Object.create(parsedCtor);
    functions[ctorForClosure.ctorname] = (args: any[]) => {
      // TODO: Add dynamic type checking.
      return {
        constructor: ctorForClosure.ctorname,
        argtypes: ctorForClosure.argtypes,
        args,
      };
    };
  }
  return functions;
}
