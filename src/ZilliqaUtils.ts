import { TransactionError } from "@zilliqa-js/core";
import { Transaction } from "@zilliqa-js/account";

interface ErrorDict {
    [index: string]: TransactionError[];
}

/** Given a transaction, return a string[][] array containing a list of errors, decoded into their
 * symbolic values, for each level of the transaction.
 */
export function decodeTransactionErrors(txn : Transaction) : string[][] {
    let receipt = txn.getReceipt();
    if (receipt === undefined) {
        return [ ]
    }
    if (receipt.errors === undefined) {
        return [ ]
    }
    var rv : string[][] = [ ]
    var errors = (receipt.errors as ErrorDict)
    for (let key in errors) {
        var our_errors : string[] = []
        for (let err in errors[key]) {
            our_errors.push(`${err} (${TransactionError[err]})`)
        }
        rv.push(our_errors)
    }
    return rv
}

/** Given a transaction, get the errors from the receipt and return a human-readable string that
 *  can be used to display them.
 */
export function stringifyTransactionErrors(txn : Transaction): string {
    let errors : string[][] = decodeTransactionErrors(txn)
    let result = ""
    for (let level in errors) {
        result = result + "[" + errors[level].join(",") + "] "
    }
    return result
}
