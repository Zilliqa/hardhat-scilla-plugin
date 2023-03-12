import { Zilliqa } from "@zilliqa-js/zilliqa";
import { getEventLog } from "./ZilliqaUtils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Account, Wallet, Transaction } from "@zilliqa-js/account";
import * as ScillaContractDeployer from "./ScillaContractDeployer";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { HardhatPluginError } from "hardhat/plugins";

// We carefully don't cache the setup object, in case it changes underneath us.
export class ZilliqaHardhatObject {
    getEventLog(tx: Transaction) : any {
        const receipt = tx.getReceipt()!;
        const event_logs = receipt.event_logs!
        return event_logs
    }

    getZilliqaSetup() : ScillaContractDeployer.Setup {
        return ScillaContractDeployer.setup!
    }

    getZilliqaJSObject() : Zilliqa {
        return this.getZilliqaSetup().zilliqa
    }

    getAccounts() : Account[] {
        return this.getZilliqaSetup().accounts;
    }

    async getBalance(a : Account) : Promise<[BN, Number]> {
        let rpc = await this.getZilliqaJSObject().blockchain.getBalance(a.address);
        if (rpc.error !== undefined) {
            if (rpc.error.code === -5) {
                // Account not created. Simulate it.
                return [ new BN(0,10), -1 ]
            } else {
                throw new HardhatPluginError(`RPC failed - ${JSON.stringify(rpc.error)}`);
            }
        }
        let data = rpc.result;
        return [ new BN(data.balance, 10), data.nonce ]
    }

}

export function loadZilliqaHardhatObject(hre : HardhatRuntimeEnvironment) : ZilliqaHardhatObject {
    return new ZilliqaHardhatObject()
}
