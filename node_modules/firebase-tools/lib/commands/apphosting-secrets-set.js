"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const clc = require("colorette");
const command_1 = require("../command");
const projectUtils_1 = require("../projectUtils");
const requireAuth_1 = require("../requireAuth");
const gcsm = require("../gcp/secretManager");
const apphosting = require("../gcp/apphosting");
const requirePermissions_1 = require("../requirePermissions");
const secrets = require("../apphosting/secrets");
const dialogs = require("../apphosting/secrets/dialogs");
const config = require("../apphosting/config");
const utils = require("../utils");
const prompt = require("../prompt");
exports.command = new command_1.Command("apphosting:secrets:set <secretName>")
    .description("create or update a secret for use in Firebase App Hosting")
    .option("-l, --location <location>", "optional location to retrict secret replication")
    .withForce("Automatically create a secret, grant permissions, and add to YAML.")
    .before(requireAuth_1.requireAuth)
    .before(gcsm.ensureApi)
    .before(apphosting.ensureApiEnabled)
    .before(requirePermissions_1.requirePermissions, [
    "secretmanager.secrets.create",
    "secretmanager.secrets.get",
    "secretmanager.secrets.update",
    "secretmanager.versions.add",
    "secretmanager.secrets.getIamPolicy",
    "secretmanager.secrets.setIamPolicy",
])
    .option("--data-file <dataFile>", 'File path from which to read secret data. Set to "-" to read the secret data from stdin.')
    .action(async (secretName, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const projectNumber = await (0, projectUtils_1.needProjectNumber)(options);
    const created = await secrets.upsertSecret(projectId, secretName, options.location);
    if (created === null) {
        return;
    }
    else if (created) {
        utils.logSuccess(`Created new secret projects/${projectId}/secrets/${secretName}`);
    }
    const secretValue = await utils.readSecretValue(`Enter a value for ${secretName}`, options.dataFile);
    const version = await gcsm.addVersion(projectId, secretName, secretValue);
    utils.logSuccess(`Created new secret version ${gcsm.toSecretVersionResourceName(version)}`);
    utils.logBullet(`You can access the contents of the secret's latest value with ${clc.bold(`firebase apphosting:secrets:access ${secretName}\n`)}`);
    if (!created) {
        return;
    }
    const type = await prompt.select({
        message: "Is this secret for production or only local testing?",
        choices: [
            { name: "Production", value: "production" },
            { name: "Local testing only", value: "local" },
        ],
    });
    if (type === "local") {
        const emailList = await prompt.input({
            message: "Please enter a comma separated list of user or groups who should have access to this secret:",
        });
        if (emailList.length) {
            await secrets.grantEmailsSecretAccess(projectId, [secretName], emailList.split(","));
        }
        else {
            utils.logBullet("To grant access in the future run " +
                clc.bold(`firebase apphosting:secrets:grantaccess ${secretName} --emails [email list]`));
        }
        await config.maybeAddSecretToYaml(secretName, config.APPHOSTING_EMULATORS_YAML_FILE);
        return;
    }
    const accounts = await dialogs.selectBackendServiceAccounts(projectNumber, projectId, options);
    if (!accounts.buildServiceAccounts.length && !accounts.runServiceAccounts.length) {
        utils.logWarning(`To use this secret in your backend, you must grant access. You can do so in the future with ${clc.bold("firebase apphosting:secrets:grantaccess")}`);
    }
    else {
        await secrets.grantSecretAccess(projectId, projectNumber, secretName, accounts);
    }
    await config.maybeAddSecretToYaml(secretName, config.APPHOSTING_BASE_YAML_FILE);
    utils.logBullet("To grant additional users access to this secret run " +
        clc.bold(`firebase apphosting:secrets:grantaccess ${secretName} --email [email list]`) +
        ".\nTo grant additional backends access to this secret run " +
        clc.bold(`firebase apphosting:secrets:grantaccess ${secretName} --backend [backend ID]`));
});
