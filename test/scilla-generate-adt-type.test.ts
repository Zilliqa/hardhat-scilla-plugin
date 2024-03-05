import chai, { expect } from "chai";
import chaiSubset from "chai-subset";

import { ParsedContract, parseScilla } from "../src/ScillaParser";
chai.use(chaiSubset);

describe("Scilla Parser should parse contracts successfully", function () {
  let adtContract: ParsedContract;
  before(function () {
    adtContract = parseScilla("contracts/scilla/GenerateAdtType.scilla");
  });

  it("should generate valid type for (List (Pair ByStr20 (List (Pair Uint32 Uint128)))))", async () => {
    expect(adtContract.transitions[0].params[0].type).to.be.eq(
      "List (Pair ByStr20 (List (Pair Uint32 Uint128)))"
    );
  });

  it("should generate valid type for (List Uint128)", async () => {
    expect(adtContract.transitions[1].params[0].type).to.be.eq("List Uint128");
  });

  it("should generate valid type for (Pair Uint32 Uint128)", async () => {
    expect(adtContract.transitions[2].params[0].type).to.be.eq(
      "Pair Uint32 Uint128"
    );
  });

  it("should generate valid type for (List (Pair ByStr20 ByStr20))", async () => {
    expect(adtContract.transitions[3].params[0].type).to.be.eq(
      "List (Pair ByStr20 ByStr20)"
    );
  });
});
