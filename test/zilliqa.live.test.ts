import { expect } from "chai";
import chai from "chai";
import chaiSubset from "chai-subset";
import { existsSync, rmSync } from "fs";
import { BN, bytes, Long, units } from "@zilliqa-js/util";

import { initZilliqa } from "../src/ScillaContractDeployer";
import * as ZilliqaHardhatObject from "../src/ZilliqaHardhatObject";

describe("" , function () {
    let zobj : ZilliqaHardhatObject.ZilliqaHardhatObject;

    before(async function () {
        //const privateKeys = [ "d7ebc171562928a59aa8423e9b69393fe43a32f34b25dddc04f3f0dfe8881479" ];
        const privateKeys = [ "603f0ef1610a638bb28d8f61ed7956c701e114fa39e1c263fc4f5504aed2f211" ];
        //const network_url = "http://localhost:8082";
        const network_url = "https://dev-api.zilliqa.com";
        const chain_id = 333;

        await initZilliqa(network_url, chain_id, privateKeys);
        zobj = new ZilliqaHardhatObject.ZilliqaHardhatObject();
    });

    describe("Zilliqa network APIs", function() {
        // I happen to know that this account exists - rrw 2023-03-12
        it("Should be able to fetch a balance", async function () {
            let account = zobj.getAccounts()[0];
            let [bal, nonce] = await zobj.getBalance(account);
            expect(bal).to.exist;
            expect(bal.eq(new BN("0",10))).to.be.true;
            expect(nonce).to.be.eq(-1);
            // console.log(`Done ${bal}, ${nonce}`)
        });
    });
});
