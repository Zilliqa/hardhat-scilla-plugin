import { Account, Transaction, TxParams } from "@zilliqa-js/account";
import * as zcrypto from "@zilliqa-js/crypto";
import { BN } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import * as ScillaContractDeployer from "./ScillaContractDeployer";

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

  // Retrieve the default acount used to sign transactions.
  public getDefaultAccount(): Account | undefined {
    const wallet = this.getZilliqaSetup().zilliqa.wallet;
    const defaultAccount = wallet.defaultAccount;
    return defaultAccount;
  }

  /** Push a private key onto the accounts array, returning a pair of the
   * account and the index at which it can be found
   */
  public pushPrivateKey(privKey: string) : [ Account, number ] {
    const account = new Account(privKey);
    const val = this.getZilliqaSetup().accounts.push(account)-1;
    this.getZilliqaJSObject().wallet.addByPrivateKey(privKey);
    return [ account, val ];
  }

  public createPrivateKey() {
    const privateKey = zcrypto.schnorr.generatePrivateKey();
    return privateKey;
  }

  public async transferTo(toAccount: Account, value: BN,
                        txParams = { }): Promise<Transaction> {
    return this.transferToAddress(toAccount.address, value, txParams);
  }

  public async transferToAddress(toAddress: string, value: BN,
                        txParams = { }) : Promise<Transaction> {
    const setup = this.getZilliqaSetup();
    const zjs = this.getZilliqaJSObject();
    // Forcibly checksum the address, since otherwise we will get into a mess
    // because eth addresses are checksummed differently from zil.
    const flat = toAddress.toLowerCase();
    const summed = zcrypto.toChecksumAddress(flat);
    const txDefault : TxParams = {
      version : setup.version,
      gasPrice: setup.gasPrice,
      gasLimit: setup.gasLimit,
      amount: value,
      toAddr: summed,
    };
    const callParams =  { ...txDefault, ...txParams };
    const tx1 = zjs.transactions.new(callParams);
    const tx = zjs.blockchain.createTransaction(tx1, setup!.attempts, setup!.timeout)
    return tx
  }

  public async getBalance(account: Account): Promise<[BN, number]> {
    return this.getBalanceForAddress(account.address);
  }

  public async getBalanceForAddress(addressToQuery: string): Promise<[BN, number]> {
    const rpc = await this.getZilliqaJSObject().blockchain.getBalance(
      addressToQuery
    );
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
  _hre: HardhatRuntimeEnvironment
): ZilliqaHardhatObject {
  return new ZilliqaHardhatObject();
}
