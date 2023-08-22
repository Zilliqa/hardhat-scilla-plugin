# hardhat-scilla-plugin

[Hardhat](https://hardhat.org) plugin to test Scilla contracts.

## What

This plugin is used to test scilla contracts in hardhat. It tries to be like ethers.js:
* You can deploy contracts using their names.
* You can call transitions like a normal function call.
* You can get field easily.
* You can use custom chai matchers to expect scilla events.

## Installation

```bash
pnpm install hardhat-scilla-plugin
```

Import the plugin in your `hardhat.config.js`:

```js
require("hardhat-scilla-plugin");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "hardhat-scilla-plugin";
```

## Running Scilla

In order to check, and extract data from, Scilla contracts, we use binaries from the Scilla distribution itself.

By default, we pull these from the `zilliqa/scilla` container in docker hub, using Scilla v0.13.3, but if you want to run them from your local machine, you can set the `USE_NATIVE_SCILLA` environment variable to run them from your `PATH`. If want to run `scilla-checker` with `USE_NATIVE_SCILLA` set, you will need to give the `-libDir` argument to tell it where to find the Scilla standard library.

If you want to set `USE_NATIVE_SCILLA`, you need to have `scilla-fmt` and `scilla-checker` binaries from the [Scilla project](https://github.com/Zilliqa/scilla/) on your `PATH`. You can build them by following the instructions in the scilla project repository.

## Tasks

This plugin adds the _scilla-check_ task to Hardhat:
```
Hardhat version 2.16.0

Usage: hardhat [GLOBAL OPTIONS] scilla-check --libdir <STRING> [...contracts]

OPTIONS:

  --libdir      Path to Scilla stdlib 

POSITIONAL ARGUMENTS:

  contracts     An optional list of files to check (default: [])

scilla-check: Parsing scilla contracts and performing a number of static checks including typechecking.

For global options help run: hardhat help
```

## Environment extensions

This plugin extends the Hardhat Runtime Environment by adding an `scillaContracts` field
whose type is `ScillaContracts`.

## Usage

Scilla testing can be done in the same way ethers.js is used for solidity. It's possible to deploy a scilla contract by its name and call its transitions just like a normal function call. It's also possible to get a field value through a function call. In the below sections, all of these topics are covered in detail.

### Deploy a contract

To deploy a contract all you need to know is its name:

```typescript
import {ScillaContract, initZilliqa} from "hardhat-scilla-plugin";

const privateKeys = ["254d9924fc1dcdca44ce92d80255c6a0bb690f867abde80e626fbfef4d357004"];
const network_url = "http://localhost:5555";
const chain_id = 1;
initZilliqa(network_url, chain_id, privateKeys);

let contract: ScillaContract = await hre.deployScillaContract("SetGet");
let contract: ScillaContract = await hre.deployScillaContract("HelloWorld", "Hello World"); // Contract with initial parameters.
```

In the same way, you can deploy your libraries with their names:
```typescript
let library: ScillaContract = await hre.deployScillaLibrary("MyLibrary");
```

and finally, here is how you can deploy a contract importing a user-defined library:
```typescript
contract2 = await hre.deployScillaWithLib("TestContract2",
      [{name: "MutualLib", address: mutualLibAddress}]
```

Optionally to change the deployer of the contract, you can send an instance of `Account` class to these functions.
```typescript
let contract: ScillaContract = await hre.deployScillaContract("SetGet", account);
```
### Call a transition

It's not harder than calling a normal function in typescript.
Let's assume we have a transition named `Set` which accepts a `number` as its parameter. Here is how to call it:

```typescript
await contract.Set(12);
```

### Call a transition with a custom nonce
```typescript
await contract.Set(12, {nonce: 12});
```
It's possible to override the following properties:

```typescript
export interface TxParams {
    version: number;
    toAddr: string;
    amount: BN;
    gasPrice: BN;
    gasLimit: Long;
    code?: string;
    data?: string;
    receipt?: TxReceipt;
    nonce?: number;
    pubKey?: string;
    signature?: string;
}
```

```typescript
await contract.Set(12, {nonce: 12, amount: new BN(1000)});
```

### call a transition with a new account
You can call `connect` on a contract to change its default account which is used to execute transitions.

```typescript
await contract.connect(newAccount).Set(123);
```

### Get field value

If a given contract has a filed named `msg` is possible to get its current value using a function call to `msg()`

```typescript
const msg = await contract.msg();
```

### Expect a result

Chai matchers can be used to expect a value:

```typescript
it("Should set state correctly", async function () {
  const VALUE = 12;
  await contract.Set(VALUE);
  expect(await contract.value()).to.be.eq(VALUE);
});
```

There are two custom chai matchers specially developed to `expect` scilla events. `eventLog` and `eventLogWithParams`.
Use `eventLog` if you just need to expect event name:

```typescript
import chai from "chai";
import {scillaChaiEventMatcher} from "hardhat-scilla-plugin";

chai.use(scillaChaiEventMatcher);

it("Should contain event data if emit function is called", async function () {
  const tx = await contract.emit();
  expect(tx).to.have.eventLog("Emit");
});
```

Otherwise, if you need to deeply expect an event, you should use `eventLogWithParams`. The first parameter is again the event name. The rest are parameters of the expected event. If you expect to have an event like `getHello` sending a parameter named `msg` with a `"hello world"` value:

```typescript
import chai from "chai";
import {scillaChaiEventMatcher} from "hardhat-scilla-plugin";

chai.use(scillaChaiEventMatcher);

it("Should send getHello() event when getHello() transition is called", async function () {
  const tx = await contract.getHello();
  expect(tx).to.have.eventLogWithParams("getHello()", {value: "hello world", vname: "msg"});
});
```

You can even expect data type of the parameter(s):

```typescript
expect(tx).to.have.eventLogWithParams("getHello()", {value: "hello world", vname: "msg", type: "String"});
```

Type should be a valid Scilla type.

But if you just want to expect on the value of a event parameter do this:

```typescript
expect(tx).to.have.eventLogWithParams("getHello()", {value: "hello world"});
```

For easier value matching, some value conversions are done under the hood.
* 32/64 bit integer values are converted to `Number`
* 128/256 bit integer values are converted to `BigNumber`
* `Option` is converted to its inner value if exists any, or `null` otherwise.
* `Bool` is converted to underlying boolean value.
 
for more tests please take look at [scilla tests](https://github.com/Zilliqa/Zilliqa/tree/master/tests/EvmAcceptanceTests/test/scilla).

### TODO

- Support formatting complex data types such as `Map` and `List`

### Scilla checker task

To run `scilla-checker` on all of the scilla contracts in the [contracts directory](./contracts/) run:

```bash
npx hardhat scilla-check --libdir path_to_stdlib
```

alternatively, you can check a specific file(s):

```bash
npx hardhat scilla-check --libdir path_to_stdlib contracts/scilla/helloWorld.scilla
```

### TODO

- Add `scilla-fmt` task

### Running internal tests

If you want to monitor your requests:

```
mitmweb --mode reverse:https://dev-api.zilliqa.com --modify-headers /~q/Host/dev-api.zilliqa.com --no-web-open-browser --listen-port 5600 --web-port 8600
export ZILLIQA_API_URL=http://localhost:5600/
```

Set `ZILLIQA_API_URL` to the URL of a network to test - or to eg. `http://localhost:5600` if you're proxying as above.
Set `ZILLIQA_NETWORK` to the name of the network to test against - see `test/fixture-projects/hardhat-proxy/hardhat.config.ts` for details.

```sh
yarn test
```

Will run all tests that don't require an external network (so that test passes will be deterministic).

```sh
yarn test-live
```

Will run just the tests that do require an external network.

```sh
yarn test-all
```

Will run both sets of tests.

