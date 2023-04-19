import chai, { expect } from "chai";
import chaiSubset from "chai-subset";

import {
  generateTypeConstructors,
  ParsedContract,
  parseScilla,
  parseScillaLibrary,
} from "../src/ScillaParser";
chai.use(chaiSubset);

describe("", function () {
  describe("Scilla Parser should parse contracts successfully", function () {
    let contract: ParsedContract;
    let adtContract: ParsedContract;
    before(function () {
      contract = parseScilla("contracts/HelloWorld.scilla");
      adtContract = parseScilla("contracts/ADTTest.scilla");
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
        { type: "String", name: "msg", typeJSON: "String" },
      ]);
    });

    it("Should have correct fields", function () {
      expect(contract.fields).to.deep.eq([
        { type: "String", name: "welcome_msg" },
      ]);
    });

    it("Should correctly parse user defined ADTs", function () {
      expect(adtContract.ctors).to.deep.eq([
        {
          typename: "SI",
          ctorname: "S",
          argtypes: [{ name: "", typeJSON: "String", type: "String" }],
        },
        {
          typename: "SI",
          ctorname: "I",
          argtypes: [{ name: "", typeJSON: "Uint32", type: "Uint32" }],
        },
        {
          typename: "SIPair",
          ctorname: "A",
          argtypes: [{ name: "", typeJSON: "Uint32", type: "Uint32" }],
        },
        {
          typename: "SIPair",
          ctorname: "B",
          argtypes: [{ name: "", typeJSON: "String", type: "String" }],
        },
        {
          typename: "SIPair",
          ctorname: "C",
          argtypes: [
            {
              typeJSON: { ctor: "SI", argtypes: [] },
              type: "SI",
              name: undefined,
            },
            {
              typeJSON: { ctor: "SI", argtypes: [] },
              type: "SI",
              name: undefined,
            },
          ],
        },
      ]);
    });

    it("Should return a constructor that generates a user defined ADT", function () {
      const constructors = generateTypeConstructors(adtContract.ctors);
      expect(constructors.A(1)).to.deep.eq({
        constructor: "A",
        argtypes: [{ name: "", typeJSON: "Uint32", type: "Uint32" }],
        args: 1,
      });
    });
  });

  describe("Scilla Parser should parse libraries successfully", function () {
    let contract: ParsedContract;
    before(async function () {
      contract = await parseScillaLibrary("contracts/AdditionLib.scillib");
    });
    it("Should extract library name", function () {
      expect(contract.name).to.be.eq("AdditionLib");
    });
  });
});
