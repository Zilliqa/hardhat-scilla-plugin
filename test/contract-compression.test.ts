import { expect } from "chai";

import { compressContract } from "../src/deployer/ScillaContractDeployer";

describe("Contract Compression", function () {
  it("#1", async function () {
    const code = `(***************************************************)
(*             The contract definition             *)
(***************************************************)
contract HelloWorld
(owner: ByStr20)`;
    const compressed = compressContract(code);
    expect(compressed).to.be.eq(`contract HelloWorld
(owner: ByStr20)`);
  });

  it("#2", async function () {
    const code = `(*something*)contract HelloWorld
(owner: ByStr20)`;
    const compressed = compressContract(code);
    expect(compressed).to.be.eq(`contract HelloWorld
(owner: ByStr20)`);
  });

  it("#3", async function () {
    const code = `contract HelloWorld (* a dummy comment*)
(owner: ByStr20)`;
    const compressed = compressContract(code);
    expect(compressed).to.be.eq(`contract HelloWorld
(owner: ByStr20)`);
  });

  it("#4", async function () {
    const code = `contract WithComment          (*contract name*)
()
(*fields*)
field welcome_msg : String = "" (*welcome*) (*another comment*)  `;
    const compressed = compressContract(code);
    expect(compressed).to.be.eq(`contract WithComment
()
field welcome_msg : String = ""`);
  });
});
