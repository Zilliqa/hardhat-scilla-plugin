import { BigNumber } from "@ethersproject/bignumber";
import { expect } from "chai";

import { simplifyLogs } from "../src/LogsSimplifier";

describe("", function () {
  describe("Logs simplifier", function () {
    before(function () {});

    it("Should simplify integer strings to an integer for 32/64 bit ints", function () {
      let log = [
        {
          _eventname: "Emit",
          address: "0xb943f467a0159ee133618c1836a027ccecc62e28",
          params: [
            {
              type: "ByStr20",
              value: "0xec902fe17d90203d0bddd943d97b29576ece3177",
              vname: "sender",
            },
            { type: "Uint64", value: "12", vname: "value" },
          ],
        },
      ];
      log = simplifyLogs(log);
      expect(log[0].params[1].value).to.be.eq(12);
    });

    it("Should simplify integer strings to a BigNumber for big ints", function () {
      const log = [
        {
          _eventname: "Emit",
          address: "0xb943f467a0159ee133618c1836a027ccecc62e28",
          params: [{ type: "Uint128", value: "12", vname: "value" }],
        },
      ];
      const simpleLog = simplifyLogs(log);
      const value: BigNumber = simpleLog[0].params[0].value;
      expect(value.eq(BigNumber.from("12"))).to.be.true;
    });

    it("Should simplify Option data type to a more readable object if it has Some(int)", function () {
      let log = [
        {
          _eventname: "TS",
          address: "0x9ef9f1bbd1151a911962614d7fcdfdf5df45f401",
          params: [
            {
              type: "Option (Uint64)",
              value: {
                argtypes: ["Uint64"],
                arguments: ["123"],
                constructor: "Some",
              },
              vname: "timestamp",
            },
          ],
        },
      ];

      log = simplifyLogs(log);
      expect(log[0].params[0].value).to.be.eq(123);
    });

    it("Should simplify Option data type to a null object if it's None", function () {
      let log = [
        {
          _eventname: "TS",
          address: "0x9ef9f1bbd1151a911962614d7fcdfdf5df45f401",
          params: [
            {
              type: "Option (Uint64)",
              value: {
                argtypes: [],
                arguments: [],
                constructor: "None",
              },
              vname: "timestamp",
            },
          ],
        },
      ];

      log = simplifyLogs(log);
      expect(log[0].params[0].value).to.be.null;
    });

    it("Should simplify Bool data type to true if it's True", function () {
      let log = [
        {
          _eventname: "TS",
          address: "0x9ef9f1bbd1151a911962614d7fcdfdf5df45f401",
          params: [
            {
              type: "Bool",
              value: {
                argtypes: [],
                arguments: [],
                constructor: "True",
              },
              vname: "timestamp",
            },
          ],
        },
      ];

      log = simplifyLogs(log);

      expect(log[0].params[0].value).to.be.true;
    });

    it("Should simplify Bool data type to true if it's True", function () {
      let log = [
        {
          _eventname: "TS",
          address: "0x9ef9f1bbd1151a911962614d7fcdfdf5df45f401",
          params: [
            {
              type: "Bool",
              value: {
                argtypes: [],
                arguments: [],
                constructor: "False",
              },
              vname: "timestamp",
            },
          ],
        },
      ];

      log = simplifyLogs(log);
      expect(log[0].params[0].value).to.be.false;
    });
  });
});
