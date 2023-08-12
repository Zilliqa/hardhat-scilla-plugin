import chai, { expect } from "chai";
import chaiSubset from "chai-subset";

import {
  runScillaChecker
} from "../src/ScillaChecker";
chai.use(chaiSubset);

describe("", function () {
  describe("Scilla checker should run without faulting", async function () {
    if (process.env.USE_NATIVE_SCILLA) {
      console.log("The scilla checker test will only run in a container because we don't have a copy of stdlib to hand: skipping.")
    } else {
      await runScillaChecker([], undefined)
    }
  });
});

