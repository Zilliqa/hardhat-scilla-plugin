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
      //console.log(`idx ${idx}`);
      this.hre.setAccount(idx);
      const [bal, nonce] = await this.zobj.getBalance(acc);
      //console.log(`Done ${bal}, ${nonce}`)
      expect(bal).to.exist;
      expect(bal.eq(new BN("0", 10))).to.be.true;
      expect(nonce).to.be.eq(-1);
      this.hre.setAccount(0);
    });

    it("Should be able to fetch a balance from the default account", async function () {
      const account = this.zobj.getAccounts()[0];
      //console.log(`acc ${JSON.stringify(account)}`)
      const [bal, nonce] = await this.zobj.getBalance(account);
      // console.log(`Done ${bal}, ${nonce}`)
      expect(bal).to.exist;
      expect(nonce).to.not.be.eq(-1);
    });

    it("Should be able to transfer ZIL between accounts", async function () {
      this.hre.setAccount(0);
      const privKey = this.zobj.createPrivateKey();
      const [acc,idx] = this.zobj.pushPrivateKey(privKey);
      const VAL = new BN(100000002000000);
      const txn = await this.zobj.transferTo(acc, new BN(VAL));
      //console.log(`${JSON.stringify(txn)}`)
      const [bal,nonce] = await this.zobj.getBalance(acc);
      const transferredBalance = bal;
      //console.log(`Done ${bal}, ${nonce}`)
      expect(bal).to.exist;
      expect(bal.eq(new BN(VAL))).to.be.true;
      expect(nonce).to.not.be.eq(-1);
      // Now transfer it back.
      this.hre.setAccount(idx);
      // Lose 10 zil here for gas.
      // console.log(`Transferredbalance ${transferredBalance}`);
      const txn2 = await this.zobj.transferToAddress(this.zobj.getAccounts()[0].address, new BN(1_000));
      // console.log(`${JSON.stringify(txn2)}`)
      expect(txn2['receipt']['success']).to.be.true;
      this.hre.setAccount(0);
    });
  });
});
