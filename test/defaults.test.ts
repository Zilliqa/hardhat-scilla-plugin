import { BN, Long } from "@zilliqa-js/util";
import chai, { expect } from "chai";

import { scillaChaiEventMatcher } from "../src/chai-matcher/ScillaChaiMatchers";
import { setup } from "../src/deployer/ScillaContractDeployer";

import { useEnvironment } from "./helpers";

chai.use(scillaChaiEventMatcher);

describe("", function () {
  useEnvironment("hardhat-project");
  describe("Contract deployment", function () {
    it("Should be able to override deployment parameters", async function () {
      this.hre.setScillaDefaults({
        gasPrice: "400",
        gasLimit: "100000",
        attempts: 46,
        timeout: 235,
      });
      expect(setup!.attempts).to.equal(46);
      expect(setup!.timeout).to.equal(235);
      expect(setup!.gasPrice.cmp(new BN("400000000"))).to.equal(0);
      expect(setup!.gasLimit.equals(Long.fromNumber(100000))).to.be.true;
    });
    it("Should be possible to set partial overrides", async function () {
      const oldTimeout = setup!.timeout;
      this.hre.setScillaDefaults({ attempts: 52 });
      expect(setup!.attempts).to.equal(52);
      expect(setup!.timeout).to.equal(oldTimeout);
    });
  });
});
