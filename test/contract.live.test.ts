import { expect } from "chai";
import chai from "chai";
import chaiSubset from "chai-subset";
import { existsSync, rmSync } from "fs";
import { BN, bytes, Long, units } from "@zilliqa-js/util";

import { initZilliqa, depcontractFromAddress, deployWithAccount  } from "../src/ScillaContractDeployer";
import { ZilliqaHardhatObject, loadZilliqaHardhatObjectForTest } from "../src/ZilliqaHardhatObject";

describe("" , function () {
    let zobj : ZilliqaHardhatObject;

    before(async function () {
        //const privateKeys = [ "d7ebc171562928a59aa8423e9b69393fe43a32f34b25dddc04f3f0dfe8881479" ];
        const privateKeys = [ "603f0ef1610a638bb28d8f61ed7956c701e114fa39e1c263fc4f5504aed2f211" ];
        //const network_url = "http://localhost:8082";
        const network_url = process.env.ZILLIQA_API_URL || "https://dev-api.zilliqa.com";
        const chain_id = 333;

        await initZilliqa(network_url, chain_id, privateKeys);
        // Users should use loadZilliqaHardhatObject(hre) - this is only here because the
        // plugin unit tests aren't written with a hardhat object in scope.
        zobj = loadZilliqaHardhatObjectForTest()
    });

    describe("Contract tests", function() {
        let contract? : ScillaContract = null;

        it("Should be able to deploy a contract", async function() {
            contract = await hre.deployScilla("HelloWorld", "0xacd9339df14af808af1f46a3edb7466590199ee6")
            console.log("Deployed")
        }).timeOut(50000)
    });
});
