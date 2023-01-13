import { expect } from "chai";
import chai from "chai";
import chaiSubset from "chai-subset";

import { ParsedContract, parseScilla } from "../src/ScillaParser";
chai.use(chaiSubset);

describe("", function () {
  describe("Scilla Parser", function () {
    let contract: ParsedContract;
    before(function () {
      contract = parseScilla("contracts/HelloWorld.scilla");
    });

    it("Should have HelloWorld as the contract name", function () {
      expect(contract.name).to.be.eq("HelloWorld");
    });

    it("Should have correct constructor parameter", function () {
      expect(contract.constructorParams).to.be.deep.eq([
        { type: "ByStr20", name: "owner" },
      ]);
    });

    it("Should have correct transitions", function () {
      expect(contract.transitions).to.containSubset([
        { type: "CompTrans", name: "setHello" },
        { type: "CompTrans", name: "getHello" },
      ]);
    });

    it("Should have correct transitions parameters for setHello", function () {
      expect(contract.transitions[0].params).to.deep.eq([
        { type: "String", name: "msg" },
      ]);
    });

    it("Should have correct fields", function () {
      expect(contract.fields).to.deep.eq([
        { type: "String", name: "welcome_msg" },
      ]);
    });
  });
});
