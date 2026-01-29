"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const spawn = require("cross-spawn");
const python_1 = require("../../../deploy/functions/runtimes/python");
const python_2 = require("../../../functions/python");
const prompt_1 = require("../../../prompt");
const supported_1 = require("../../../deploy/functions/runtimes/supported");
const templates_1 = require("../../../templates");
const MAIN_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/python/main.py");
const REQUIREMENTS_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/python/requirements.txt");
const GITIGNORE_TEMPLATE = (0, templates_1.readTemplateSync)("init/functions/python/_gitignore");
async function setup(setup, config) {
    await config.askWriteProjectFile(`${setup.functions.source}/requirements.txt`, REQUIREMENTS_TEMPLATE);
    await config.askWriteProjectFile(`${setup.functions.source}/.gitignore`, GITIGNORE_TEMPLATE);
    await config.askWriteProjectFile(`${setup.functions.source}/main.py`, MAIN_TEMPLATE);
    config.set("functions.runtime", (0, supported_1.latest)("python"));
    config.set("functions.ignore", ["venv", "__pycache__"]);
    const venvProcess = spawn((0, python_1.getPythonBinary)((0, supported_1.latest)("python")), ["-m", "venv", "venv"], {
        shell: true,
        cwd: config.path(setup.functions.source),
        stdio: ["pipe", "pipe", "pipe", "pipe"],
    });
    await new Promise((resolve, reject) => {
        venvProcess.on("exit", resolve);
        venvProcess.on("error", reject);
    });
    const install = await (0, prompt_1.confirm)({
        message: "Do you want to install dependencies now?",
        default: true,
    });
    if (install) {
        const upgradeProcess = (0, python_2.runWithVirtualEnv)(["pip3", "install", "--upgrade", "pip"], config.path(setup.functions.source), {}, { stdio: ["inherit", "inherit", "inherit"] });
        await new Promise((resolve, reject) => {
            upgradeProcess.on("exit", resolve);
            upgradeProcess.on("error", reject);
        });
        const installProcess = (0, python_2.runWithVirtualEnv)([(0, python_1.getPythonBinary)((0, supported_1.latest)("python")), "-m", "pip", "install", "-r", "requirements.txt"], config.path(setup.functions.source), {}, { stdio: ["inherit", "inherit", "inherit"] });
        await new Promise((resolve, reject) => {
            installProcess.on("exit", resolve);
            installProcess.on("error", reject);
        });
    }
}
exports.setup = setup;
