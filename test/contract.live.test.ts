import { expect } from "chai";
import chai from "chai";
import chaiSubset from "chai-subset";
import { existsSync, rmSync } from "fs";
import { BN, bytes, Long, units } from "@zilliqa-js/util";

import { useEnvironment } from "./helpers";
import { initZilliqa, ScillaContract  } from "../src/ScillaContractDeployer";
import { ZilliqaHardhatObject, loadZilliqaHardhatObjectForTest } from "../src/ZilliqaHardhatObject";
import { updateContractsInfo as updateScillaContractsInfo } from "../src/ScillaContractsInfoUpdater";

describe("" , function () {
    useEnvironment("hardhat-project")

    before(async function () {
        const privateKeys = [ "d7ebc171562928a59aa8423e9b69393fe43a32f34b25dddc04f3f0dfe8881479" ];
        //const privateKeys = [ "603f0ef1610a638bb28d8f61ed7956c701e114fa39e1c263fc4f5504aed2f211" ];
        //const network_url = "http://localhost:8082";
        const network_url = process.env.ZILLIQA_API_URL || "https://dev-api.zilliqa.com";
        const chain_id = 333;

        await initZilliqa(network_url, chain_id, privateKeys);
    });

    describe("Contract tests", function() {
        it("Should be able to deploy a contract", async function() {
            // console.log(`The default account is ${JSON.stringify(this.hre.zilliqa.getDefaultAccount())}`);
            let contract = await this.hre.deployScilla("HelloWorld", "0xacd9339df14af808af1f46a3edb7466590199ee6")
            console.log("Deployed")
        }).timeout(100000);

        it("Should be able to deploy a contract from a secondary account", async function() {
            //let new_key = this.hre.zilliqa.createPrivateKey();
            // One day you should be able to transfer from the main account, but for now let's just use an account with
            // some ZIL in it.
            let newKey = "07b659800b068ad9da0e01da9d5df6fd16018407f400ee03e8d9018756a778a1";
            let newAccount = this.hre.zilliqa.addPrivateKey(newKey);
            // console.log(`NewAccount ${JSON.stringify(newAccount)}`);
            let contract2 = await this.hre.deployScillaWithAccount("HelloWorld", newAccount, newAccount.address);
            console.log("Done!");
        }).timeout(100000);
    });
});
