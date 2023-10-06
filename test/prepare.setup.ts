import { useEnvironment } from "./helpers"

before(async () => {
  useEnvironment("hardhat-project");
});
