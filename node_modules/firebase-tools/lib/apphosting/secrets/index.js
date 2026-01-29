"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecretNameParts = exports.fetchSecrets = exports.upsertSecret = exports.grantEmailsSecretAccess = exports.grantSecretAccess = exports.serviceAccountsForBackend = exports.toMulti = void 0;
const error_1 = require("../../error");
const gcsm = require("../../gcp/secretManager");
const gcb = require("../../gcp/cloudbuild");
const gce = require("../../gcp/computeEngine");
const apphosting = require("../../gcp/apphosting");
const secretManager_1 = require("../../gcp/secretManager");
const secretManager_2 = require("../../gcp/secretManager");
const utils = require("../../utils");
const prompt = require("../../prompt");
function toMulti(accounts) {
    const m = {
        buildServiceAccounts: [accounts.buildServiceAccount],
        runServiceAccounts: [],
    };
    if (accounts.buildServiceAccount !== accounts.runServiceAccount) {
        m.runServiceAccounts.push(accounts.runServiceAccount);
    }
    return m;
}
exports.toMulti = toMulti;
async function serviceAccountsForBackend(projectNumber, backend) {
    if (backend.serviceAccount) {
        return {
            buildServiceAccount: backend.serviceAccount,
            runServiceAccount: backend.serviceAccount,
        };
    }
    return {
        buildServiceAccount: gcb.getDefaultServiceAccount(projectNumber),
        runServiceAccount: await gce.getDefaultServiceAccount(projectNumber),
    };
}
exports.serviceAccountsForBackend = serviceAccountsForBackend;
async function grantSecretAccess(projectId, projectNumber, secretName, accounts) {
    const p4saEmail = apphosting.serviceAgentEmail(projectNumber);
    const newBindings = [
        {
            role: "roles/secretmanager.secretAccessor",
            members: [...accounts.buildServiceAccounts, ...accounts.runServiceAccounts].map((sa) => `serviceAccount:${sa}`),
        },
        {
            role: "roles/secretmanager.viewer",
            members: accounts.buildServiceAccounts.map((sa) => `serviceAccount:${sa}`),
        },
        {
            role: "roles/secretmanager.secretVersionManager",
            members: [`serviceAccount:${p4saEmail}`],
        },
    ];
    let existingBindings;
    try {
        existingBindings = (await gcsm.getIamPolicy({ projectId, name: secretName })).bindings || [];
    }
    catch (err) {
        throw new error_1.FirebaseError(`Failed to get IAM bindings on secret: ${secretName}. Ensure you have the permissions to do so and try again.`, { original: (0, error_1.getError)(err) });
    }
    const updatedBindings = existingBindings.concat(newBindings);
    try {
        await gcsm.setIamPolicy({ projectId, name: secretName }, updatedBindings);
    }
    catch (err) {
        throw new error_1.FirebaseError(`Failed to set IAM bindings ${JSON.stringify(newBindings)} on secret: ${secretName}. Ensure you have the permissions to do so and try again. ` +
            "For more information visit https://cloud.google.com/secret-manager/docs/manage-access-to-secrets#required-roles", { original: (0, error_1.getError)(err) });
    }
    utils.logSuccess(`Successfully set IAM bindings on secret ${secretName}.\n`);
}
exports.grantSecretAccess = grantSecretAccess;
async function grantEmailsSecretAccess(projectId, secretNames, emails) {
    const typeGuesses = Object.fromEntries(emails.map((email) => [email, "user"]));
    for (const secretName of secretNames) {
        let existingBindings;
        try {
            existingBindings = (await gcsm.getIamPolicy({ projectId, name: secretName })).bindings || [];
        }
        catch (err) {
            throw new error_1.FirebaseError(`Failed to get IAM bindings on secret: ${secretName}. Ensure you have the permissions to do so and try again. ` +
                "For more information visit https://cloud.google.com/secret-manager/docs/manage-access-to-secrets#required-roles", { original: (0, error_1.getError)(err) });
        }
        do {
            try {
                const newBindings = [
                    {
                        role: "roles/secretmanager.secretAccessor",
                        members: Object.entries(typeGuesses).map(([email, type]) => `${type}:${email}`),
                    },
                ];
                const updatedBindings = existingBindings.concat(newBindings);
                await gcsm.setIamPolicy({ projectId, name: secretName }, updatedBindings);
                break;
            }
            catch (err) {
                if (!(err instanceof error_1.FirebaseError)) {
                    throw new error_1.FirebaseError(`Unexpected error updating IAM bindings on secret: ${secretName}`, {
                        original: (0, error_1.getError)(err),
                    });
                }
                const match = /Principal (.*) is of type "([^"]+)"/.exec(err.message);
                if (!match) {
                    throw new error_1.FirebaseError(`Failed to set IAM bindings on secret: ${secretName}. Ensure you have the permissions to do so and try again.`, { original: (0, error_1.getError)(err) });
                }
                typeGuesses[match[1]] = match[2];
                continue;
            }
        } while (true);
        utils.logSuccess(`Successfully set IAM bindings on secret ${secretName}.\n`);
    }
}
exports.grantEmailsSecretAccess = grantEmailsSecretAccess;
async function upsertSecret(project, secret, location) {
    var _a, _b, _c, _d;
    let existing;
    try {
        existing = await gcsm.getSecret(project, secret);
    }
    catch (err) {
        if ((0, error_1.getErrStatus)(err) !== 404) {
            throw new error_1.FirebaseError("Unexpected error loading secret", { original: (0, error_1.getError)(err) });
        }
        await gcsm.createSecret(project, secret, gcsm.labels("apphosting"), location);
        return true;
    }
    const replication = (_a = existing.replication) === null || _a === void 0 ? void 0 : _a.userManaged;
    if (location &&
        (((_b = replication === null || replication === void 0 ? void 0 : replication.replicas) === null || _b === void 0 ? void 0 : _b.length) !== 1 || ((_d = (_c = replication === null || replication === void 0 ? void 0 : replication.replicas) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.location) !== location)) {
        utils.logLabeledError("apphosting", "Secret replication policies cannot be changed after creation");
        return null;
    }
    if ((0, secretManager_2.isFunctionsManaged)(existing)) {
        utils.logLabeledWarning("apphosting", `Cloud Functions for Firebase currently manages versions of ${secret}. Continuing will disable ` +
            "automatic deletion of old versions.");
        const stopTracking = await prompt.confirm({
            message: "Do you wish to continue?",
            default: false,
        });
        if (!stopTracking) {
            return null;
        }
        delete existing.labels[secretManager_1.FIREBASE_MANAGED];
        await gcsm.patchSecret(project, secret, existing.labels);
    }
    return false;
}
exports.upsertSecret = upsertSecret;
async function fetchSecrets(projectId, secrets) {
    let secretsKeyValuePairs;
    try {
        const secretPromises = secrets.map(async (secretConfig) => {
            const [name, version] = getSecretNameParts(secretConfig.secret);
            const value = await gcsm.accessSecretVersion(projectId, name, version);
            return [secretConfig.variable, value];
        });
        const secretEntries = await Promise.all(secretPromises);
        secretsKeyValuePairs = new Map(secretEntries);
    }
    catch (e) {
        throw new error_1.FirebaseError(`Error exporting secrets`, {
            original: e,
        });
    }
    return secretsKeyValuePairs;
}
exports.fetchSecrets = fetchSecrets;
function getSecretNameParts(secret) {
    let [name, version] = secret.split("@");
    if (!version) {
        version = "latest";
    }
    return [name, version];
}
exports.getSecretNameParts = getSecretNameParts;
