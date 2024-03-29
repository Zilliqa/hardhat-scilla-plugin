import { expect } from "chai";

import { initZilliqa } from "../src/deployer/ScillaContractDeployer";
import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";

describe("", function () {
  let zobj: ZilliqaHardhatObject.ZilliqaHardhatObject;

  before(async function () {
    const privateKeys = [
      "d7ebc171562928a59aa8423e9b69393fe43a32f34b25dddc04f3f0dfe8881479",
    ];
    const network_url = process.env.ZILLIQA_URL || "http://localhost:8082";
    const chain_id = 333;

    await initZilliqa(network_url, chain_id, privateKeys);
    zobj = new ZilliqaHardhatObject.ZilliqaHardhatObject();
  });

  describe("Zilliqa network APIs", function () {
    it("should have an account address", function () {
      expect(zobj.getAccounts()).to.exist;
      expect(zobj.getAccounts().length).to.be.eq(1);
      expect(zobj.getAccounts()[0].address).to.exist;
      const addr = zobj.getAccounts()[0].address;
      expect(addr.length).to.be.eq(42);
    });
  });
});
