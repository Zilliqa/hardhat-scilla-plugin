import { BN } from "@zilliqa-js/util";
import { expect } from "chai";

import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { useEnvironment } from "./helpers"

describe("", function () {

  var hre : HardhatRuntimeEnvironment;
  var zobj : ZilliqaHardhatObject.ZilliqaHardhatObject;

  useEnvironment("hardhat-project");
  this.timeout(500000);
  describe("Zilliqa network APIs", function () {
    // Try an account that (hopefully) doesn't exist.
    it("Should be able to fetch a balance from a nonexistent account", async function () {
      const privKey = this.zobj.createPrivateKey();
      const [ acc, idx ] = this.zobj.pushPrivateKey(privKey);
      this.hre.setActiveAccount(idx);
      const [bal, nonce] = await this.zobj.getBalance(acc);
      expect(bal).to.exist;
      expect(bal.eq(new BN("0", 10))).to.be.true;
      expect(nonce).to.be.eq(-1);
      this.hre.setActiveAccount(0);
    });

    it("Should be able to fetch a balance from the default account", async function () {
      const account = this.zobj.getAccounts()[0];
      const [bal, nonce] = await this.zobj.getBalance(account);
      expect(bal).to.exist;
      expect(nonce).to.not.be.eq(-1);
    });

    it("Should be able to transfer ZIL between accounts", async function () {
      this.hre.setActiveAccount(0);
      const privKey = this.zobj.createPrivateKey();
      const [acc,idx] = this.zobj.pushPrivateKey(privKey);
      const VAL = new BN(100000002000000);
      const txn = await this.zobj.transferTo(acc, new BN(VAL));
      const [bal,nonce] = await this.zobj.getBalance(acc);
      const transferredBalance = bal;
      expect(bal).to.exist;
      expect(bal.eq(new BN(VAL))).to.be.true;
      expect(nonce).to.not.be.eq(-1);
      // Now transfer it back.
      this.hre.setActiveAccount(idx);
      // Lose 10 zil here for gas.
      // console.log(`Transferredbalance ${transferredBalance}`);
      const txn2 = await this.zobj.transferToAddress(this.zobj.getAccounts()[0].address, new BN(1_000));
      expect(txn2['receipt']['success']).to.be.true;
      this.hre.setActiveAccount(0);
    });
  });
});
