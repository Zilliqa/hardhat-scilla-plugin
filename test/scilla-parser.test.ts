import chai, { expect } from "chai";
import chaiSubset from "chai-subset";

import {
  generateTypeConstructors,
  ParsedContract,
  parseScilla,
  parseScillaLibrary,
} from "../src/parser/ScillaParser";
chai.use(chaiSubset);

describe("", function () {
  describe("Scilla Parser should parse contracts successfully", function () {
    let contract: ParsedContract;
    let adtContract: ParsedContract;
    before(function () {
      contract = parseScilla("contracts/scilla/HelloWorld.scilla");
      adtContract = parseScilla("contracts/scilla/ADTTest.scilla");
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

    it("should parse _codehash address type as ByStr20", async () => {
      const ecdsa = parseScilla("contracts/scilla/Codehash.scilla");
      expect(ecdsa.transitions[0].params[0].type).to.be.eq("ByStr20");
    });

    it("should parse adt param to contract constructor", async () => {
      const listParamContract = parseScilla(
        "contracts/scilla/ListParamToConstructor.scilla"
      );
      expect(listParamContract.constructorParams![0].type).to.be.eq(
        "List ByStr20"
      );
      expect(listParamContract.constructorParams![0].name).to.be.eq(
        "owner_list"
      );
    });
 
    it("should return `ByStr20` type for `initial_collection_contract` contract deployment parameter", async () => {
      const cont = parseScilla(
        "contracts/scilla/EnglishAuction.scilla"
      );
      
      expect(cont.constructorParams![0].type).to.be.eq("ByStr20");
      expect(cont.constructorParams![1].type).to.be.eq("ByStr20");
    });
  });

  describe("Scilla Parser should parse libraries successfully", function () {
    let contract: ParsedContract;
    before(async function () {
      contract = await parseScillaLibrary(
        "contracts/scilla/AdditionLib.scillib"
      );
    });
    it("Should extract library name", function () {
      expect(contract.name).to.be.eq("AdditionLib");
    });
  });
});
