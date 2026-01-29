"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labels = exports.ensureApi = exports.isAppHostingManaged = exports.isFunctionsManaged = exports.FIREBASE_MANAGED = exports.checkServiceAgentRole = exports.ensureServiceAgentRole = exports.setIamPolicy = exports.getIamPolicy = exports.addVersion = exports.deleteSecret = exports.patchSecret = exports.createSecret = exports.toSecretVersionResourceName = exports.parseSecretVersionResourceName = exports.parseSecretResourceName = exports.secretExists = exports.destroySecretVersion = exports.accessSecretVersion = exports.getSecretVersion = exports.listSecretVersions = exports.getSecretMetadata = exports.listSecrets = exports.getSecret = exports.secretManagerConsoleUri = void 0;
const utils_1 = require("../utils");
const error_1 = require("../error");
const apiv2_1 = require("../apiv2");
const api_1 = require("../api");
const ensureApiEnabled = require("../ensureApiEnabled");
const projectUtils_1 = require("../projectUtils");
const SECRET_NAME_REGEX = new RegExp("projects\\/" +
    "(?<project>(?:\\d+)|(?:[A-Za-z]+[A-Za-z\\d-]*[A-Za-z\\d]?))\\/" +
    "secrets\\/" +
    "(?<secret>[A-Za-z\\d\\-_]+)");
const SECRET_VERSION_NAME_REGEX = new RegExp(SECRET_NAME_REGEX.source + "\\/versions\\/" + "(?<version>latest|[0-9]+)");
const secretManagerConsoleUri = (projectId) => `https://console.cloud.google.com/security/secret-manager?project=${projectId}`;
exports.secretManagerConsoleUri = secretManagerConsoleUri;
const API_VERSION = "v1";
const client = new apiv2_1.Client({ urlPrefix: (0, api_1.secretManagerOrigin)(), apiVersion: API_VERSION });
async function getSecret(projectId, name) {
    var _a, _b;
    const getRes = await client.get(`projects/${projectId}/secrets/${name}`);
    const secret = parseSecretResourceName(getRes.body.name);
    secret.labels = (_a = getRes.body.labels) !== null && _a !== void 0 ? _a : {};
    secret.replication = (_b = getRes.body.replication) !== null && _b !== void 0 ? _b : {};
    return secret;
}
exports.getSecret = getSecret;
async function listSecrets(projectId, filter) {
    var _a, _b;
    const secrets = [];
    const path = `projects/${projectId}/secrets`;
    const baseOpts = filter ? { queryParams: { filter } } : {};
    let pageToken = "";
    while (true) {
        const opts = pageToken === ""
            ? baseOpts
            : Object.assign(Object.assign({}, baseOpts), { queryParams: Object.assign(Object.assign({}, baseOpts === null || baseOpts === void 0 ? void 0 : baseOpts.queryParams), { pageToken }) });
        const res = await client.get(path, opts);
        for (const s of res.body.secrets || []) {
            secrets.push(Object.assign(Object.assign({}, parseSecretResourceName(s.name)), { labels: (_a = s.labels) !== null && _a !== void 0 ? _a : {}, replication: (_b = s.replication) !== null && _b !== void 0 ? _b : {} }));
        }
        if (!res.body.nextPageToken) {
            break;
        }
        pageToken = res.body.nextPageToken;
    }
    return secrets;
}
exports.listSecrets = listSecrets;
async function getSecretMetadata(projectId, secretName, version) {
    const secretInfo = {};
    try {
        secretInfo.secret = await getSecret(projectId, secretName);
        secretInfo.secretVersion = await getSecretVersion(projectId, secretName, version);
    }
    catch (err) {
        if (err.status !== 404) {
            throw err;
        }
    }
    return secretInfo;
}
exports.getSecretMetadata = getSecretMetadata;
async function listSecretVersions(projectId, name, filter) {
    const secrets = [];
    const path = `projects/${projectId}/secrets/${name}/versions`;
    const baseOpts = filter ? { queryParams: { filter } } : {};
    let pageToken = "";
    while (true) {
        const opts = pageToken === ""
            ? baseOpts
            : Object.assign(Object.assign({}, baseOpts), { queryParams: Object.assign(Object.assign({}, baseOpts === null || baseOpts === void 0 ? void 0 : baseOpts.queryParams), { pageToken }) });
        const res = await client.get(path, opts);
        for (const s of res.body.versions || []) {
            secrets.push(Object.assign(Object.assign({}, parseSecretVersionResourceName(s.name)), { state: s.state, createTime: s.createTime }));
        }
        if (!res.body.nextPageToken) {
            break;
        }
        pageToken = res.body.nextPageToken;
    }
    return secrets;
}
exports.listSecretVersions = listSecretVersions;
async function getSecretVersion(projectId, name, version) {
    const getRes = await client.get(`projects/${projectId}/secrets/${name}/versions/${version}`);
    return Object.assign(Object.assign({}, parseSecretVersionResourceName(getRes.body.name)), { state: getRes.body.state, createTime: getRes.body.createTime });
}
exports.getSecretVersion = getSecretVersion;
async function accessSecretVersion(projectId, name, version) {
    const res = await client.get(`projects/${projectId}/secrets/${name}/versions/${version}:access`);
    return Buffer.from(res.body.payload.data, "base64").toString();
}
exports.accessSecretVersion = accessSecretVersion;
async function destroySecretVersion(projectId, name, version) {
    if (version === "latest") {
        const sv = await getSecretVersion(projectId, name, "latest");
        version = sv.versionId;
    }
    await client.post(`projects/${projectId}/secrets/${name}/versions/${version}:destroy`);
}
exports.destroySecretVersion = destroySecretVersion;
async function secretExists(projectId, name) {
    try {
        await getSecret(projectId, name);
        return true;
    }
    catch (err) {
        if (err.status === 404) {
            return false;
        }
        throw err;
    }
}
exports.secretExists = secretExists;
function parseSecretResourceName(resourceName) {
    const match = SECRET_NAME_REGEX.exec(resourceName);
    if (!(match === null || match === void 0 ? void 0 : match.groups)) {
        throw new error_1.FirebaseError(`Invalid secret resource name [${resourceName}].`);
    }
    return {
        projectId: match.groups.project,
        name: match.groups.secret,
        labels: {},
        replication: {},
    };
}
exports.parseSecretResourceName = parseSecretResourceName;
function parseSecretVersionResourceName(resourceName) {
    const match = resourceName.match(SECRET_VERSION_NAME_REGEX);
    if (!(match === null || match === void 0 ? void 0 : match.groups)) {
        throw new error_1.FirebaseError(`Invalid secret version resource name [${resourceName}].`);
    }
    return {
        secret: {
            projectId: match.groups.project,
            name: match.groups.secret,
            labels: {},
            replication: {},
        },
        versionId: match.groups.version,
        createTime: "",
    };
}
exports.parseSecretVersionResourceName = parseSecretVersionResourceName;
function toSecretVersionResourceName(secretVersion) {
    return `projects/${secretVersion.secret.projectId}/secrets/${secretVersion.secret.name}/versions/${secretVersion.versionId}`;
}
exports.toSecretVersionResourceName = toSecretVersionResourceName;
async function createSecret(projectId, name, labels, location) {
    let replication;
    if (location) {
        replication = {
            userManaged: {
                replicas: [
                    {
                        location,
                    },
                ],
            },
        };
    }
    else {
        replication = { automatic: {} };
    }
    const createRes = await client.post(`projects/${projectId}/secrets`, {
        name,
        replication,
        labels,
    }, { queryParams: { secretId: name } });
    return Object.assign(Object.assign({}, parseSecretResourceName(createRes.body.name)), { labels,
        replication });
}
exports.createSecret = createSecret;
async function patchSecret(projectId, name, labels) {
    const fullName = `projects/${projectId}/secrets/${name}`;
    const res = await client.patch(fullName, { name: fullName, labels }, { queryParams: { updateMask: "labels" } });
    return Object.assign(Object.assign({}, parseSecretResourceName(res.body.name)), { labels: res.body.labels, replication: res.body.replication });
}
exports.patchSecret = patchSecret;
async function deleteSecret(projectId, name) {
    const path = `projects/${projectId}/secrets/${name}`;
    await client.delete(path);
}
exports.deleteSecret = deleteSecret;
async function addVersion(projectId, name, payloadData) {
    const res = await client.post(`projects/${projectId}/secrets/${name}:addVersion`, {
        payload: {
            data: Buffer.from(payloadData).toString("base64"),
        },
    });
    return Object.assign(Object.assign({}, parseSecretVersionResourceName(res.body.name)), { state: res.body.state, createTime: "" });
}
exports.addVersion = addVersion;
async function getIamPolicy(secret) {
    const res = await client.get(`projects/${secret.projectId}/secrets/${secret.name}:getIamPolicy`);
    return res.body;
}
exports.getIamPolicy = getIamPolicy;
async function setIamPolicy(secret, bindings) {
    await client.post(`projects/${secret.projectId}/secrets/${secret.name}:setIamPolicy`, {
        policy: {
            bindings,
        },
        updateMask: "bindings",
    });
}
exports.setIamPolicy = setIamPolicy;
async function ensureServiceAgentRole(secret, serviceAccountEmails, role) {
    const bindings = await checkServiceAgentRole(secret, serviceAccountEmails, role);
    if (bindings.length) {
        await module.exports.setIamPolicy(secret, bindings);
    }
    (0, utils_1.logLabeledSuccess)("secretmanager", `Granted ${role} on projects/${secret.projectId}/secrets/${secret.name} to ${serviceAccountEmails.join(", ")}`);
}
exports.ensureServiceAgentRole = ensureServiceAgentRole;
async function checkServiceAgentRole(secret, serviceAccountEmails, role) {
    const policy = await module.exports.getIamPolicy(secret);
    const bindings = policy.bindings || [];
    let binding = bindings.find((b) => b.role === role);
    if (!binding) {
        binding = { role, members: [] };
        bindings.push(binding);
    }
    let shouldShortCircuit = true;
    for (const serviceAccount of serviceAccountEmails) {
        if (!binding.members.find((m) => m === `serviceAccount:${serviceAccount}`)) {
            binding.members.push(`serviceAccount:${serviceAccount}`);
            shouldShortCircuit = false;
        }
    }
    if (shouldShortCircuit)
        return [];
    return bindings;
}
exports.checkServiceAgentRole = checkServiceAgentRole;
exports.FIREBASE_MANAGED = "firebase-managed";
function isFunctionsManaged(secret) {
    return (secret.labels[exports.FIREBASE_MANAGED] === "true" || secret.labels[exports.FIREBASE_MANAGED] === "functions");
}
exports.isFunctionsManaged = isFunctionsManaged;
function isAppHostingManaged(secret) {
    return secret.labels[exports.FIREBASE_MANAGED] === "apphosting";
}
exports.isAppHostingManaged = isAppHostingManaged;
function ensureApi(options) {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    return ensureApiEnabled.ensure(projectId, (0, api_1.secretManagerOrigin)(), "secretmanager", true);
}
exports.ensureApi = ensureApi;
function labels(product = "functions") {
    return { [exports.FIREBASE_MANAGED]: product };
}
exports.labels = labels;
