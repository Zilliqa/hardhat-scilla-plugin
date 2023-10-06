import { BN } from "@zilliqa-js/util";
import { expect } from "chai";

import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { useEnvironment } from "./helpers"

import chai from 'chai';
import { scillaChaiEventMatcher } from '../src/ScillaChaiMatchers';

chai.use(scillaChaiEventMatcher);

describe("", function () {

  var hre : HardhatRuntimeEnvironment;
  var zobj : ZilliqaHardhatObject.ZilliqaHardhatObject;

  useEnvironment("hardhat-project");
  describe("Contract connect", function () {
    let contractAddress : String;

    before(async function () {
      let param =  this.zobj.getDefaultAccount()!.address;
      let contract = await this.hre.deployScillaContract("HelloWorld", param);
      this.contractAddress = contract.address;
    });

    it("Should be able to connect to a contract", async function () {
      let contract = await this.hre.interactWithScillaContract(this.contractAddress);
    });

    it("Should be able to call a contract", async function () {
      let contract = await this.hre.interactWithScillaContract(this.contractAddress);
      let testMessage = "connect live test!";
      await contract!.setHello(testMessage);
      let result = await contract!.getHello();
      expect(result).to.have.eventLogWithParams("getHello()", { value: testMessage, vname: "msg" });
    });

    it("Should return undefined when we try to connect to a contract which doesn't exist", async function() {
      let contract2 = await this.hre.interactWithScillaContract("0x95D302877382c871681852bc2f87d56f41dC7aF2");
      expect(contract2).to.be.undefined;
    });
  });
});
