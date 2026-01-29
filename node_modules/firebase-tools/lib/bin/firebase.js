#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver = require("semver");
const experiments_1 = require("../experiments");
const pkg = require("../../package.json");
const nodeVersion = process.version;
if (!semver.satisfies(nodeVersion, pkg.engines.node)) {
    console.error(`Firebase CLI v${pkg.version} is incompatible with Node.js ${nodeVersion} Please upgrade Node.js to version ${pkg.engines.node}`);
    process.exit(1);
}
if ((0, experiments_1.isEnabled)("mcp") && process.argv[2] === "experimental:mcp") {
    const { mcp } = require("./mcp");
    mcp();
}
else {
    const { cli } = require("./cli");
    cli(pkg);
}
