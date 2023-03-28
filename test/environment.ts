import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";

import "../src/typoe-extensions.ts";

declare module "mocha" {
    interface Context {
        env : HardhatRuntimeEnviroment;
    }
}


export function useEnvironment(
    fixtureProjectName: string
) {
    beforeEach("Loading hardhat environment", function() {
        this.env = require("hardhat");
    });

    afterEach("Resetting hardhat", function() {
        resetHardhatContext();
    });
}
