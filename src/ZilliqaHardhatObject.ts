import { Zilliqa } from "@zilliqa-js/zilliqa";
import { getEventLog } from "./ZilliqaUtils";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Account, Wallet, Transaction } from "@zilliqa-js/account";
import * as ScillaContractDeployer from "./ScillaContractDeployer";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { HardhatPluginError } from "hardhat/plugins";
import * as zcyrpto from "@zilliqa-js/crypto"

export type AddressMap = ScillaContractDeployer.AddressMap;
export { Account } from "@zilliqa-js/account";

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

    getAccountByAddress(address: string) : Account | undefined {
        return this.getZilliqaSetup().zilliqa.wallet.accounts[address];
    }

    getDefaultAccount(): Account | undefined {
        return this.getZilliqaSetup().zilliqa.wallet.defaultAccount;
    }

    /** Add a private key, potentially making it the default account. Returns an Account object,
     *  so you can figure out what the pubkey and address were.
     */
    addPrivateKey(privKey: string, makeDefault: boolean = false) : Account {
        let zobj = this.getZilliqaSetup();
        let account = new Account(privKey);
        zobj.accounts.push(account);
        zobj.zilliqa.wallet.addByPrivateKey(privKey);
        if (makeDefault) {
            zobj.zilliqa.wallet.setDefault(account.publicKey);
        }
        return account
    }

    /** Add a new private key, returning the account object, and potentially making it the default
     */
    addNewPrivateKey(makeDefault: boolean = false) : Account {
        let newKey = this.createPrivateKey();
        return this.addPrivateKey(newKey, makeDefault);
    }

    createPrivateKey() {
        const privateKey = zcyrpto.schnorr.generatePrivateKey();
        return privateKey;
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

export function loadZilliqaHardhatObjectForTest() : ZilliqaHardhatObject {
    return new ZilliqaHardhatObject()
}


