import { Account, Transaction, Wallet } from "@zilliqa-js/account";
import * as zcyrpto from "@zilliqa-js/crypto";
import { BN, bytes, Long, units } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import * as ScillaContractDeployer from "./ScillaContractDeployer";
import { getEventLog } from "./ZilliqaUtils";

// We carefully don't cache the setup object, in case it changes underneath us.
export class ZilliqaHardhatObject {
  public getEventLog(tx: Transaction): any {
    const receipt = tx.getReceipt()!;
    const event_logs = receipt.event_logs!;
    return event_logs;
  }

  public getZilliqaSetup(): ScillaContractDeployer.Setup {
    return ScillaContractDeployer.setup!;
  }

  public getZilliqaJSObject(): Zilliqa {
    return this.getZilliqaSetup().zilliqa;
  }

  public getAccounts(): Account[] {
    return this.getZilliqaSetup().accounts;
  }

  public createPrivateKey() {
    const privateKey = zcyrpto.schnorr.generatePrivateKey();
    return privateKey;
  }

  public async getBalance(a: Account): Promise<[BN, Number]> {
    const rpc = await this.getZilliqaJSObject().blockchain.getBalance(a.address);
    if (rpc.error !== undefined) {
      if (rpc.error.code === -5) {
        // Account not created. Simulate it.
        return [new BN(0, 10), -1];
      } else {
        throw new HardhatPluginError(
          `RPC failed - ${JSON.stringify(rpc.error)}`
        );
      }
    }
    const data = rpc.result;
    return [new BN(data.balance, 10), data.nonce];
  }
}

export function loadZilliqaHardhatObject(
  hre: HardhatRuntimeEnvironment
): ZilliqaHardhatObject {
  return new ZilliqaHardhatObject();
}
