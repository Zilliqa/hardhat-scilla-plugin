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
  describe("Contract deployment", function () {
    it("Should be able to deploy and call a contract", async function () {
      const contract = await this.hre.deployScillaContract("HelloWorld", this.zobj.getDefaultAccount()!.address);
      const tx = await contract.getHello();
      await expect(tx).to.have.eventLogWithParams("getHello()", { value: "", vname: "msg" });
    });
  });
});
