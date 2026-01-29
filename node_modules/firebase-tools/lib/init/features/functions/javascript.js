"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const npm_dependencies_1 = require("./npm-dependencies");
const prompt_1 = require("../../../prompt");
const projectConfig_1 = require("../../../functions/projectConfig");
const templates_1 = require("../../../templates");
const supported = require("../../../deploy/functions/runtimes/supported");
const INDEX_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/javascript/index.js");
const PACKAGE_LINTING_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/javascript/package.lint.json");
const PACKAGE_NO_LINTING_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/javascript/package.nolint.json");
const ESLINT_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/javascript/_eslintrc");
const GITIGNORE_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/javascript/_gitignore");
async function setup(setup, config) {
    setup.functions.lint =
        setup.functions.lint ||
            (await (0, prompt_1.confirm)("Do you want to use ESLint to catch probable bugs and enforce style?"));
    if (setup.functions.lint) {
        const cbconfig = (0, projectConfig_1.configForCodebase)(setup.config.functions, setup.functions.codebase);
        cbconfig.predeploy = ['npm --prefix "$RESOURCE_DIR" run lint'];
        await config.askWriteProjectFile(`${setup.functions.source}/package.json`, PACKAGE_LINTING_TEMPLATE.replace("{{RUNTIME}}", supported.latest("nodejs").replace("nodejs", "")));
        await config.askWriteProjectFile(`${setup.functions.source}/.eslintrc.js`, ESLINT_TEMPLATE);
    }
    else {
        await config.askWriteProjectFile(`${setup.functions.source}/package.json`, PACKAGE_NO_LINTING_TEMPLATE.replace("{{RUNTIME}}", supported.latest("nodejs").replace("nodejs", "")));
    }
    await config.askWriteProjectFile(`${setup.functions.source}/index.js`, INDEX_TEMPLATE);
    await config.askWriteProjectFile(`${setup.functions.source}/.gitignore`, GITIGNORE_TEMPLATE);
    await (0, npm_dependencies_1.askInstallDependencies)(setup.functions, config);
}
exports.setup = setup;
