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
      let contract = await this.hre.deployScillaContract("HelloWorld", this.zobj.getDefaultAccount()!.address);
      this.contractAddress = contract.address;
      console.log(`Deployed test contract at ${this.contractAddress}`);
    });

    it("Should be able to connect to a contract", async function () {
      
    });
  });
});
