import chai, { expect } from "chai";

import { scillaChaiEventMatcher } from "../src/chai-matcher/ScillaChaiMatchers";

import { useEnvironment } from "./helpers";

chai.use(scillaChaiEventMatcher);

describe("", function () {
  useEnvironment("hardhat-project");
  describe("Contract deployment", function () {
    it("Should be able to deploy and call a contract", async function () {
      const contract = await this.hre.deployScillaContract(
        "HelloWorld",
        this.zobj.getDefaultAccount()!.address
      );
      const tx = await contract.getHello();
      await expect(tx).to.have.eventLogWithParams("getHello()", {
        value: "",
        vname: "msg",
      });
    });
  });

  describe("Contract deployment using deployer", function () {
    it("Should be able to deploy a contract", async function () {
      const contract = await this.hre.contractDeployer.withName(
        "Codehash").deploy();
      
        expect(contract.address).not.null;
    });

    it("Should be able to deploy a contract with initial params", async function () {
      const contract = await this.hre.contractDeployer.withName(
        "HelloWorld").withContractParams("Hello world!").deploy();
      
        expect(contract.address).not.null;
    });
  });
});
