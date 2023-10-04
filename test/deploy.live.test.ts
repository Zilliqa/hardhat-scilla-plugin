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
  describe("Contract deployment", function () {
    it("Should be able to deploy and call a contract", async function () {
      let contract = await this.hre.deployScillaContract("HelloWorld", this.zobj.getDefaultAccount()!.address);
      let tx = await contract.getHello();
      expect(tx).to.have.eventLogWithParams("getHello()", { value: "", vname: "msg" });
    });
  });
});
