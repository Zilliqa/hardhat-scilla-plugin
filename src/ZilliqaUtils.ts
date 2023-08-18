import { Transaction } from "@zilliqa-js/account";
import { TransactionError } from "@zilliqa-js/core";

interface ErrorDict {
  [index: string]: TransactionError[];
}

/** Should we use native scilla binaries? */
export function useNativeScilla() : boolean {
  return (process.env.USE_NATIVE_SCILLA !== undefined)
}

/** Given a transaction, return a string[][] array containing a list of errors, decoded into their
 * symbolic values, for each level of the transaction.
 */
export function decodeTransactionErrors(txn: Transaction): string[][] {
  const receipt = txn.getReceipt();
  if (receipt === undefined) {
    return [];
  }
  if (receipt.errors === undefined) {
    return [];
  }
  const rv: string[][] = [];
  const errors = receipt.errors as ErrorDict;
  for (const key in errors) {
    const our_errors: string[] = [];
    for (const err in errors[key]) {
      our_errors.push(`${err} (${TransactionError[err]})`);
    }
    rv.push(our_errors);
  }
  return rv;
}

/** Given a transaction, get the errors from the receipt and return a human-readable string that
 *  can be used to display them.
 */
export function stringifyTransactionErrors(txn: Transaction): string {
  const errors: string[][] = decodeTransactionErrors(txn);
  let result = "";
  for (const level in errors) {
    result = result + "[" + errors[level].join(",") + "] ";
  }
  return result;
}

/** Given a transaction, extract the event log in case you want to read parameters of it
 */
export async function getEventLog(tx: Transaction): Promise<any> {
  const receipt = tx.getReceipt()!;
  const event_logs = receipt.event_logs!;
  return event_logs;
}

