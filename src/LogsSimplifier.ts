import { BigNumber } from "@ethersproject/bignumber";

import { isNumeric } from "./ScillaParser";

export const simplifyLogs = function (logs: any) {
  for (const log of logs) {
    log.params.forEach((param: any) => {
      if (isNumeric(param.type)) {
        param.value = simplifyNumber(param.type, param.value);
      } else if (param.type.startsWith("Option")) {
        param = simplifyOption(param);
      } else if (param.type === "Bool") {
        param = simplifyBool(param);
      }
    });
  }

  return logs;
};

const simplifyNumber = function (type: string, n: string) {
  switch (type) {
    case "Uint32":
    case "Int64":
    case "Uint64":
      return Number(n);
    case "Uint128":
    case "Int128":
    case "Uint256":
    case "Int256":
      return BigNumber.from(n);

    default:
      break;
  }

  return n;
};

const simplifyOption = function (param: any) {
  const constr = param.value.constructor;
  if (constr === "None") {
    param.value = null;
  } else {
    const innerType = param.value.argtypes[0];
    const innerValue = param.value.arguments[0];
    if (isNumeric(innerType)) {
      param.value = simplifyNumber(innerType, innerValue);
    }
  }

  return param;
};

const simplifyBool = function (param: any) {
  const constr = param.value.constructor;
  param.value = constr === "True" ? true : false;
  return param;
};
