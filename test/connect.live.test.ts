import chai, { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { scillaChaiEventMatcher } from '../src/ScillaChaiMatchers';
import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";

import { useEnvironment } from "./helpers"


chai.use(scillaChaiEventMatcher);

describe("", function () {

  let hre : HardhatRuntimeEnvironment;
  let zobj : ZilliqaHardhatObject.ZilliqaHardhatObject;

  useEnvironment("hardhat-project");
  describe("Contract connect", function () {
    let contractAddress : string;

    before(async function () {
      const param =  this.zobj.getDefaultAccount()!.address;
      const contract = await this.hre.deployScillaContract("HelloWorld", param);
      this.contractAddress = contract.address;
    });

    it("Should be able to connect to a contract", async function () {
      const contract = await this.hre.interactWithScillaContract(this.contractAddress);
      expect(contract).to.not.be.null;
    });

    it("Should be able to call a contract", async function () {
      const contract = await this.hre.interactWithScillaContract(this.contractAddress);
      const testMessage = "connect live test!";
      await contract!.setHello(testMessage);
      const result = await contract!.getHello();
      await expect(result).to.have.eventLogWithParams("getHello()", { value: testMessage, vname: "msg" });
    });

    it("Should return undefined when we try to connect to a contract which doesn't exist", async function() {
      const contract2 = await this.hre.interactWithScillaContract("0x95D302877382c871681852bc2f87d56f41dC7aF2");
      expect(contract2).to.be.undefined;
    });
  });
});
