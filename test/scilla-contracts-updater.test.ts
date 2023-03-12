import { expect } from "chai";
import chai from "chai";
import chaiSubset from "chai-subset";
import { existsSync, rmSync } from "fs";

import {
  ContractInfo,
  loadScillaContractsInfo,
  updateContractsInfo,
} from "../src/ScillaContractsInfoUpdater";
chai.use(chaiSubset);

describe("", function () {
  before(function () {
    rmSync("artifacts/scilla.cache", { force: true });
  });

  after(function () {
    rmSync("artifacts/scilla.cache", { force: true });
  });

  describe("Scilla Contract Updater", function () {
    let helloContract: ContractInfo;
    it("Should create scilla.cache if updateContractInfo is called", function () {
      updateContractsInfo();
      expect(existsSync("artifacts/scilla.cache")).to.be.true;
    });

    it("should have correct contract path", function () {
      const contracts = loadScillaContractsInfo();
      helloContract = contracts.HelloWorld;
      expect(helloContract.path).to.be.eq("contracts/HelloWorld.scilla");
    });

    it("Should have HelloWorld as the contract name", function () {
      expect(helloContract.parsedContract.name).to.be.eq("HelloWorld");
    });

    it("Should have correct constructor parameter", function () {
      expect(helloContract.parsedContract.constructorParams).to.be.deep.eq([
        { type: "ByStr20", name: "owner" },
      ]);
    });

    it("Should have correct transitions", function () {
      expect(helloContract.parsedContract.transitions).to.containSubset([
        { type: "CompTrans", name: "setHello" },
        { type: "CompTrans", name: "getHello" },
      ]);
    });

    it("Should have correct transitions parameters for setHello", function () {
      expect(helloContract.parsedContract.transitions[0].params).to.deep.eq([
        { type: "String", name: "msg" },
      ]);
    });

    it("Should have correct fields", function () {
      expect(helloContract.parsedContract.fields).to.deep.eq([
        { type: "String", name: "welcome_msg" },
      ]);
    });
  });
});
