"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCleanupPolicies = exports.checkCleanupPolicy = exports.hasCleanupOptOut = exports.hasSameCleanupPolicy = exports.setCleanupPolicy = exports.optOutRepository = exports.updateRepository = exports.generateCleanupPolicy = exports.parseDaysFromPolicy = exports.daysToSeconds = exports.findExistingPolicy = exports.getRepo = exports.getRepoCache = exports.makeRepoPath = exports.DEFAULT_CLEANUP_DAYS = exports.OPT_OUT_LABEL_KEY = exports.CLEANUP_POLICY_ID = exports.GCF_REPO_ID = void 0;
const artifactregistry = require("../gcp/artifactregistry");
const logger_1 = require("../logger");
const error_1 = require("../error");
exports.GCF_REPO_ID = "gcf-artifacts";
exports.CLEANUP_POLICY_ID = "firebase-functions-cleanup";
exports.OPT_OUT_LABEL_KEY = "firebase-functions-cleanup-opted-out";
exports.DEFAULT_CLEANUP_DAYS = 1;
const SECONDS_IN_DAY = 24 * 60 * 60;
function makeRepoPath(projectId, location, repoName = exports.GCF_REPO_ID) {
    return `projects/${projectId}/locations/${location}/repositories/${repoName}`;
}
exports.makeRepoPath = makeRepoPath;
exports.getRepoCache = new Map();
async function getRepo(projectId, location, forceRefresh = false, repoName = exports.GCF_REPO_ID) {
    const repoPath = makeRepoPath(projectId, location, repoName);
    if (!forceRefresh && exports.getRepoCache.has(repoPath)) {
        return exports.getRepoCache.get(repoPath);
    }
    const repo = await artifactregistry.getRepository(repoPath);
    exports.getRepoCache.set(repoPath, repo);
    return repo;
}
exports.getRepo = getRepo;
function findExistingPolicy(repository) {
    var _a;
    return (_a = repository === null || repository === void 0 ? void 0 : repository.cleanupPolicies) === null || _a === void 0 ? void 0 : _a[exports.CLEANUP_POLICY_ID];
}
exports.findExistingPolicy = findExistingPolicy;
function daysToSeconds(days) {
    const seconds = days * SECONDS_IN_DAY;
    return `${seconds}s`;
}
exports.daysToSeconds = daysToSeconds;
function parseDaysFromPolicy(olderThan) {
    const match = olderThan.match(/^(\d+)s$/);
    if (match && match[1]) {
        const seconds = parseInt(match[1], 10);
        return Math.floor(seconds / SECONDS_IN_DAY);
    }
    return;
}
exports.parseDaysFromPolicy = parseDaysFromPolicy;
function generateCleanupPolicy(daysToKeep) {
    return {
        [exports.CLEANUP_POLICY_ID]: {
            id: exports.CLEANUP_POLICY_ID,
            condition: {
                tagState: "ANY",
                olderThan: daysToSeconds(daysToKeep),
            },
            action: "DELETE",
        },
    };
}
exports.generateCleanupPolicy = generateCleanupPolicy;
async function updateRepository(repo) {
    try {
        await artifactregistry.updateRepository(repo);
    }
    catch (err) {
        if (err.status === 403) {
            throw new error_1.FirebaseError(`You don't have permission to update this repository.\n` +
                `To update repository settings, ask your administrator to grant you the ` +
                `Artifact Registry Administrator (roles/artifactregistry.admin) IAM role on the repository project.`, { original: err, exit: 1 });
        }
        else {
            throw new error_1.FirebaseError("Failed to update artifact registry repository", {
                original: err,
            });
        }
    }
}
exports.updateRepository = updateRepository;
async function optOutRepository(repository) {
    const policies = Object.assign({}, repository.cleanupPolicies);
    if (exports.CLEANUP_POLICY_ID in policies) {
        delete policies[exports.CLEANUP_POLICY_ID];
    }
    const update = {
        name: repository.name,
        labels: Object.assign(Object.assign({}, repository.labels), { [exports.OPT_OUT_LABEL_KEY]: "true" }),
        cleanupPolicies: policies,
    };
    await exports.updateRepository(update);
}
exports.optOutRepository = optOutRepository;
async function setCleanupPolicy(repository, daysToKeep) {
    const labels = Object.assign({}, repository.labels);
    delete labels[exports.OPT_OUT_LABEL_KEY];
    const update = {
        name: repository.name,
        cleanupPolicies: Object.assign(Object.assign({}, repository.cleanupPolicies), generateCleanupPolicy(daysToKeep)),
        cleanupPolicyDryRun: false,
        labels,
    };
    await exports.updateRepository(update);
}
exports.setCleanupPolicy = setCleanupPolicy;
function hasSameCleanupPolicy(repository, daysToKeep) {
    var _a, _b;
    const existingPolicy = findExistingPolicy(repository);
    if (!existingPolicy) {
        return false;
    }
    if (((_a = existingPolicy.condition) === null || _a === void 0 ? void 0 : _a.tagState) !== "ANY" || !((_b = existingPolicy.condition) === null || _b === void 0 ? void 0 : _b.olderThan)) {
        return false;
    }
    const existingSeconds = parseDaysFromPolicy(existingPolicy.condition.olderThan);
    return existingSeconds === daysToKeep;
}
exports.hasSameCleanupPolicy = hasSameCleanupPolicy;
function hasCleanupOptOut(repo) {
    return !!(repo.labels && repo.labels[exports.OPT_OUT_LABEL_KEY] === "true");
}
exports.hasCleanupOptOut = hasCleanupOptOut;
async function checkCleanupPolicy(projectId, locations) {
    if (locations.length === 0) {
        return { locationsToSetup: [], locationsWithErrors: [] };
    }
    const checkRepos = await Promise.allSettled(locations.map(async (location) => {
        try {
            const repository = await exports.getRepo(projectId, location);
            const hasPolicy = !!findExistingPolicy(repository);
            const hasOptOut = hasCleanupOptOut(repository);
            const hasOtherPolicies = repository.cleanupPolicies &&
                Object.keys(repository.cleanupPolicies).some((key) => key !== exports.CLEANUP_POLICY_ID);
            return {
                location,
                repository,
                hasPolicy,
                hasOptOut,
                hasOtherPolicies,
            };
        }
        catch (err) {
            logger_1.logger.debug(`Failed to check artifact cleanup policy for region ${location}:`, err);
            throw err;
        }
    }));
    const locationsToSetup = [];
    const locationsWithErrors = [];
    for (let i = 0; i < checkRepos.length; i++) {
        const result = checkRepos[i];
        if (result.status === "fulfilled") {
            if (!(result.value.hasPolicy || result.value.hasOptOut || result.value.hasOtherPolicies)) {
                locationsToSetup.push(result.value.location);
            }
        }
        else {
            locationsWithErrors.push(locations[i]);
        }
    }
    return { locationsToSetup, locationsWithErrors };
}
exports.checkCleanupPolicy = checkCleanupPolicy;
async function setCleanupPolicies(projectId, locations, daysToKeep) {
    if (locations.length === 0)
        return { locationsWithPolicy: [], locationsWithErrors: [] };
    const locationsWithPolicy = [];
    const locationsWithErrors = [];
    const setupRepos = await Promise.allSettled(locations.map(async (location) => {
        try {
            logger_1.logger.debug(`Setting up artifact cleanup policy for region ${location}`);
            const repo = await exports.getRepo(projectId, location);
            await exports.setCleanupPolicy(repo, daysToKeep);
            return location;
        }
        catch (err) {
            throw new error_1.FirebaseError("Failed to set up artifact cleanup policy", {
                original: err,
            });
        }
    }));
    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        const result = setupRepos[i];
        if (result.status === "rejected") {
            logger_1.logger.debug(`Failed to set up artifact cleanup policy for region ${location}:`, result.reason);
            locationsWithErrors.push(location);
        }
        else {
            locationsWithPolicy.push(location);
        }
    }
    return {
        locationsWithPolicy,
        locationsWithErrors,
    };
}
exports.setCleanupPolicies = setCleanupPolicies;
