# hardhat-scilla-plugin

[Hardhat](https://hardhat.org) plugin to test Scilla contracts.

## What

This plugin is used to test scilla contracts in hardhat. It tries to be like ethers.js:
* You can deploy contracts using their names.
* You can transitions like a normal function call.
* You can get field easily.
* Custom chai matchers can be used to expect scilla events.

## Installation

<_A step-by-step guide on how to install the plugin_>

```bash
npm install <your npm package name> [list of peer dependencies]
```

Import the plugin in your `hardhat.config.js`:

```js
require("<your plugin npm package name>");
```

Or if you are using TypeScript, in your `hardhat.config.ts`:

```ts
import "<your plugin npm package name>";
```

## Tasks

This plugin adds the _scilla-check_ task to Hardhat:
```
Hardhat version 2.11.2

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
import {deploy, ScillaContract} from "../../helper/ScillaHelper";

let contract: ScillaContract = await deploy("SetGet");
let contract: ScillaContract = await deploy("HelloWorld", "Hello World"); // Contract with initial parameters.
```

### Call a transition

It's not harder than calling a normal function in typescript.
Let's assume we have a transition named `Set` which accepts a `number` as its parameter. Here is how to call it:

```typescript
await contract.Set(12);
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
it("Should contain event data if emit function is called", async function () {
  const tx = await contract.emit();
  expect(tx).to.have.eventLog("Emit");
});
```

Otherwise, if you need to deeply expect an event, you should use `eventLogWithParams`. The first parameter is again the event name. The rest are parameters of the expected event. If you expect to have an event like `getHello` sending a parameter named `msg` with a `"hello world"` value:

```typescript
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
