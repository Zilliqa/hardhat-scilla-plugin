import { BN, Long } from "@zilliqa-js/util";
import { expect } from "chai";

import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { useEnvironment } from "./helpers"

import chai from 'chai';
import { scillaChaiEventMatcher } from '../src/ScillaChaiMatchers';
import { setup } from '../src/ScillaContractDeployer';

chai.use(scillaChaiEventMatcher);

describe("", function () {

  var hre : HardhatRuntimeEnvironment;
  var zobj : ZilliqaHardhatObject.ZilliqaHardhatObject;

  useEnvironment("hardhat-project");
  describe("Contract deployment", function () {
    it("Should be able to override deployment parameters", async function () {
      this.hre.setScillaDefaults( { "gasPrice" : "400", "gasLimit" : "100000", "attempts" : 46, "timeout" : 235 } );
      expect(setup!.attempts).to.equal(46);
      expect(setup!.timeout).to.equal(235);
      expect(setup!.gasPrice.cmp(new BN('400000000'))).to.equal(0);
      expect(setup!.gasLimit.equals(Long.fromNumber(100000))).to.be.true;
    });
    it("Should be possible to set partial overrides", async function () {
      let oldTimeout = setup!.timeout;
      this.hre.setScillaDefaults( { "attempts" : 52 } );
      expect(setup!.attempts).to.equal(52);
      expect(setup!.timeout).to.equal(oldTimeout);
    });
  });
});
