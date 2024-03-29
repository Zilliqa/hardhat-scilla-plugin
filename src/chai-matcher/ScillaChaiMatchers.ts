import { BigNumber } from "@ethersproject/bignumber";
import { Transaction } from "@zilliqa-js/account";
import chai from "chai";
import chaiSubset from "chai-subset";

import { simplifyLogs } from "./LogsSimplifier";
chai.use(chaiSubset);

export interface EventParam {
  type?: string;
  value?: string | BigNumber | number | boolean;
  vname?: string;
}

declare global {
  export namespace Chai {
    interface Assertion {
      eventLog(eventName: string): Promise<void>;
      eventLogWithParams(
        eventName: string,
        ...params: EventParam[]
      ): Promise<void>;
    }
  }
}

export const scillaChaiEventMatcher = function (
  static_chai: Chai.ChaiStatic,
  _utils: Chai.ChaiUtils
) {
  const Assertion = static_chai.Assertion;
  Assertion.addMethod("eventLog", function (eventName: string) {
    const tx: Transaction = this._obj;

    const receipt = tx.getReceipt()!;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    new Assertion(receipt.event_logs).not.to.be.null;

    const event_logs = receipt.event_logs!;

    new Assertion(event_logs.map(({ _eventname }) => _eventname)).to.contain(
      eventName
    );
  });

  Assertion.addMethod(
    "eventLogWithParams",
    async function (eventName: string, ...params: EventParam[]) {
      const tx: Transaction = this._obj;

      const receipt = tx.getReceipt()!;
      await new Assertion(this._obj).to.eventLog(eventName);

      const event_logs = simplifyLogs(receipt.event_logs!);
      const desiredLog = event_logs.filter(
        (log: any) => log._eventname === eventName
      );

      new Assertion(desiredLog[0].params).to.containSubset(params);
    }
  );
};
