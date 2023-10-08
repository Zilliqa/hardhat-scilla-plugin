// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.7.3",
  defaultNetwork: process.env.ZILLIQA_NETWORK || "public_testnet",
  networks: {
    // proxied isolated-server API on z blockchain connect 12010
    zisolated: {
      url: "http://localhost:12015",
      accounts: [
        // isolated server initial account for Scilla.
        "e53d1c3edaffc7a7bab5418eb836cf75819a82872b4a1a0f1c7fcf5c3e020b89",
        "589417286a3213dceb37f8f89bd164c3505a4cec9200c61f7c6db13a30a71b45",
        "e7f59a4beb997a02a13e0d5e025b39a6f0adc64d37bb1e6a849a4863b4680411",
        "410b0e0a86625a10c554f8248a77c7198917bd9135c15bb28922684826bb9f14"
      ],
      chainId: 0x80DE,
      //web3ClientVersion: "Zilliqa/v8.2",
      //protocolVersion: 0x41,
      //zilliqaNetwork: true,
      //miningState: false
  },
    isolated_server: {
    url: "http://localhost:5555/",
     // websocketUrl: "ws://localhost:5555/",
      accounts: [
        // isolated server initial account for Scilla.
      "db11cfa086b92497c8ed5a4cc6edb3a5bfe3a640c43ffb9fc6aa0873c56f2ee3",
      "589417286a3213dceb37f8f89bd164c3505a4cec9200c61f7c6db13a30a71b45",
      "e7f59a4beb997a02a13e0d5e025b39a6f0adc64d37bb1e6a849a4863b4680411",
      "410b0e0a86625a10c554f8248a77c7198917bd9135c15bb28922684826bb9f14"
    ],
    chainId: 0x8001,
      //web3ClientVersion: "Zilliqa/v8.2",
      //protocolVersion: 0x41,
      //zilliqaNetwork: true,
      //miningState: false
  },
  public_testnet: {
    url: "https://evm-api-dev.zilliqa.com",
    // websocketUrl: "https://evm-api-dev.zilliqa.com",
    accounts: [
      "603f0ef1610a638bb28d8f61ed7956c701e114fa39e1c263fc4f5504aed2f211",
      "d7ebc171562928a59aa8423e9b69393fe43a32f34b25dddc04f3f0dfe8881479",
      "411b0e0a86625a10c554f8248a77c7198917bd9135c15bb28922684826bb9f14",
      "58A417286a3213dceb37f8f89bd164c3505a4cec9200c61f7c6db13a30a71b45"
    ],
    chainId: 33101,
    //zilliqaNetwork: true,
    //web3ClientVersion: "Zilliqa/v8.2",
    //protocolVersion: 0x41,
    //miningState: false
  },
  localdev: {
    url: "http://localhost:5301",
    // websocketUrl: "ws://localhost:5301",
    accounts: [
      "d96e9eb5b782a80ea153c937fa83e5948485fbfc8b7e7c069d7b914dbc350aba",
      "589417286a3213dceb37f8f89bd164c3505a4cec9200c61f7c6db13a30a71b45",
      "e7f59a4beb997a02a13e0d5e025b39a6f0adc64d37bb1e6a849a4863b4680411",
      "410b0e0a86625a10c554f8248a77c7198917bd9135c15bb28922684826bb9f14"
    ],
    chainId: 0x8001,
    //web3ClientVersion: "Zilliqa/v8.2",
    //protocolVersion: 0x41,
    //zilliqaNetwork: true,
    //miningState: false
  }
  }
};

export default config;
